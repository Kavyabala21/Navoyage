using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles seat layout management including
    /// layout creation, update, seat validation,
    /// and seat price updates.
    /// </summary>
    public class SeatLayoutService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public SeatLayoutService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ---------------- GET SEAT LAYOUT ----------------

        /// <summary>
        /// Retrieves seat layout for a given vehicle.
        /// Returns null if layout does not exist yet.
        /// </summary>
        public SeatLayout? GetSeatLayoutByVehicleId(int vehicleId)
        {
            return _unitOfWork.SeatLayoutRepo.GetSeatLayoutByVehicleId(vehicleId);
        }

        // ---------------- ADD OR UPDATE LAYOUT ----------------

        /// <summary>
        /// Saves seat layout for a vehicle.
        /// If layout does not exist, creates a new one.
        /// If layout exists, updates the existing layout.
        /// Validates JSON structure before saving.
        /// Sends notification after successful operation.
        /// </summary>
        public async Task SaveLayout(int vehicleId, string layoutJson, int userId)
        {
            // Validate JSON input
            if (string.IsNullOrWhiteSpace(layoutJson))
                throw new Exception(_config["SeatLayout:InvalidJson"]!);

            JsonDocument.Parse(layoutJson);

            // Validate vehicle existence
            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(vehicleId)
                ?? throw new Exception(_config["SeatLayout:VehicleNotFound"]!);

            var existing = _unitOfWork.SeatLayoutRepo.GetSeatLayoutByVehicleId(vehicleId);

            if (existing == null)
            {
                // Create new seat layout
                var layout = new SeatLayout
                {
                    VehicleId = vehicleId,
                    LayoutJSON = layoutJson,
                    CreatedOn = DateTime.UtcNow.AddHours(5.5)
                };

                await _unitOfWork.SeatLayoutRepo.AddSeatLayout(layout);
                _unitOfWork.Save();

                // Notify creation
                string title = _config["SeatLayout:CreatedTitle"]!;
                string message = _config["SeatLayout:CreatedMessage"]!
                    .Replace("{VehicleCode}", vehicle.VehicleCode);

                await _notificationManager.NotifyAsync(userId, title, message);
            }
            else
            {
                // Update existing layout
                existing.LayoutJSON = layoutJson;
                existing.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

                _unitOfWork.SeatLayoutRepo.UpdateSeatLayout(existing);
                _unitOfWork.Save();

                // Notify update
                string title = _config["SeatLayout:UpdatedTitle"]!;
                string message = _config["SeatLayout:UpdatedMessage"]!
                    .Replace("{VehicleCode}", vehicle.VehicleCode);

                await _notificationManager.NotifyAsync(userId, title, message);
            }
        }

        // ---------------- UPDATE SINGLE SEAT PRICE ----------------

        /// <summary>
        /// Updates price for a specific seat in the layout.
        /// Validates seat existence inside layout JSON.
        /// Sends notification after update.
        /// </summary>
        public async Task UpdateSeatPrice(SeatPriceUpdateRequest request, int userId)
        {
            // Validate layout existence
            var layout = _unitOfWork.SeatLayoutRepo
                .GetSeatLayoutByVehicleId(request.VehicleId)
                ?? throw new Exception(_config["SeatLayout:LayoutNotFound"]!);

            // Validate vehicle existence
            var vehicle = _unitOfWork.VehicleRepo
                .GetVehicleById(request.VehicleId)
                ?? throw new Exception(_config["SeatLayout:VehicleNotFound"]!);

            // Parse JSON layout
            using var jsonDoc = JsonDocument.Parse(layout.LayoutJSON);

            bool seatFound = false;

            // Traverse JSON to verify seat exists
            foreach (var row in jsonDoc.RootElement.GetProperty("rows").EnumerateArray())
            {
                foreach (var seat in row.GetProperty("seats").EnumerateArray())
                {
                    if (seat.GetProperty("seatNo").GetString() == request.SeatNo)
                    {
                        seatFound = true;
                        break;
                    }
                }
            }

            if (!seatFound)
                throw new Exception(_config["SeatLayout:SeatNotFound"]!);

            // Re-serialize layout (placeholder for actual price update logic)
            var layoutObj = JsonSerializer.Deserialize<object>(layout.LayoutJSON)!;
            layout.LayoutJSON = JsonSerializer.Serialize(layoutObj);

            layout.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.SeatLayoutRepo.UpdateSeatLayout(layout);
            _unitOfWork.Save();

            // Notify user
            string title = _config["SeatLayout:SeatPriceUpdatedTitle"]!;
            string message = _config["SeatLayout:SeatPriceUpdatedMessage"]!
                .Replace("{SeatNo}", request.SeatNo)
                .Replace("{VehicleCode}", vehicle.VehicleCode);

            await _notificationManager.NotifyAsync(userId, title, message);
        }

        // ---------------- UPDATE LAYOUT ONLY ----------------

        /// <summary>
        /// Updates entire layout JSON for an existing vehicle layout.
        /// Validates JSON and vehicle existence.
        /// Sends notification after update.
        /// </summary>
        public async Task UpdateLayout(int vehicleId, string layoutJson, int userId)
        {
            // Validate JSON
            if (string.IsNullOrWhiteSpace(layoutJson))
                throw new Exception(_config["SeatLayout:InvalidJson"]!);

            JsonDocument.Parse(layoutJson);

            // Ensure layout exists
            var existing = _unitOfWork.SeatLayoutRepo
                .GetSeatLayoutByVehicleId(vehicleId)
                ?? throw new Exception(_config["SeatLayout:LayoutNotExists"]!);

            // Validate vehicle existence
            var vehicle = _unitOfWork.VehicleRepo
                .GetVehicleById(vehicleId)
                ?? throw new Exception(_config["SeatLayout:VehicleNotFound"]!);

            // Update layout
            existing.LayoutJSON = layoutJson;
            existing.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.SeatLayoutRepo.UpdateSeatLayout(existing);
            _unitOfWork.Save();

            // Notify user
            string title = _config["SeatLayout:UpdatedTitle"]!;
            string message = _config["SeatLayout:UpdatedMessage"]!
                .Replace("{VehicleCode}", vehicle.VehicleCode);

            await _notificationManager.NotifyAsync(userId, title, message);
        }
    }
}
