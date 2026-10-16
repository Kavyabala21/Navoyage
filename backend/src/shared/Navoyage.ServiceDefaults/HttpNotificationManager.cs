using System.Net.Http.Json;
using CoreModels.Entities.DTO_s;
using Microsoft.AspNetCore.Http;

namespace Navoyage.ServiceDefaults;

public class HttpNotificationManager : global::INotificationManager
{
    private readonly HttpClient _httpClient;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpNotificationManager(
        HttpClient httpClient,
        IHttpContextAccessor httpContextAccessor)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task NotifyAsync(int userId, string title, string message)
    {
        if (userId <= 0 ||
            string.IsNullOrWhiteSpace(title) ||
            string.IsNullOrWhiteSpace(message))
        {
            return;
        }

        try
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "api/notifications/CreateInternal");

            var authorizationHeader = _httpContextAccessor.HttpContext
                ?.Request
                .Headers["Authorization"]
                .ToString();

            if (!string.IsNullOrWhiteSpace(authorizationHeader))
            {
                request.Headers.TryAddWithoutValidation(
                    "Authorization",
                    authorizationHeader);
            }

            request.Content = JsonContent.Create(new CreateNotificationDto
            {
                UserId = userId,
                Title = title,
                Message = message
            });

            using var response = await _httpClient.SendAsync(request);
        }
        catch
        {
            // Notification delivery should not fail the business operation.
        }
    }
}
