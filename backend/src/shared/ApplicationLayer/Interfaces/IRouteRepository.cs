using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IRoutesRepository
    {
        List<Routes> GetAllRoutes();
        Routes? GetRouteById(int routeId);
        List<Routes> GetRoutesByOwnerId(int ownerId);
        List<Routes> GetRoutesByTravelCompanyId(int travelCompanyId);
        List<Routes> GetRoutesByFromTo(int fromStopId, int toStopId);
        Task AddRoute(Routes route, int authId);
        void UpdateRoute(Routes route, int authId);
        void DeleteRoute(int routeId, int authId);
        Routes? GetReverseRoute(int routeid);
    }
}
