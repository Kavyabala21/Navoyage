using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using DataAccessLayer.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class RouteStopPointRepository : IRouteStopPointRepository
    {
        private readonly ApplicationDbContext _context;

        public RouteStopPointRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public List<RouteStopPoint> GetAllRouteStopPoints()
        {
            return _context.RouteStopPoint
                .Include(rsp => rsp.Route)
                .Include(rsp => rsp.Stop)
                .Where(rsp => rsp.IsActive)
                .OrderBy(rsp => rsp.SequenceOrder)
                .ToList();
        }
        public List<RouteStopPoint> GetByRouteId()
        {
            return _context.RouteStopPoint
                .Include(rsp => rsp.Route)
                .Include(rsp => rsp.Stop)
                .Where(rsp => rsp.IsActive)
                .OrderBy(rsp => rsp.SequenceOrder)
                .ToList();
        }
        public RouteStopPoint? GetRouteStopPointById(int id)
        {
            return _context.RouteStopPoint
                .Include(rsp => rsp.Route)
                .Include(rsp => rsp.Stop)
                .FirstOrDefault(rsp => rsp.RouteStopPointId == id);
        }
        public List<RouteStopPoint> GetRouteStopPointByStopId(int stopId)
        {
          
            return _context.RouteStopPoint.Where(v => v.StopId == stopId && v.IsActive).ToList();
        }
        public async Task AddRouteStopPoint(RouteStopPoint routeStopPoint)
        {
           await _context.RouteStopPoint.AddAsync(routeStopPoint);
        }

        public void UpdateRouteStopPoint(RouteStopPoint routeStopPoint)
        {
            _context.RouteStopPoint.Update(routeStopPoint);
        }

        public List<RouteStopPoint> GetByRouteId(int routeId)
        {
            return _context.RouteStopPoint
                .AsNoTracking() 
                .Where(rsp => rsp.RouteId == routeId && rsp.IsActive)
                .OrderBy(rsp => rsp.SequenceOrder)
                .ToList();
        }

        public void Delete(RouteStopPoint entity)
        {
            _context.RouteStopPoint.Remove(entity);
        }
    }
}
