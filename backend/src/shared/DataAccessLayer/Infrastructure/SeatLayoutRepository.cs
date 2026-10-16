using ApplicationLayer.Interfaces;
using CoreModels.Entities;

namespace DataAccessLayer.Repositories
{
    public class SeatLayoutRepository : ISeatLayoutRepository
    {
        private readonly ApplicationDbContext _context;

        public SeatLayoutRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public SeatLayout? GetSeatLayoutByVehicleId(int vehicleId)
        {
            return _context.SeatLayout
                .FirstOrDefault(x => x.VehicleId == vehicleId);
        }

        public SeatLayout? GetSeatLayoutById(int id)
        {
            return _context.SeatLayout.FirstOrDefault(x => x.Id == id);
        }
        public async Task AddSeatLayout(SeatLayout layout)
        {
            await _context.SeatLayout.AddAsync(layout);
            await _context.SaveChangesAsync();
        }
        public void UpdateSeatLayout(SeatLayout layout)
        {
            _context.SeatLayout.Update(layout);
            _context.SaveChanges();
        }
    }
}
