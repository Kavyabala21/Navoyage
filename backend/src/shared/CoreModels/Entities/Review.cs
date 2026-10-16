using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreModels.Entities
{
    [Table("tbl_Review")]
    public class Review
    {
        // Unique primary key for each review
        [Key]
        public int ReviewId { get; set; }

        // Booking linked to this review
        [Required]
        public int BookingId { get; set; }

        // User who submitted the review
        [Required]
        public int UserId { get; set; }

        // Rating score between 1 and 5
        [Required, Range(1, 5)]
        public int Rating { get; set; }

        // Optional review comments
        [StringLength(500)]
        public string? Comments { get; set; }

        // Timestamp when review is created
        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        // Navigation: reference to booking
        [ForeignKey(nameof(BookingId))]
        public  virtual Booking? Booking { get; set; }

        // Navigation: reference to user
        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }
    }
}
