using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class TravelCompanyRepository : ITravelCompanyRepository
    {
        private readonly ApplicationDbContext _context;

        public TravelCompanyRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public TravelCompany? GetById(int travelCompanyId)
        {
            return _context.TravelCompany
                .FirstOrDefault(tc => tc.TravelCompanyId == travelCompanyId);
        }

        public TravelCompany? GetByOwnerId(int ownerId)
        {
            return _context.TravelCompany
                .FirstOrDefault(tc => tc.OwnerId == ownerId && tc.IsActive);
        }

        public TravelCompany? GetByCompanyName(string companyName)
        {
            var normalizedName = companyName.Trim().ToLower();

            return _context.TravelCompany
                .FirstOrDefault(tc => tc.CompanyName.ToLower() == normalizedName);
        }

        public List<TravelCompany> GetAll()
        {
            return _context.TravelCompany
                .Where(tc => tc.IsActive)
                .ToList();
        }

        public async Task Add(TravelCompany company)
        {
           await _context.TravelCompany.AddAsync(company);
           await _context.SaveChangesAsync();
        }

        public void Update(TravelCompany company)
        {
            _context.TravelCompany.Update(company);
            _context.SaveChanges();
        }
    }
}
