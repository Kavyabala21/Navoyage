using CoreModels.Entities;

public class NotificationManager : INotificationManager
{
    private readonly INotificationRepository _repo;
    private readonly INotificationSender _sender;

    public NotificationManager(
        INotificationRepository repo,
        INotificationSender sender)
    {
        _repo = repo;
        _sender = sender;
    }

    public async Task NotifyAsync(int userId, string title, string message)
    {

        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedOn = DateTime.UtcNow.AddHours(5.5)
        };

        await _repo.AddNotification(notification);
        int unreadCount = await _repo.GetUnreadNotificationCount(userId);
        await _sender.SendToUserAsync(userId,title, message);
      
    }
}
