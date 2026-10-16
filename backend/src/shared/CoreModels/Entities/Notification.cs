using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_Notification")]
    public class Notification
    {
        [Key]
        // Unique identifier for each notification
        public int NotificationId { get; set; }

        [Required]
        // References the user who will receive the notification
        public int UserId { get; set; }

        [Required, StringLength(150)]
        // Short title describing the notification
        public string Title { get; set; } = null!;

        [Required, StringLength(500)]
        // Detailed message to be sent to the user
        public string Message { get; set; } = null!;

        [Required]
        // Indicates whether the user has viewed the notification
        public bool IsRead { get; set; } = false;

        [Required]
        // Timestamp when the notification was created
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        [JsonIgnore]
        [ForeignKey(nameof(UserId))]
        // Navigation property linking the notification to the user
        public virtual User? User { get; set; }
    }
}


  
