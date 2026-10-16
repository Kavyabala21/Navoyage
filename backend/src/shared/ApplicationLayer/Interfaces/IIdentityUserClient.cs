using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IIdentityUserClient
    {
        Task<UserSummaryResponse?> GetUserByIdAsync(
            int userId,
            string? authorizationHeader,
            CancellationToken cancellationToken = default);
    }
}
