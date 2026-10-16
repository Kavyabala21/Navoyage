using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class StopRepository : IStopRepository
    {
        private readonly ApplicationDbContext _context;

        public StopRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public IEnumerable<Stop> GetAllStops()
        {
            return _context.Stop.AsNoTracking().ToList();
        }

        public Stop? GetStopById(int id)
        {
            return _context.Stop.FirstOrDefault(s => s.StopId == id);
        }

        public Stop? GetStopByName(string name)
        {
            return _context.Stop.FirstOrDefault(s => s.StopName == name);
        }

        public async Task AddStop(Stop stop)
        {
           await _context.Stop.AddAsync(stop);
           await _context.SaveChangesAsync();
        }

        public void UpdateStop(Stop stop)
        {
            _context.Stop.Update(stop);
        }

        public void DeleteStop(Stop stop)
        {
            _context.Stop.Remove(stop);
        }
    }
}
