using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface ITravelCompanyRepository
    {
        TravelCompany? GetById(int travelCompanyId);
        TravelCompany? GetByOwnerId(int ownerId);
        TravelCompany? GetByCompanyName(string companyName);
        List<TravelCompany> GetAll();
        Task Add(TravelCompany company);
        void Update(TravelCompany company);
    }
}
