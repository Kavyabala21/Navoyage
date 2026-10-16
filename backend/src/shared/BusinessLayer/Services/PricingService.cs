using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles pricing management including creation,
    /// updating, validation, and retrieval of pricing rules.
    /// </summary>
    public class PricingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public PricingService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ---------------- ADD PRICING ----------------

        /// <summary>
        /// Adds a new pricing rule.
        /// Validates pricing data, persists it,
        /// and notifies the admin user.
        /// </summary>
        public async Task AddPricing(Pricing pricing, int adminUserId)
        {
            // Validate pricing inputs
            ValidatePricing(pricing);

            // Set creation timestamp
            pricing.CreatedOn = DateTime.UtcNow.AddHours(5.5);

            // Persist pricing rule
            _unitOfWork.PricingRepo.AddPricing(pricing);
            _unitOfWork.Save();

            // Prepare notification
            string title = _config["Pricing:AddedTitle"]!;
            string message = _config["Pricing:AddedMessage"]!
                ?.Replace("{SeatClass}", pricing.SeatClass)!;

            // Notify admin
            await _notificationManager.NotifyAsync(
                adminUserId,
                title,
                message
            );
        }

        // ---------------- UPDATE PRICING ----------------

        /// <summary>
        /// Updates an existing pricing rule.
        /// Validates input, updates fields,
        /// and notifies the admin user.
        /// </summary>
        public async Task UpdatePricing(Pricing model, int adminUserId)
        {
            // Retrieve existing pricing record
            var existing = _unitOfWork.PricingRepo
                .GetPricingById(model.PricingId)
                ?? throw new Exception(_config["Pricing:NotFound"]);

            // Validate updated pricing data
            ValidatePricing(model);

            // Update pricing fields
            existing.SeatClass = model.SeatClass;
            existing.BasePrice = model.BasePrice;
            existing.SeasonType = model.SeasonType;
            existing.EffectiveFrom = model.EffectiveFrom;
            existing.EffectiveTo = model.EffectiveTo;

            // Persist changes
            _unitOfWork.PricingRepo.UpdatePricing(existing);
            _unitOfWork.Save();

            // Prepare notification
            string title = _config["Pricing:UpdatedTitle"]!;
            string message = _config["Pricing:UpdatedMessage"]!
                ?.Replace("{SeatClass}", existing.SeatClass)!;

            // Notify admin
            await _notificationManager.NotifyAsync(
                adminUserId,
                title,
                message
            );
        }

        // ---------------- VALIDATION ----------------

        /// <summary>
        /// Validates pricing rules.
        /// Ensures base price is positive and
        /// effective date range is valid.
        /// </summary>
        private void ValidatePricing(Pricing pricing)
        {
            // Base price must be greater than zero
            if (pricing.BasePrice <= 0)
                throw new Exception(_config["Pricing:InvalidBasePrice"]);

            // EffectiveTo must not be earlier than EffectiveFrom
            if (pricing.EffectiveTo.HasValue &&
                pricing.EffectiveTo < pricing.EffectiveFrom)
                throw new Exception(_config["Pricing:InvalidEffectiveDates"]);
        }

        // ---------------- RETRIEVE PRICING ----------------

        /// <summary>
        /// Retrieves all pricing rules.
        /// </summary>
        public List<Pricing> GetAll()
        {
            return _unitOfWork.PricingRepo.GetAllPricings() ?? new List<Pricing>();
        }

        /// <summary>
        /// Retrieves a pricing rule by its ID.
        /// Throws exception if not found.
        /// </summary>
        public Pricing GetById(int id)
        {
            return _unitOfWork.PricingRepo.GetPricingById(id)
                ?? throw new Exception(_config["Pricing:NotFound"]);
        }

        /// <summary>
        /// Retrieves pricing rules associated with a specific vehicle.
        /// </summary>
        public List<Pricing> GetByVehicle(int vehicleId)
        {
            return _unitOfWork.PricingRepo.GetPricingByVehicleId(vehicleId) ?? new List<Pricing>();
        }
    }
}
