using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using DataAccessLayer.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class RoutesRepository : IRoutesRepository
    {
        private readonly ApplicationDbContext _context;
        public RoutesRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public List<Routes> GetRoutesByOwnerId(int ownerId)
        {
            return new List<Routes>();
        }

        public List<Routes> GetRoutesByTravelCompanyId(int travelCompanyId)
        {
            if (travelCompanyId <= 0)
                return new List<Routes>();

            return _context.Routes
                .Include(r => r.RouteStopPoint)!
                .ThenInclude(rsp => rsp.Stop)
                .Where(t =>
                    t.TravelCompanyId == travelCompanyId &&
                    t.IsActive)
                .ToList();
        }

        public async Task AddRoute(Routes route, int authId)
        {
            route.CreatedOn = DateTime.UtcNow.AddHours(5.5);
            route.IsActive = true;
           await _context.Routes.AddAsync(route);
        }

        public void UpdateRoute(Routes route, int authId)
        {
            route.ModifiedOn = DateTime.UtcNow.AddHours(5.5);
            _context.Routes.Update(route);
        }
        public Routes? GetReverseRoute(int parentRouteId)
        {
            return _context.Routes
                .FirstOrDefault(r => r.ParentRouteId == parentRouteId && r.IsActive);
        }
        public List<Routes> GetAllRoutes()
        {
            return _context.Routes
                .Where(r => r.IsActive)
                .ToList();
        }

        public Routes? GetRouteById(int routeId)
        {
            return _context.Routes
                .Include(r => r.RouteStopPoint)!
                .ThenInclude(rsp => rsp.Stop)
                .FirstOrDefault(r => r.RouteId == routeId && r.IsActive);
        }

        public List<Routes> GetRoutesByFromTo(int fromStopId, int toStopId)
        {
            return _context.Routes
                .Include(r => r.RouteStopPoint)!
                .Where(r =>
                    r.IsActive &&
                    r.RouteStopPoint!.Any(s => s.StopId == fromStopId) &&
                    r.RouteStopPoint!.Any(s => s.StopId == toStopId))
                .ToList();
        }

        public void DeleteRoute(int routeId, int authId)
        {
            var route = _context.Routes.FirstOrDefault(r => r.RouteId == routeId);
            if (route == null) return;

            route.IsActive = false;
            route.ModifiedOn = DateTime.UtcNow.AddHours(5.5);
            _context.Routes.Update(route);
        }
    }
}
