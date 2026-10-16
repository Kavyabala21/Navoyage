public interface INotificationSender
{
    Task SendToUserAsync(int userId, string title, string message);
}