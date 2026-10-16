using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles user management including creation,
    /// retrieval, update, activation/deactivation,
    /// password hashing, and login validation.
    /// </summary>
    public class UserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public UserService(
            IUnitOfWork uow,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = uow;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ---------------- GET USERS ----------------

        /// <summary>
        /// Retrieves all active users.
        /// </summary>
        public List<User> GetAllUsers()
        {
            return (_unitOfWork.UserRepo
                .GetAllUsers() ?? new List<User>())
                .Where(u => u.IsActive)
                .ToList();
        }

        /// <summary>
        /// Retrieves a user by ID.
        /// </summary>
        public User? GetUserById(int userId)
        {
            return _unitOfWork.UserRepo.GetUserById(userId);
        }

        /// <summary>
        /// Retrieves a user by email.
        /// </summary>
        public User? GetUserByEmail(string email)
        {
            return _unitOfWork.UserRepo.GetUserByEmail(email);
        }

        /// <summary>
        /// Retrieves a user by username.
        /// </summary>
        public User? GetUserByName(string name)
        {
            return _unitOfWork.UserRepo.GetUserByName(name);
        }

        // ---------------- PASSWORD HASHING ----------------

        /// <summary>
        /// Hashes a password using SHA256 algorithm.
        /// </summary>
        private static string HashPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ValidationAppException("Password cannot be empty.");

            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(bytes);
        }

        // ---------------- CREATE USER ----------------

        /// <summary>
        /// Creates a new user.
        /// Hashes password and initializes metadata.
        /// </summary>
        public async Task<bool> AddUser(User user)
        {
            user.FullName = user.FullName?.Trim() ?? string.Empty;
            user.Email = user.Email?.Trim() ?? string.Empty;
            user.PhoneNumber = user.PhoneNumber?.Trim() ?? string.Empty;

            if (_unitOfWork.UserRepo.GetUserByName(user.FullName) != null)
                throw new ValidationAppException("Username already exists.");

            if (_unitOfWork.UserRepo.GetUserByEmail(user.Email) != null)
                throw new ValidationAppException("Email already exists.");

            if (_unitOfWork.UserRepo.GetUserByPhoneNumber(user.PhoneNumber) != null)
                throw new ValidationAppException("Phone number already exists.");

            user.Password = HashPassword(user.Password);
            user.CreatedOn = DateTime.UtcNow.AddHours(5.5);
            user.IsActive = true;

            try
            {
                await _unitOfWork.UserRepo.AddUser(user);
                _unitOfWork.Save();
            }
            catch (DbUpdateException ex) when (IsUniqueUserConstraint(ex))
            {
                throw new ValidationAppException(GetDuplicateUserMessage(ex));
            }

            return true;
        }

        private static bool IsUniqueUserConstraint(DbUpdateException ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;

            return message.Contains("uq_User", StringComparison.OrdinalIgnoreCase) ||
                   message.Contains("uk_User", StringComparison.OrdinalIgnoreCase) ||
                   message.Contains("UNIQUE KEY", StringComparison.OrdinalIgnoreCase);
        }

        private static string GetDuplicateUserMessage(DbUpdateException ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;

            if (message.Contains("Phone", StringComparison.OrdinalIgnoreCase))
                return "Phone number already exists.";

            if (message.Contains("Email", StringComparison.OrdinalIgnoreCase))
                return "Email already exists.";

            if (message.Contains("UserName", StringComparison.OrdinalIgnoreCase) ||
                message.Contains("FullName", StringComparison.OrdinalIgnoreCase))
            {
                return "Username already exists.";
            }

            return "User already exists.";
        }

        // ---------------- UPDATE USER ----------------

        /// <summary>
        /// Updates user profile information.
        /// Allows updating email, phone, active status,
        /// and password (if provided).
        /// Sends notification after successful update.
        /// </summary>
        public async Task<bool> UpdateUser(int id, int authId, User updateModel)
        {
            // Retrieve existing user
            var existing = _unitOfWork.UserRepo.GetUserById(id)
                ?? throw new NotFoundException(_config["User:NotFound"]!);

            // Update fields conditionally
            existing.Email = updateModel.Email ?? existing.Email;
            existing.IsActive = updateModel.IsActive;
            existing.PhoneNumber = updateModel.PhoneNumber ?? existing.PhoneNumber;

            // Update password if provided
            if (!string.IsNullOrWhiteSpace(updateModel.Password))
                existing.Password = HashPassword(updateModel.Password);

            existing.ModifiedBy = authId;
            existing.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.UserRepo.UpdateUser(id, authId, existing);
            _unitOfWork.Save();

            // Notify user about profile update
            string title = _config["User:ProfileUpdatedTitle"]!;
            string message = _config["User:ProfileUpdatedMessage"]!;

            await _notificationManager.NotifyAsync(id, title, message);

            return true;
        }

        // ---------------- ACTIVATE / DEACTIVATE USER ----------------

        /// <summary>
        /// Toggles user active status.
        /// If active, deactivates; if inactive, activates.
        /// </summary>
        public async Task<bool> DeleteUser(int id, int modifiedBy)
        {
            // Retrieve user
            var user = _unitOfWork.UserRepo.GetUserById(id)
                ?? throw new NotFoundException(_config["User:NotFound"]!);

            // Toggle active status
            user.IsActive = !user.IsActive;
            user.ModifiedBy = modifiedBy;
            user.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.UserRepo.UpdateUser(id, modifiedBy, user);
            _unitOfWork.Save();

            return true;
        }

        // ---------------- LOGIN VALIDATION ----------------

        /// <summary>
        /// Validates login credentials.
        /// Supports login via username, email, or phone number.
        /// Verifies password hash and active status.
        /// </summary>
        public User ValidateLogin(
     string? username,
     string? password,
     string? email,
     string? phoneNumber,
     string? loginIdentifier = null)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ValidationAppException("Password is required.");

            User? user = ResolveLoginUser(loginIdentifier);

            if (user == null && !string.IsNullOrWhiteSpace(username))
                user = _unitOfWork.UserRepo.GetUserByName(username.Trim());

            if (user == null && !string.IsNullOrWhiteSpace(email))
                user = _unitOfWork.UserRepo.GetUserByEmail(email.Trim());

            if (user == null && !string.IsNullOrWhiteSpace(phoneNumber))
                user = ResolvePhoneLogin(phoneNumber);

            if (user == null)
                throw new ValidationAppException(_config["User:InvalidCredentials"]!);

            string hashedInputPassword = HashPassword(password);

            if (!string.Equals(user.Password, hashedInputPassword))
                throw new ValidationAppException(_config["User:InvalidPassword"]!);

            if (!user.IsActive)
                throw new UnauthorizedActionException(_config["User:Inactive"]!);

            return user;
        }

        private User? ResolveLoginUser(string? loginIdentifier)
        {
            if (string.IsNullOrWhiteSpace(loginIdentifier))
                return null;

            var identifier = loginIdentifier.Trim();

            if (identifier.Contains('@'))
                return _unitOfWork.UserRepo.GetUserByEmail(identifier);

            var phoneUser = ResolvePhoneLogin(identifier);
            if (phoneUser != null)
                return phoneUser;

            return _unitOfWork.UserRepo.GetUserByName(identifier);
        }

        private User? ResolvePhoneLogin(string phoneNumber)
        {
            foreach (var candidate in BuildPhoneCandidates(phoneNumber))
            {
                var user = _unitOfWork.UserRepo.GetUserByPhoneNumber(candidate);
                if (user != null)
                    return user;
            }

            return null;
        }

        private static IEnumerable<string> BuildPhoneCandidates(string phoneNumber)
        {
            var trimmed = phoneNumber.Trim();
            var digits = Regex.Replace(trimmed, @"\D", "");

            yield return trimmed;

            if (digits.Length == 10)
                yield return $"+91-{digits}";

            if (digits.Length == 12 && digits.StartsWith("91"))
                yield return $"+91-{digits[2..]}";
        }
    }
}
