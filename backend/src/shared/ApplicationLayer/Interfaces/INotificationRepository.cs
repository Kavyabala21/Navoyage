using CoreModels.Entities;
public interface INotificationRepository
{
    Task AddNotification(Notification notification);
    Task<List<Notification>> GetUnreadNotificationsByUserId(int userId);
    Task<List<Notification>> GetAllNotificationsByUserId(int userId);
    Task<int> GetUnreadNotificationCount(int userId);
    Task MarkAsRead(int notificationId);
}