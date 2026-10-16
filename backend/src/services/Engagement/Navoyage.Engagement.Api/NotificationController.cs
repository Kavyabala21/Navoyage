using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using CoreModels.Entities.DTO_s;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Navoyage.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationRepository _notificationRepo;
        private readonly INotificationManager _notificationManager;

        public NotificationController(
            INotificationRepository notificationRepo,
            INotificationManager notificationManager)
        {
            _notificationRepo = notificationRepo;
            _notificationManager = notificationManager;
        }

        // ----------------------------------------------------
        // GET MY NOTIFICATIONS
        // ----------------------------------------------------
        [HttpGet("GetMyNotifications")]
        public async Task<GenericResponse> GetMyNotifications()
        {
            int userId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );

            var notifications = await _notificationRepo.GetUnreadNotificationsByUserId(userId);

            return new GenericResponse
            {
                status = true,
                data = notifications
            };
        }
        // ----------------------------------------------------
        // GET ALL MY NOTIFICATIONS
        // ----------------------------------------------------
        [HttpGet("GetAllMyNotifications")]
        public async Task<GenericResponse> GetAllMyNotifications()
        {
            int userId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );

            var notifications = await _notificationRepo.GetAllNotificationsByUserId(userId);

            return new GenericResponse
            {
                status = true,
                data = notifications
            };
        }
        // ----------------------------------------------------
        // GET UNREAD NOTIFICATION COUNT
        // ----------------------------------------------------
        [HttpGet("UnreadNotificationsCount")]
        public async Task<GenericResponse> GetUnreadCount()
        {
            int userId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );

            int count = await _notificationRepo.GetUnreadNotificationCount(userId);

            return new GenericResponse
            {
                status = true,
                data = count
            };
        }

        // ----------------------------------------------------
        // MARK NOTIFICATION AS READ
        // ----------------------------------------------------
        [HttpPut("MarkAsRead/{id}")]
        public async Task<GenericResponse> MarkAsRead(int id)
        {
            await _notificationRepo.MarkAsRead(id);

            return new GenericResponse
            {
                status = true
            };
        }

        // ----------------------------------------------------
        // CREATE NOTIFICATION FROM ANOTHER SERVICE
        // ----------------------------------------------------
        [HttpPost("CreateInternal")]
        public async Task<GenericResponse> CreateInternal(
            [FromBody] CreateNotificationDto notification)
        {
            if (notification.UserId <= 0 ||
                string.IsNullOrWhiteSpace(notification.Title) ||
                string.IsNullOrWhiteSpace(notification.Message))
            {
                return new GenericResponse
                {
                    status = false,
                    Message = "Invalid notification details."
                };
            }

            await _notificationManager.NotifyAsync(
                notification.UserId,
                notification.Title.Trim(),
                notification.Message.Trim());

            return new GenericResponse
            {
                status = true,
                Message = "Notification created successfully."
            };
        }
    }
}
