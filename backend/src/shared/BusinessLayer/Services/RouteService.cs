using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace BusinessLayer.Services
{
    public class RoutesService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly ITravelCompanyClient _travelCompanyClient;
        private readonly IConfiguration _config;

        public RoutesService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            ITravelCompanyClient travelCompanyClient,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _travelCompanyClient = travelCompanyClient;
            _config = config;
        }

        // ================= ADD ROUTE =================
        public async Task AddRoute(
            Routes route,
            int authId,
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            if (route == null)
                throw new ValidationAppException(_config["Route:DataRequired"]!);

            if (string.IsNullOrWhiteSpace(route.RouteName))
                throw new ValidationAppException(_config["Route:DataRequired"]!);

            var company = await GetCurrentCompany(authId, authorizationHeader, cancellationToken);

            route.TravelCompanyId = company.TravelCompanyId;

            await _unitOfWork.RoutesRepo.AddRoute(route, authId);
            _unitOfWork.Save(); // generates RouteId

            int forwardRouteId = route.RouteId;

            await _notificationManager.NotifyAsync(
                authId,
                _config["Route:AddedTitle"]!,
                _config["Route:AddedMessage"]!
                    .Replace("{RouteName}", route.RouteName)
            );

            var reverseRoute = new Routes
            {
                RouteName = route.RouteName + " Return",
                TravelCompanyId = route.TravelCompanyId,
                ParentRouteId = forwardRouteId
            };

            await _unitOfWork.RoutesRepo.AddRoute(reverseRoute, authId);
            _unitOfWork.Save();

            await _notificationManager.NotifyAsync(
                authId,
                _config["Route:AddedTitle"]!,
                _config["Route:AddedMessage"]!
                    .Replace("{RouteName}", reverseRoute.RouteName)
            );
        }

        public async Task<List<Routes>> GetRoutesByOwnerId(
            int ownerId,
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            var company = await GetCurrentCompany(ownerId, authorizationHeader, cancellationToken);

            return _unitOfWork.RoutesRepo.GetRoutesByTravelCompanyId(company.TravelCompanyId) ?? new List<Routes>();
        }

        public List<Routes> GetRoutesByFromToLocations(int fromStopId, int toStopId)
        {
            return _unitOfWork.RoutesRepo.GetRoutesByFromTo(fromStopId, toStopId) ?? new List<Routes>();
        }
        // ================= UPDATE ROUTE =================
        public async Task UpdateRoute(
            Routes route,
            int authId,
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            if (route == null)
                throw new ValidationAppException(_config["Route:DataRequired"]!);

            var existing = _unitOfWork.RoutesRepo.GetRouteById(route.RouteId)
                ?? throw new NotFoundException(_config["Route:NotFound"]!);

            var company = await GetCurrentCompany(authId, authorizationHeader, cancellationToken);

            if (existing.TravelCompanyId != company.TravelCompanyId)
                throw new UnauthorizedActionException(_config["TravelCompany:NotAllowed"]!);

            existing.RouteName = route.RouteName;

            _unitOfWork.RoutesRepo.UpdateRoute(existing, authId);

            var reverse = _unitOfWork.RoutesRepo
                .GetAllRoutes()
                .FirstOrDefault(r => r.ParentRouteId == existing.RouteId);

            if (reverse != null)
            {
                reverse.RouteName = route.RouteName + " Return";
                _unitOfWork.RoutesRepo.UpdateRoute(reverse, authId);
            }

            _unitOfWork.Save();

            await _notificationManager.NotifyAsync(
                authId,
                _config["Route:UpdatedTitle"]!,
                _config["Route:UpdatedMessage"]!
                    .Replace("{RouteName}", existing.RouteName)
            );

            if (reverse != null)
            {
                await _notificationManager.NotifyAsync(
                    authId,
                    _config["Route:UpdatedTitle"]!,
                    _config["Route:UpdatedMessage"]!
                        .Replace("{RouteName}", reverse.RouteName)
                );
            }
        }

        // ================= DELETE ROUTE =================
        public async Task DeleteRoute(int routeId, int authId)
        {
            var existing = _unitOfWork.RoutesRepo.GetRouteById(routeId)
                ?? throw new NotFoundException(_config["Route:NotFound"]!);

            _unitOfWork.RoutesRepo.DeleteRoute(routeId, authId);

            var reverse = _unitOfWork.RoutesRepo
                .GetAllRoutes()
                .FirstOrDefault(r => r.ParentRouteId == routeId);

            if (reverse != null)
            {
                _unitOfWork.RoutesRepo.DeleteRoute(reverse.RouteId, authId);
            }

            _unitOfWork.Save();

            await _notificationManager.NotifyAsync(
                authId,
                _config["Route:DeletedTitle"]!,
                _config["Route:DeletedMessage"]!
                    .Replace("{RouteName}", existing.RouteName)
            );

            if (reverse != null)
            {
                await _notificationManager.NotifyAsync(
                    authId,
                    _config["Route:DeletedTitle"]!,
                    _config["Route:DeletedMessage"]!
                        .Replace("{RouteName}", reverse.RouteName)
                );
            }
        }

        // ================= GET =================
        public List<Routes> GetAllRoutes()
        {
            return _unitOfWork.RoutesRepo.GetAllRoutes() ?? new List<Routes>();
        }

        public Routes GetRouteById(int id)
        {
            return _unitOfWork.RoutesRepo.GetRouteById(id)
                ?? throw new NotFoundException(_config["Route:NotFound"]!);
        }

        private async Task<TravelCompanyResponse> GetCurrentCompany(
            int authId,
            string? authorizationHeader,
            CancellationToken cancellationToken)
        {
            var company = await _travelCompanyClient.GetMyCompanyAsync(
                authorizationHeader,
                cancellationToken);

            if (company == null)
                throw new ValidationAppException(_config["TravelCompany:NotFound"]!);

            if (company.OwnerId > 0 && company.OwnerId != authId)
                throw new UnauthorizedActionException(_config["TravelCompany:NotAllowed"]!);

            return company;
        }
    }
}
