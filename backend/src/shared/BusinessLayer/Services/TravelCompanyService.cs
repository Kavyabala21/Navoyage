using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles travel company management including
    /// creation, retrieval, update, and deactivation.
    /// Ensures ownership validation and notification handling.
    /// </summary>
    public class TravelCompanyService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;
        private readonly IIdentityUserClient _identityUserClient;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public TravelCompanyService(
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

        // ---------------- CREATE COMPANY ----------------

        /// <summary>
        /// Creates a new travel company for an owner.
        /// Ensures company name is provided and
        /// that the owner does not already have a company.
        /// Sends notification upon successful creation.
        /// </summary>
        public async Task<TravelCompany> CreateCompany(
            string companyName,
            string? description,
            int ownerId)
        {
            // Validate company name
            if (string.IsNullOrWhiteSpace(companyName))
                throw new Exception(_config["TravelCompany:NameRequired"]);

            // Ensure owner does not already have a company
            var existing = _unitOfWork.TravelCompanyRepo.GetByOwnerId(ownerId);
            if (existing != null)
                throw new Exception(_config["TravelCompany:AlreadyExists"]);

            // Create new company entity
            var company = new TravelCompany
            {
                OwnerId = ownerId,
                CompanyName = companyName.Trim(),
                Description = description?.Trim(),
                IsActive = true,
                CreatedOn = DateTime.UtcNow.AddHours(5.5)
            };

            // Persist company
            await _unitOfWork.TravelCompanyRepo.Add(company);
            _unitOfWork.Save();

            // Notify owner
            string title = _config["TravelCompany:CreatedTitle"]!;
            string message = _config["TravelCompany:CreatedMessage"]!
                .Replace("{CompanyName}", company.CompanyName);

            await _notificationManager.NotifyAsync(ownerId, title, message);

            return company;
        }

        // ---------------- GET COMPANY ----------------

        /// <summary>
        /// Retrieves the company associated with a specific owner.
        /// Returns null if no company exists.
        /// </summary>
        public TravelCompany? GetMyCompany(int ownerId)
        {
            return _unitOfWork.TravelCompanyRepo.GetByOwnerId(ownerId);
        }

        public async Task<TravelCompany> GetOrCreateMyCompany(int ownerId, string? ownerName)
        {
            var existing = _unitOfWork.TravelCompanyRepo.GetByOwnerId(ownerId);
            if (existing != null)
                return existing;

            var companyName = BuildDefaultCompanyName(ownerName, ownerId);

            var company = new TravelCompany
            {
                OwnerId = ownerId,
                CompanyName = companyName,
                Description = "Created during company owner setup.",
                IsActive = true,
                CreatedOn = DateTime.UtcNow.AddHours(5.5)
            };

            await _unitOfWork.TravelCompanyRepo.Add(company);
            _unitOfWork.Save();

            return company;
        }

        /// <summary>
        /// Retrieves all travel companies in the system.
        /// </summary>
        public List<TravelCompany> GetAllCompanies()
        {
            return _unitOfWork.TravelCompanyRepo.GetAll() ?? new List<TravelCompany>();
        }

        public async Task<TravelCompanyResponse?> ToResponseAsync(
            TravelCompany? company,
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            if (company is null)
                return null;

            var owner = await _identityUserClient.GetUserByIdAsync(
                company.OwnerId,
                authorizationHeader,
                cancellationToken);

            return MapTravelCompany(company, owner);
        }

        public async Task<List<TravelCompanyResponse>> GetAllCompanyResponsesAsync(
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            var companies = GetAllCompanies();
            var ownerCache = new Dictionary<int, UserSummaryResponse?>();
            var responses = new List<TravelCompanyResponse>();

            foreach (var company in companies)
            {
                if (!ownerCache.TryGetValue(company.OwnerId, out var owner))
                {
                    owner = await _identityUserClient.GetUserByIdAsync(
                        company.OwnerId,
                        authorizationHeader,
                        cancellationToken);

                    ownerCache[company.OwnerId] = owner;
                }

                responses.Add(MapTravelCompany(company, owner));
            }

            return responses;
        }

        private static TravelCompanyResponse MapTravelCompany(
            TravelCompany company,
            UserSummaryResponse? owner)
        {
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

        private string BuildDefaultCompanyName(string? ownerName, int ownerId)
        {
            var baseName = string.IsNullOrWhiteSpace(ownerName)
                ? $"Travel Company {ownerId}"
                : ownerName.Trim();

            if (baseName.Length > 150)
                baseName = baseName[..150];

            if (_unitOfWork.TravelCompanyRepo.GetByCompanyName(baseName) == null)
                return baseName;

            var suffix = $" {ownerId}";
            var maxBaseLength = 150 - suffix.Length;
            var trimmedBaseName = baseName.Length > maxBaseLength
                ? baseName[..maxBaseLength]
                : baseName;
            var uniqueName = $"{trimmedBaseName}{suffix}";

            return uniqueName;
        }

        // ---------------- UPDATE COMPANY ----------------

        /// <summary>
        /// Updates an existing travel company.
        /// Ensures company exists and name is valid.
        /// Sends notification upon successful update.
        /// </summary>
        public async Task UpdateCompany(
            int companyId,
            string name,
            string? description,
            int userId)
        {
            // Validate company name
            if (string.IsNullOrWhiteSpace(name))
                throw new Exception(_config["TravelCompany:NameRequired"]);

            // Retrieve existing company
            var company = _unitOfWork.TravelCompanyRepo.GetById(companyId)
                ?? throw new Exception(_config["TravelCompany:NotFound"]);

            // Update fields
            company.CompanyName = name.Trim();
            company.Description = description?.Trim();

            // Persist changes
            _unitOfWork.TravelCompanyRepo.Update(company);
            _unitOfWork.Save();

            // Notify user
            string title = _config["TravelCompany:UpdatedTitle"]!;
            string message = _config["TravelCompany:UpdatedMessage"]!
                .Replace("{CompanyName}", company.CompanyName);

            await _notificationManager.NotifyAsync(userId, title, message);
        }

        // ---------------- DEACTIVATE COMPANY ----------------

        /// <summary>
        /// Deactivates an existing travel company.
        /// Ensures company exists and is currently active.
        /// Sends notification upon successful deactivation.
        /// </summary>
        public async Task DeactivateCompany(int companyId, int userId)
        {
            // Retrieve company
            var company = _unitOfWork.TravelCompanyRepo.GetById(companyId)
                ?? throw new Exception(_config["TravelCompany:NotFound"]);

            // Prevent duplicate deactivation
            if (!company.IsActive)
                throw new Exception(_config["TravelCompany:AlreadyDeactivated"]);

            // Deactivate company
            company.IsActive = false;

            _unitOfWork.TravelCompanyRepo.Update(company);
            _unitOfWork.Save();

            // Notify user
            string title = _config["TravelCompany:DeactivatedTitle"]!;
            string message = _config["TravelCompany:DeactivatedMessage"]!
                .Replace("{CompanyName}", company.CompanyName);

            await _notificationManager.NotifyAsync(userId, title, message);
        }
    }
}
