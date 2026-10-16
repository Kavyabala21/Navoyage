using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface ITravelCompanyClient
    {
        Task<TravelCompanyResponse?> GetMyCompanyAsync(
            string? authorizationHeader,
            CancellationToken cancellationToken = default);
    }
}
