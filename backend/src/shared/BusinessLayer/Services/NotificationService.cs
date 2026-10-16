using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using CoreModels.Entities.DTO_s;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles notification-related operations such as
    /// retrieving, creating, counting, and updating notifications.
    /// </summary>
    public class NotificationService
    {
        private readonly INotificationRepository _repository;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public NotificationService(INotificationRepository repository)
        {
            _repository = repository;
        }

        // ---------------- RETRIEVE UNREAD NOTIFICATIONS ----------------

        /// <summary>
        /// Retrieves all unread notifications for a specific user.
        /// Maps entity objects to NotificationDto.
        /// </summary>
        public async Task<List<NotificationDto>> GetUnreadNotificationsByUserId(int userId)
        {
            var notifications = await _repository.GetUnreadNotificationsByUserId(userId);

            return notifications.Select(n => new NotificationDto
            {
                NotificationId = n.NotificationId,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                CreatedOn = n.CreatedOn
            }).ToList();
        }

        // ---------------- RETRIEVE ALL NOTIFICATIONS ----------------

        /// <summary>
        /// Retrieves all notifications (read and unread)
        /// for a specific user.
        /// </summary>
        public async Task<List<NotificationDto>> GetAllUserNotifications(int userId)
        {
            var notifications = await _repository.GetAllNotificationsByUserId(userId);

            return notifications.Select(n => new NotificationDto
            {
                NotificationId = n.NotificationId,
                Title = n.Title,
                Message = n.Message,
                IsRead = n.IsRead,
                CreatedOn = n.CreatedOn
            }).ToList();
        }

        // ---------------- UNREAD COUNT ----------------

        /// <summary>
        /// Retrieves the total count of unread notifications
        /// for a specific user.
        /// </summary>
        public async Task<int> GetUnreadCount(int userId)
        {
            return await _repository.GetUnreadNotificationCount(userId);
        }

        // ---------------- CREATE NOTIFICATION ----------------

        /// <summary>
        /// Creates a new notification for a user.
        /// Initializes default values such as IsRead and CreatedOn.
        /// </summary>
        public async Task CreateNotification(CreateNotificationDto dto)
        {
            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Message = dto.Message,
                IsRead = false,
                CreatedOn = DateTime.UtcNow.AddMinutes(330) // IST offset
            };

            await _repository.AddNotification(notification);
        }

        // ---------------- MARK AS READ ----------------

        /// <summary>
        /// Marks a specific notification as read.
        /// </summary>
        public async Task MarkAsRead(int notificationId)
        {
            await _repository.MarkAsRead(notificationId);
        }
    }
}