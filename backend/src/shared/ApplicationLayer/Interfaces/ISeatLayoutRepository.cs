using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface ISeatLayoutRepository
    {
        SeatLayout? GetSeatLayoutByVehicleId(int vehicleId);
        SeatLayout? GetSeatLayoutById(int id);

        Task AddSeatLayout(SeatLayout layout);
        void UpdateSeatLayout(SeatLayout layout);
    }
}
