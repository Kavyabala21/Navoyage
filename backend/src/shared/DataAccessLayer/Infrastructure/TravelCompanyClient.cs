using System.Text.Json;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;

namespace DataAccessLayer.Infrastructure
{
    public class TravelCompanyClient : ITravelCompanyClient
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        private readonly HttpClient _httpClient;

        public TravelCompanyClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<TravelCompanyResponse?> GetMyCompanyAsync(
            string? authorizationHeader,
            CancellationToken cancellationToken = default)
        {
            try
            {
                using var request = new HttpRequestMessage(
                    HttpMethod.Get,
                    "api/TravelCompany/GetMyCompany");

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

                var payload = await JsonSerializer.DeserializeAsync<TravelCompanyApiResponse>(
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

        private sealed class TravelCompanyApiResponse
        {
            public bool status { get; set; }
            public TravelCompanyResponse? data { get; set; }
        }
    }
}
