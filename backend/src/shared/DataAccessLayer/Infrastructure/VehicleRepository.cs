using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class VehicleRepository : IVehicleRepository
    {
        private readonly ApplicationDbContext _context;

        public VehicleRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public List<Vehicle> GetAllVehicles()
        {
            return _context.Vehicle
                .Include(v => v.TravelCompany)
                .ToList();
        }

        public Vehicle? GetVehicleById(int vehicleId)
        {
            return _context.Vehicle
                .Include(v => v.VehicleDocument)
                .FirstOrDefault(v => v.VehicleId == vehicleId);
        }

        public Vehicle? GetVehicleByCode(string vehicleCode)
        {
            var normalizedCode = vehicleCode.Trim().ToUpper();

            return _context.Vehicle
                .FirstOrDefault(v => v.VehicleCode.ToUpper() == normalizedCode);
        }

        public List<Vehicle> GetVehiclesByCompanyId(int travelCompanyId)
        {
            return _context.Vehicle
                .Where(v => v.TravelCompanyId == travelCompanyId)
                .ToList();
        }

        public List<Vehicle> GetPendingApprovalVehicles()
        {
            return _context.Vehicle
                .Include(v => v.VehicleDocument)
                .Where(v => !v.ConditionVerified)
                .ToList();
        }
        public async Task AddVehicle(Vehicle vehicle, int userId)
        {
            vehicle.CreatedOn = DateTime.UtcNow.AddHours(5.5);
            vehicle.ModifiedBy = userId;

            await _context.Vehicle.AddAsync(vehicle);
            await _context.SaveChangesAsync();

        }
        public void UpdateVehicle(Vehicle vehicle,int modifiedBy)
        {
            vehicle.ModifiedOn = DateTime.UtcNow.AddHours(5.5);

            _context.Vehicle.Update(vehicle);
            _context.SaveChanges();
        }

        public void DeleteVehicle(Vehicle vehicle,int vehicleId)
        {

            vehicle.IsActive = false;
            _context.Vehicle.Update(vehicle);
            _context.SaveChanges();
        }
    }
}
