using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IVehicleInstanceRepository
    {
        List<VehicleInstance> GetAllVehicleInstances();
        VehicleInstance GetVehicleInstanceById(int VehicleInstanceId);
        List<VehicleInstance> GetVehicleInstanceByVehicleId(int VehicleId);
        Task<VehicleInstance> AddVehicleInstance(VehicleInstance vehicleinstance,int authId);
        void UpdateVehicleInstance(VehicleInstance vehicleinstance,int authid);
        List<VehicleInstance> Search(int startId, int endId, DateTime departureDate);
        void CancelVehicleInstance(VehicleInstance vehicleInstance, int authid);
        List<VehicleInstance> GetVehicleInstanceByRouteId(int routeId);

    }
}
