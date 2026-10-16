using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class VehicleInstanceRepository : IVehicleInstanceRepository
    {
        private readonly ApplicationDbContext _context;
        public VehicleInstanceRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        // ----------------------------------------------------
        // GET ALL
        // ----------------------------------------------------
        public List<VehicleInstance> GetAllVehicleInstances()
    {
    var nowUtc = DateTime.UtcNow;
   
            var nowIst = DateTime.UtcNow.AddHours(5.5);
            var today  = nowIst.Date;
            var currentTime = nowIst.TimeOfDay;
            return _context.VehicleInstance
                .Include(v => v.Vehicle)
                .Where(v =>
                 v.IsActive &&
                     (
                         v.DepartureDate > today ||
                         (v.DepartureDate == today && v.DepartureTime > currentTime)
                     )
                    )
                 .ToList();
    }
        // ----------------------------------------------------
        // GET BY INSTANCE ID
        // ----------------------------------------------------
        public VehicleInstance GetVehicleInstanceById(int VehicleInstanceId)
        {
            return _context.VehicleInstance
                .Include(v => v.Vehicle)
                .FirstOrDefault(v =>
                    v.InstanceId == VehicleInstanceId &&
                    v.IsActive
                )!;
        }

        // ----------------------------------------------------
        // GET BY VEHICLE ID
        // ----------------------------------------------------
    
        public List<VehicleInstance> GetVehicleInstanceByVehicleId(int vehicleId)
        {
            return _context.VehicleInstance
           .Where(v =>
                 v.VehicleId == vehicleId &&
                 v.IsActive 
                )
            .OrderByDescending(v => v.DepartureDate)
            .ToList();
        }
        public List<VehicleInstance> GetVehicleInstanceByRouteId(int routeId)
        {
            return _context.VehicleInstance
           .Where(v =>
                 v.RouteId == routeId &&
                 v.IsActive
                )
            .ToList();
        }

        // ----------------------------------------------------
        // ADD
        // ----------------------------------------------------
        public async Task<VehicleInstance> AddVehicleInstance(VehicleInstance vehicleInstance, int authId)
        {
            await _context.VehicleInstance.AddAsync(vehicleInstance);
            await _context.SaveChangesAsync();
            return vehicleInstance;
        }

        // ----------------------------------------------------
        // UPDATE
        // ----------------------------------------------------
        public void UpdateVehicleInstance(VehicleInstance vehicleinstance, int authid)
        {
            vehicleinstance.ModifiedOn = DateTime.UtcNow.AddHours(5.5);
            vehicleinstance.ModifiedBy = authid;
            _context.VehicleInstance.Update(vehicleinstance);
            _context.SaveChanges();
        }
        public void CancelVehicleInstance(VehicleInstance vehicleInstance,int authid)
        {
            vehicleInstance.ModifiedOn = DateTime.UtcNow.AddHours(5.5);
            vehicleInstance.ModifiedBy = authid;
            _context.VehicleInstance.Update(vehicleInstance);
            _context.SaveChanges();
        }
        // ----------------------------------------------------
        // SEARCH
        // ----------------------------------------------------
        public List<VehicleInstance> Search(int startId, int endId, DateTime departureDate)
        {
            var now = DateTime.UtcNow.AddHours(5.5);
            var searchDate = departureDate.Date;

            var routeGroups = _context.RouteStopPoint
                .Where(r => r.IsActive &&
                           (r.StopId == startId || r.StopId == endId))
                .GroupBy(r => r.RouteId)
                .ToList();

            var validRouteIds = new List<int>();

            foreach (var g in routeGroups)
            {
                var startSeq = g.Where(x => x.StopId == startId)
                                .Select(x => (int?)x.SequenceOrder)
                                .Min();

                var endSeq = g.Where(x => x.StopId == endId)
                              .Select(x => (int?)x.SequenceOrder)
                              .Min();

                if (startSeq != null && endSeq != null && startSeq <= endSeq)
                {
                    validRouteIds.Add(g.Key);
                }
            }

            if (!validRouteIds.Any())
                return new List<VehicleInstance>();

            var vehicles = _context.VehicleInstance
                .Include(v => v.Vehicle)
                .Where(v =>
                    validRouteIds.Contains(v.RouteId) &&
                    v.IsActive &&
                    v.Status != "Cancelled"
                )
                .ToList();

            if (!vehicles.Any())
                return vehicles;

            // DATE FILTER (SAFE)
            vehicles = vehicles
                .Where(v =>
                    v.DepartureDate >= searchDate &&
                    v.DepartureDate < searchDate.AddDays(1)
                )
                .ToList();

            // TIME FILTER (30 MIN RULE)
            if (searchDate == now.Date)
            {
                vehicles = vehicles
                    .Where(v =>
                    {
                        var departureDateTime = v.DepartureDate.Date + v.DepartureTime;
                        var cutoffTime = departureDateTime.AddMinutes(-30);

                        return now < cutoffTime;
                    })
                    .ToList();
            }

            return vehicles
                .OrderBy(v => v.DepartureTime)
                .ToList();
        }
    }
}
