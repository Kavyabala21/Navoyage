using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IPricingRepository
    {
        List<Pricing> GetAllPricings();
        Pricing? GetPricingById(int pricingId);
        List<Pricing> GetPricingByVehicleId(int vehicleId);

        Pricing AddPricing(Pricing pricing);
        void UpdatePricing(Pricing pricing);
    }
}
