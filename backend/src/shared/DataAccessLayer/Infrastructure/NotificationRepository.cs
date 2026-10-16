using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;

    public NotificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddNotification(Notification notification)
    {
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Notification>> GetUnreadNotificationsByUserId(int userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedOn)
            .ToListAsync();
    }

    public async Task<List<Notification>> GetAllNotificationsByUserId(int userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedOn)
            .ToListAsync();
    }

    public async Task<int> GetUnreadNotificationCount(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkAsRead(int notificationId)
    {
        var notification = await _context.Notifications
            .FirstAsync(n => n.NotificationId == notificationId);

        notification.IsRead = true;
        await _context.SaveChangesAsync();
    }
}
