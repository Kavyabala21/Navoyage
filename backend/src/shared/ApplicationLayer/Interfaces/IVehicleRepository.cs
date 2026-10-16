
using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IVehicleRepository
    {
        List<Vehicle> GetAllVehicles();
        Vehicle? GetVehicleById(int vehicleId);
        Vehicle? GetVehicleByCode(string vehicleCode);
        List<Vehicle> GetVehiclesByCompanyId(int travelCompanyId);
        List<Vehicle> GetPendingApprovalVehicles();
        Task AddVehicle(Vehicle vehicle, int createdBy);
        void UpdateVehicle(Vehicle vehicle,int modifiedBy);
        void DeleteVehicle(Vehicle vehicle,int vehicleId);
    }
}
