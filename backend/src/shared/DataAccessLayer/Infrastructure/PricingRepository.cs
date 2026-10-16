using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class PricingRepository : IPricingRepository
    {
        private readonly ApplicationDbContext _context;

        public PricingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public List<Pricing> GetAllPricings()
        {
            return _context.Pricing
                .OrderByDescending(p => p.CreatedOn)
                .ToList();
        }

        public Pricing? GetPricingById(int pricingId)
        {
            return _context.Pricing
                .FirstOrDefault(p => p.PricingId == pricingId);
        }

        public List<Pricing> GetPricingByVehicleId(int vehicleId)
        {
            return _context.Pricing
                .Where(p => p.VehicleId == vehicleId)
                .OrderByDescending(p => p.EffectiveFrom)
                .ToList();
        }

        public Pricing AddPricing(Pricing pricing)
        {
            _context.Pricing.Add(pricing);
            _context.SaveChanges();

            return pricing;
        }


        public void UpdatePricing(Pricing pricing)
        {
            _context.Pricing.Update(pricing);
        }

    }
}
