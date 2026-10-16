using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IRouteStopPointRepository
    {
        List<RouteStopPoint> GetAllRouteStopPoints();
        RouteStopPoint? GetRouteStopPointById(int id);
        List<RouteStopPoint> GetByRouteId(int routeId);
       List<RouteStopPoint> GetRouteStopPointByStopId(int stopId);
        Task AddRouteStopPoint(RouteStopPoint routeStopPoint);
        void Delete(RouteStopPoint routeStopPoint);
        void UpdateRouteStopPoint(RouteStopPoint routeStopPoint);

    }
}
