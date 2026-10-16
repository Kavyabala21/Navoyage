public interface INotificationManager
{
    Task NotifyAsync(int userId, string title, string message);
}

