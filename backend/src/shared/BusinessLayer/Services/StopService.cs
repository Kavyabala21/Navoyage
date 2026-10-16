using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles stop management including retrieval,
    /// creation, update, and deletion of stops.
    /// Ensures validation and notification handling.
    /// </summary>
    public class StopService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public StopService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ---------------- GET ALL STOPS ----------------

        /// <summary>
        /// Retrieves all stops ordered alphabetically by stop name.
        /// </summary>
        public IEnumerable<Stop> GetAllStops()
        {
            return (_unitOfWork.StopRepo
                .GetAllStops() ?? Enumerable.Empty<Stop>())
                .OrderBy(s => s.StopName);
        }

        /// <summary>
        /// Retrieves a stop by its ID.
        /// Throws exception if stop does not exist.
        /// </summary>
        public Stop GetStopById(int id)
        {
            return _unitOfWork.StopRepo.GetStopById(id)
                ?? throw new Exception(_config["Stop:NotFound"]!);
        }

        // ---------------- CREATE STOP ----------------

        /// <summary>
        /// Creates a new stop.
        /// Ensures stop name is unique.
        /// Sends notification upon successful creation.
        /// </summary>
        public async Task<Stop> CreateStop(Stop stop, int userId)
        {
            // Validate uniqueness of stop name
            if (_unitOfWork.StopRepo.GetStopByName(stop.StopName) != null)
                throw new AlreadyExistsException(_config["Stop:AlreadyExists"]!);

            // Persist stop
            await _unitOfWork.StopRepo.AddStop(stop);
            _unitOfWork.Save();

            // Notify user
            string title = _config["Stop:CreatedTitle"]!;
            string message = _config["Stop:CreatedMessage"]!
                .Replace("{StopName}", stop.StopName);

            await _notificationManager.NotifyAsync(userId, title, message);

            return stop;
        }

        // ---------------- UPDATE STOP ----------------

        /// <summary>
        /// Updates an existing stop.
        /// Throws exception if stop does not exist.
        /// Sends notification upon successful update.
        /// </summary>
        public async Task<Stop> UpdateStop(int stopid, Stop updated, int userId)
        {
            // Retrieve existing stop
            var stop = _unitOfWork.StopRepo.GetStopById(stopid)
                ?? throw new Exception(_config["Stop:NotFound"]!);

            var routeStopPoint = _unitOfWork.RouteStopPointRepo.GetRouteStopPointByStopId(stopid);
            if(routeStopPoint !=null)
                throw new ApplicationException(_config["Stop:Can'tUpdate"]);
            // Update fields
            stop.StopName = updated.StopName;
            stop.Latitude = updated.Latitude;
            stop.Longitude = updated.Longitude;
            stop.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            // Persist changes
            _unitOfWork.StopRepo.UpdateStop(stop);
            _unitOfWork.Save();

            // Notify user
            string title = _config["Stop:UpdatedTitle"]!;
            string message = _config["Stop:UpdatedMessage"]!
                .Replace("{StopName}", stop.StopName);

            await _notificationManager.NotifyAsync(userId, title, message);

            return stop;
        }

        // ---------------- DELETE STOP ----------------

        /// <summary>
        /// Deletes an existing stop.
        /// Throws exception if stop does not exist.
        /// Sends notification upon successful deletion.
        /// </summary>
        public async Task<bool> DeleteStop(int stopId, int userId)
        {
            // Retrieve existing stop
            var stop = _unitOfWork.StopRepo.GetStopById(stopId)
                ?? throw new Exception(_config["Stop:NotFound"]!);
            var routeStopPoint = _unitOfWork.RouteStopPointRepo.GetRouteStopPointByStopId(stopId);
            if(routeStopPoint!=null)
             throw new ApplicationException(_config["Stop:Can'tDelete"]);
            // Delete stop
            _unitOfWork.StopRepo.DeleteStop(stop);
            _unitOfWork.Save();

            // Notify user
            string title = _config["Stop:DeletedTitle"]!;
            string message = _config["Stop:DeletedMessage"]!
                .Replace("{StopName}", stop.StopName);

            await _notificationManager.NotifyAsync(userId, title, message);

            return true;
        }
    }
}
