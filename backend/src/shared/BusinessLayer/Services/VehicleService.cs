using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles vehicle management including
    /// creation, update, approval, rejection,
    /// retrieval, and soft deletion.
    /// Manages image upload and validation logic.
    /// </summary>
    public class VehicleService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;
        private readonly IIdentityUserClient _identityUserClient;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public VehicleService(
            IUnitOfWork uow,
            INotificationManager notificationManager,
            IConfiguration config,
            IIdentityUserClient identityUserClient)
        {
            _unitOfWork = uow;
            _notificationManager = notificationManager;
            _config = config;
            _identityUserClient = identityUserClient;
        }

        // ---------------- GET METHODS ----------------

        /// <summary>
        /// Retrieves all vehicles.
        /// </summary>
        public List<Vehicle> GetAllVehicles()
        {
            return _unitOfWork.VehicleRepo.GetAllVehicles() ?? new List<Vehicle>();
        }

        /// <summary>
        /// Retrieves a vehicle by ID.
        /// </summary>
        public Vehicle? GetVehicleById(int vehicleId)
        {
            return _unitOfWork.VehicleRepo.GetVehicleById(vehicleId);
        }

        /// <summary>
        /// Retrieves vehicles belonging to a specific company.
        /// </summary>
        public List<Vehicle> GetVehiclesByCompany(int companyId)
        {
            return _unitOfWork.VehicleRepo.GetVehiclesByCompanyId(companyId) ?? new List<Vehicle>();
        }

        /// <summary>
        /// Retrieves vehicles pending administrative approval.
        /// </summary>
        public List<Vehicle> GetPendingApprovalVehicles()
        {
            return _unitOfWork.VehicleRepo.GetPendingApprovalVehicles() ?? new List<Vehicle>();
        }

        public async Task<List<VehicleResponse>> GetAllVehicleResponsesAsync(
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            return await ToVehicleResponsesAsync(
                GetAllVehicles(),
                authorizationHeader,
                cancellationToken);
        }

        public async Task<VehicleResponse?> GetVehicleResponseByIdAsync(
            int vehicleId,
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            var vehicle = GetVehicleById(vehicleId);

            if (vehicle is null)
                return null;

            return await ToVehicleResponseAsync(
                vehicle,
                authorizationHeader,
                cancellationToken);
        }

        public async Task<VehicleResponse> ToVehicleResponseAsync(
            Vehicle vehicle,
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            var ownerCache = new Dictionary<int, UserSummaryResponse?>();

            return await MapVehicleAsync(
                vehicle,
                authorizationHeader,
                ownerCache,
                cancellationToken);
        }

        private async Task<List<VehicleResponse>> ToVehicleResponsesAsync(
            IEnumerable<Vehicle> vehicles,
            string? authorizationHeader,
            CancellationToken cancellationToken)
        {
            var ownerCache = new Dictionary<int, UserSummaryResponse?>();
            var responses = new List<VehicleResponse>();

            foreach (var vehicle in vehicles)
            {
                responses.Add(await MapVehicleAsync(
                    vehicle,
                    authorizationHeader,
                    ownerCache,
                    cancellationToken));
            }

            return responses;
        }

        private async Task<VehicleResponse> MapVehicleAsync(
            Vehicle vehicle,
            string? authorizationHeader,
            Dictionary<int, UserSummaryResponse?> ownerCache,
            CancellationToken cancellationToken)
        {
            var company = vehicle.TravelCompany
                ?? _unitOfWork.TravelCompanyRepo.GetById(vehicle.TravelCompanyId);

            return new VehicleResponse
            {
                VehicleId = vehicle.VehicleId,
                VehicleCode = vehicle.VehicleCode,
                TravelCompanyId = vehicle.TravelCompanyId,
                ModeOfTransport = vehicle.ModeOfTransport,
                VehicleModel = vehicle.VehicleModel,
                Capacity = vehicle.Capacity,
                VehicleImageUrl = vehicle.VehicleImageUrl,
                VehicleCondition = vehicle.VehicleCondition,
                ConditionVerified = vehicle.ConditionVerified,
                IsActive = vehicle.IsActive,
                CreatedOn = vehicle.CreatedOn,
                ModifiedOn = vehicle.ModifiedOn,
                ModifiedBy = vehicle.ModifiedBy,
                Description = vehicle.Description,
                TravelCompany = await MapTravelCompanyAsync(
                    company,
                    authorizationHeader,
                    ownerCache,
                    cancellationToken)
            };
        }

        private async Task<TravelCompanyResponse?> MapTravelCompanyAsync(
            TravelCompany? company,
            string? authorizationHeader,
            Dictionary<int, UserSummaryResponse?> ownerCache,
            CancellationToken cancellationToken)
        {
            if (company is null)
                return null;

            if (!ownerCache.TryGetValue(company.OwnerId, out var owner))
            {
                owner = await _identityUserClient.GetUserByIdAsync(
                    company.OwnerId,
                    authorizationHeader,
                    cancellationToken);

                ownerCache[company.OwnerId] = owner;
            }

            return new TravelCompanyResponse
            {
                TravelCompanyId = company.TravelCompanyId,
                OwnerId = company.OwnerId,
                CompanyName = company.CompanyName,
                Description = company.Description,
                IsActive = company.IsActive,
                CreatedOn = company.CreatedOn,
                Owner = owner
            };
        }

        // ---------------- ADD VEHICLE ----------------

        /// <summary>
        /// Creates a new vehicle.
        /// Validates company and image format.
        /// Saves vehicle image to disk and stores metadata.
        /// Vehicle remains inactive until approved.
        /// </summary>
        public async Task<Vehicle> AddVehicle(
            VehicleDetailsRequest vehicle,
            int ownerId)
        {
            if (vehicle == null)
                throw new ValidationAppException("Vehicle details are required.");

            vehicle.VehicleCode = vehicle.VehicleCode?.Trim().ToUpper() ?? string.Empty;
            vehicle.VehicleModel = vehicle.VehicleModel?.Trim();
            vehicle.Description = vehicle.Description?.Trim();
            vehicle.ModeOfTransport = NormalizeTransportMode(vehicle.ModeOfTransport);

            if (string.IsNullOrWhiteSpace(vehicle.VehicleCode))
                throw new ValidationAppException("Vehicle code is required.");

            if (string.IsNullOrWhiteSpace(vehicle.ModeOfTransport))
                throw new ValidationAppException("Invalid transport mode.");

            if (vehicle.Capacity <= 0)
                throw new ValidationAppException("Capacity must be greater than 0.");

            if (vehicle.VehicleImage == null || vehicle.VehicleImage.Length == 0)
                throw new ValidationAppException("Vehicle image is required.");

            if (_unitOfWork.VehicleRepo.GetVehicleByCode(vehicle.VehicleCode) != null)
                throw new ValidationAppException("Vehicle code already exists.");

            // Validate company existence
            var company = _unitOfWork.TravelCompanyRepo
                .GetById(vehicle.TravelCompanyId)
                ?? throw new Exception(_config["Vehicle:InvalidCompany"]!);

            if (company.OwnerId != ownerId)
                throw new ValidationAppException(_config["Vehicle:InvalidCompany"]!);

            // Validate image format
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var ext = Path.GetExtension(vehicle.VehicleImage.FileName).ToLower();

            if (!allowedExtensions.Contains(ext))
                throw new ValidationAppException(_config["Vehicle:InvalidImageFormat"]!);

            // Prepare storage folder
            string folderPath = Path.Combine(
                Directory.GetCurrentDirectory(),
                "Documents",
                "VehicleImages",
                $"Company_{vehicle.TravelCompanyId}"
            );

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            // Save image with unique filename
            string fileName = $"{Guid.NewGuid()}{ext}";
            string fullPath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await vehicle.VehicleImage.CopyToAsync(stream);
            }

            string imageUrl =
                $"/Documents/VehicleImages/Company_{vehicle.TravelCompanyId}/{fileName}";

            // Create vehicle entity
            var newVehicle = new Vehicle
            {
                VehicleCode = vehicle.VehicleCode,
                TravelCompanyId = vehicle.TravelCompanyId,
                ModeOfTransport = vehicle.ModeOfTransport,
                VehicleModel = vehicle.VehicleModel,
                Capacity = vehicle.Capacity,
                VehicleImageUrl = imageUrl,
                Description = vehicle.Description,
                ConditionVerified = false,
                IsActive = false
            };

            try
            {
                await _unitOfWork.VehicleRepo.AddVehicle(newVehicle, ownerId);
            }
            catch (DbUpdateException ex) when (IsUniqueVehicleConstraint(ex))
            {
                throw new ValidationAppException("Vehicle code already exists.");
            }

            // Notify owner
            await _notificationManager.NotifyAsync(
                ownerId,
                _config["Vehicle:AddedTitle"]!,
                _config["Vehicle:AddedMessage"]!
                    .Replace("{CODE}", newVehicle.VehicleCode)
            );

            return newVehicle;
        }

        private static string NormalizeTransportMode(string? mode)
        {
            return mode?.Trim().ToLowerInvariant() switch
            {
                "bus" => "Bus",
                "train" => "Train",
                "flight" => "Flight",
                _ => string.Empty
            };
        }

        private static bool IsUniqueVehicleConstraint(DbUpdateException ex)
        {
            var message = ex.InnerException?.Message ?? ex.Message;

            return message.Contains("uq_Vehicle_Code", StringComparison.OrdinalIgnoreCase) ||
                   message.Contains("UNIQUE KEY", StringComparison.OrdinalIgnoreCase);
        }

        // ---------------- UPDATE VEHICLE ----------------

        /// <summary>
        /// Updates vehicle details including capacity,
        /// description, and optional image replacement.
        /// </summary>
        public async Task UpdateVehicle(
            int vehicleId,
            VehicleDetailsUpdateRequest request,
            int modifiedBy)
        {
            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(vehicleId)
                ?? throw new NotFoundException(_config["Vehicle:NotFound"]!);

            // Update capacity if valid
            if (request.Capacity.HasValue && request.Capacity > 0)
                vehicle.Capacity = request.Capacity.Value;

            // Update description if provided
            if (!string.IsNullOrWhiteSpace(request.Description))
                vehicle.Description = request.Description;

            // Replace image if provided
            if (request.VehicleImage != null)
            {
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var ext = Path.GetExtension(request.VehicleImage.FileName).ToLower();

                if (!allowedExtensions.Contains(ext))
                    throw new ValidationAppException(_config["Vehicle:InvalidImageFormat"]!);

                string folderPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "Documents",
                    "VehicleImages",
                    $"Company_{vehicle.TravelCompanyId}"
                );

                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                string fileName = $"{Guid.NewGuid()}{ext}";
                string fullPath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await request.VehicleImage.CopyToAsync(stream);
                }

                vehicle.VehicleImageUrl =
                    $"/Documents/VehicleImages/Company_{vehicle.TravelCompanyId}/{fileName}";
            }

            vehicle.ModifiedBy = modifiedBy;
            vehicle.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.VehicleRepo.UpdateVehicle(vehicle, modifiedBy);
            _unitOfWork.Save();

            // Notify modifier
            await _notificationManager.NotifyAsync(
                modifiedBy,
                _config["Vehicle:UpdatedTitle"]!,
                _config["Vehicle:UpdatedMessage"]!
                    .Replace("{CODE}", vehicle.VehicleCode)
            );
        }

        // ---------------- ADMIN APPROVAL ----------------

        /// <summary>
        /// Approves a vehicle after verifying required documents.
        /// Activates vehicle and sets condition status.
        /// </summary>
        public async Task<bool> ApproveVehicle(int vehicleId, int adminId)
        {
            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(vehicleId)
                ?? throw new NotFoundException(_config["Vehicle:NotFound"]!);

            if (vehicle.VehicleDocument == null || vehicle.VehicleDocument.Count == 0)
                throw new Exception(_config["Vehicle:DocumentsRequired"]!);

            vehicle.ConditionVerified = true;
            vehicle.VehicleCondition = "Good";
            vehicle.IsActive = true;

            var travelCompany = _unitOfWork.TravelCompanyRepo
                .GetById(vehicle.TravelCompanyId);

            _unitOfWork.VehicleRepo.UpdateVehicle(vehicle, adminId);
            _unitOfWork.Save();
            await _notificationManager.NotifyAsync(
                travelCompany!.OwnerId,
                _config["Vehicle:ApprovedTitle"]!,
                _config["Vehicle:ApprovedMessage"]!
                    .Replace("{CODE}", vehicle.VehicleCode)
            );

            return true;
        }

        /// <summary>
        /// Rejects a vehicle during review.
        /// Deactivates vehicle and sets condition to Bad.
        /// </summary>
        public async Task<bool> RejectVehicle(int vehicleId, int adminId)
        {
            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(vehicleId)
                ?? throw new NotFoundException(_config["Vehicle:NotFound"]!);

            vehicle.ConditionVerified = false;
            vehicle.IsActive = false;
            vehicle.VehicleCondition = "Bad";

            _unitOfWork.VehicleRepo.UpdateVehicle(vehicle, adminId);
            _unitOfWork.Save();

            var travelCompany = _unitOfWork.TravelCompanyRepo
                .GetById(vehicle.TravelCompanyId);

            await _notificationManager.NotifyAsync(
                travelCompany!.OwnerId,
                _config["Vehicle:RejectedTitle"]!,
                _config["Vehicle:RejectedMessage"]!
                    .Replace("{CODE}", vehicle.VehicleCode)
            );

            return true;
        }

        // ---------------- SOFT DELETE ----------------

        /// <summary>
        /// Soft deletes a vehicle by marking it inactive.
        /// Sends notification after deletion.
        /// </summary>
        public async Task<bool> DeleteVehicle(int vehicleId, int modifiedBy)
        {
            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(vehicleId)
                ?? throw new NotFoundException(_config["Vehicle:NotFound"]!);

            vehicle.IsActive = false;
            vehicle.ModifiedBy = modifiedBy;
            vehicle.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.VehicleRepo.UpdateVehicle(vehicle, modifiedBy);
            _unitOfWork.Save();

            await _notificationManager.NotifyAsync(
                modifiedBy,
                _config["Vehicle:DeletedTitle"]!,
                _config["Vehicle:DeletedMessage"]!
                    .Replace("{CODE}", vehicle.VehicleCode)
            );

            return true;
        }
    }
}
