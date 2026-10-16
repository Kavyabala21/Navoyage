using System.Text.Json;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;

namespace DataAccessLayer.Infrastructure
{
    public class IdentityUserClient : IIdentityUserClient
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly HttpClient _httpClient;

        public IdentityUserClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<UserSummaryResponse?> GetUserByIdAsync(
            int userId,
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
                return null;

            try
            {
                using var request = new HttpRequestMessage(
                    HttpMethod.Get,
                    $"api/User/GetUserById/{userId}");

                if (!string.IsNullOrWhiteSpace(authorizationHeader))
                {
                    request.Headers.TryAddWithoutValidation(
                        "Authorization",
                        authorizationHeader);
                }

                using var response = await _httpClient.SendAsync(
                    request,
                    cancellationToken);

                if (!response.IsSuccessStatusCode)
                    return null;

                await using var stream = await response.Content
                    .ReadAsStreamAsync(cancellationToken);

                var payload = await JsonSerializer.DeserializeAsync<IdentityUserResponse>(
                    stream,
                    JsonOptions,
                    cancellationToken);

                return payload?.status == true ? payload.data : null;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch
            {
                return null;
            }
        }

        private sealed class IdentityUserResponse
        {
            public bool status { get; set; }
            public UserSummaryResponse? data { get; set; }
        }
    }
}
