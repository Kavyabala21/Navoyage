using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles management of route stop points including
    /// retrieval, creation, update, and soft deletion.
    /// Ensures proper validation and sequence integrity.
    /// </summary>
    public class RouteStopPointService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public RouteStopPointService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ================= GET ALL =================

        /// <summary>
        /// Retrieves all route stop points in the system.
        /// </summary>
        public List<RouteStopPoint> GetAllRouteStopPoints()
        {
            return _unitOfWork.RouteStopPointRepo.GetAllRouteStopPoints() ?? new List<RouteStopPoint>();
        }

        // ================= GET BY ID =================

        /// <summary>
        /// Retrieves a specific route stop point by its ID.
        /// Returns null if not found.
        /// </summary>
        public RouteStopPoint? GetRouteStopPointById(int id)
        {
            return _unitOfWork.RouteStopPointRepo.GetRouteStopPointById(id);
        }

        /// <summary>
        /// Retrieves all stop points associated with a specific route.
        /// </summary>
        public List<RouteStopPoint> GetRouteStopPointsByRouteId(int routeId)
        {
            return _unitOfWork.RouteStopPointRepo.GetByRouteId(routeId) ?? new List<RouteStopPoint>();
        }

        // ================= ADD =================

        /// <summary>
        /// Adds a new stop point to a route.
        /// Validates input data, route existence,
        /// and ensures sequence order uniqueness.
        /// </summary>
        public async Task<bool> AddRouteStopPoint(RouteStopPoint model, int createdBy)
        {
            if (model == null)
                throw new Exception(_config["RouteStopPoint:InvalidData"]!);

            var route = _unitOfWork.RoutesRepo.GetRouteById(model.RouteId)
                ?? throw new Exception(_config["RouteStopPoint:RouteNotFound"]!);

            var existingStops = _unitOfWork.RouteStopPointRepo.GetByRouteId(model.RouteId);

            if (existingStops.Any(s => s.SequenceOrder == model.SequenceOrder))
                throw new Exception(_config["RouteStopPoint:SequenceExists"]!);

            model.CreatedOn = DateTime.UtcNow.AddHours(5.5);
            model.CreatedBy = createdBy;
            model.IsActive = true;

            // -------- ADD ORIGINAL --------
            await _unitOfWork.RouteStopPointRepo.AddRouteStopPoint(model);
            _unitOfWork.Save();

            // -------- FIND REVERSE ROUTE --------
            var reverseRoute = _unitOfWork.RoutesRepo
                .GetAllRoutes()
                .FirstOrDefault(r => r.ParentRouteId == model.RouteId);

            if (reverseRoute != null)
            {
                // Get UPDATED forward stops (including new one)
                var forwardStops = _unitOfWork.RouteStopPointRepo
                    .GetByRouteId(model.RouteId)
                    .Where(x => x.IsActive)
                    .OrderBy(x => x.SequenceOrder)
                    .ToList();

                int total = forwardStops.Count;

                // Find index of current stop
                int index = forwardStops.FindIndex(x => x.StopId == model.StopId);

                int reverseOrder = total - index;

                var reverseStop = new RouteStopPoint
                {
                    RouteId = reverseRoute.RouteId,
                    StopId = model.StopId,
                    SequenceOrder = reverseOrder,
                    CreatedOn = DateTime.UtcNow.AddHours(5.5),
                    CreatedBy = createdBy,
                    IsActive = true
                };

                await _unitOfWork.RouteStopPointRepo.AddRouteStopPoint(reverseStop);
            }
            _unitOfWork.Save();

            return true;
        }

        // ================= UPDATE =================

        /// <summary>
        /// Updates an existing route stop point.
        /// Validates existence and associated route.
        /// Sends notification upon successful update.
        /// </summary>
        public async Task<bool> UpdateRouteStopPoint(RouteStopPoint model, int modifiedBy)
        {
            if (model == null)
                throw new Exception(_config["RouteStopPoint:InvalidData"]!);

            var existing = _unitOfWork.RouteStopPointRepo
                .GetRouteStopPointById(model.RouteStopPointId)
                ?? throw new Exception(_config["RouteStopPoint:NotFound"]!);

            var route = _unitOfWork.RoutesRepo.GetRouteById(model.RouteId)
                ?? throw new Exception(_config["RouteStopPoint:RouteNotFound"]!);

            existing.StopId = model.StopId;
            existing.SequenceOrder = model.SequenceOrder;
            existing.ModifiedBy = modifiedBy;
            existing.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

           _unitOfWork.RouteStopPointRepo.UpdateRouteStopPoint(existing);

            // -------- UPDATE REVERSE --------
            var reverseRoute = _unitOfWork.RoutesRepo
                .GetAllRoutes()
                .FirstOrDefault(r => r.ParentRouteId == model.RouteId);

            if (reverseRoute != null)
            {
                var reverseStops = _unitOfWork.RouteStopPointRepo
                    .GetByRouteId(reverseRoute.RouteId);

                var reverse = reverseStops.FirstOrDefault(s => s.StopId == model.StopId);

                if (reverse != null)
                {
                    reverse.SequenceOrder = model.SequenceOrder;
                    reverse.ModifiedBy = modifiedBy;
                    reverse.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

                    _unitOfWork.RouteStopPointRepo.UpdateRouteStopPoint(reverse);
                }
            }

            _unitOfWork.Save();

            return true;
        }

        // ================= SOFT DELETE =================

        /// <summary>
        /// Soft deletes a route stop point by marking it inactive.
        /// Updates modification metadata.
        /// </summary>
        public async Task<bool> DeleteRouteStopPoint(int id, int modifiedBy)
        {
            var existing = _unitOfWork.RouteStopPointRepo.GetRouteStopPointById(id)
                ?? throw new Exception(_config["RouteStopPoint:NotFound"]!);

            existing.IsActive = false;
            existing.ModifiedBy = modifiedBy;
            existing.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _unitOfWork.RouteStopPointRepo.UpdateRouteStopPoint(existing);

            // -------- DELETE REVERSE --------
            var reverseRoute = _unitOfWork.RoutesRepo
                .GetAllRoutes()
                .FirstOrDefault(r => r.ParentRouteId == existing.RouteId);

            if (reverseRoute != null)
            {
                var reverseStops = _unitOfWork.RouteStopPointRepo
                    .GetByRouteId(reverseRoute.RouteId);

                var reverse = reverseStops.FirstOrDefault(s => s.StopId == existing.StopId);

                if (reverse != null)
                {
                    reverse.IsActive = false;
                    reverse.ModifiedBy = modifiedBy;
                    reverse.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

                    _unitOfWork.RouteStopPointRepo.UpdateRouteStopPoint(reverse);
                }
            }

            _unitOfWork.Save();

            return true;
        }
    }
}
