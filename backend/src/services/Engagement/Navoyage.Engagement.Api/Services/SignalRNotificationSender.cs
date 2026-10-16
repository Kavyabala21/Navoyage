using Navoyage.API.Hubs;
using Microsoft.AspNetCore.SignalR;
public class SignalRNotificationSender : INotificationSender
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationRepository _repo;
    public SignalRNotificationSender(IHubContext<NotificationHub> hubContext, INotificationRepository repo)
    {
        _hubContext = hubContext;
        _repo = repo;
    }
    public async Task SendToUserAsync(
    int userId,
    string title,
    string message)
    {
        int unreadCount = await _repo.GetUnreadNotificationCount(userId);
        await _hubContext.Clients.User(userId.ToString())
            .SendAsync("ReceiveNotification", new
            {
                Title = title,
                Message = message,
                CreatedOn = DateTime.UtcNow.AddHours(5.5)
            });
        await _hubContext.Clients.User(userId.ToString())
            .SendAsync("UnreadCountUpdated", unreadCount);  
    }
}


