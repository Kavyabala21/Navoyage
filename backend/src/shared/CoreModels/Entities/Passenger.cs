using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreModels.Entities
{
    [Table("tbl_Passenger")]
    public class Passenger
    {
        // Primary key for passenger
        [Key]
        public int PassengerId { get; set; }

        [Required]
        public int BookingId { get; set; }

        // Passenger first name
        [Required, StringLength(100)]
        public string FirstName { get; set; } = null!;

        // Passenger last name
        [Required, StringLength(100)]
        public string LastName { get; set; } = null!;

        // Age of the passenger
        public int? Age { get; set; }

        // Passenger gender (optional, restricted values)
        [StringLength(20)]
        [RegularExpression(@"^(Male|Female|Other)?$")]
        public string? Gender { get; set; }

        // Passenger email address (optional)
        [StringLength(150), EmailAddress]
        public string? Email { get; set; }

        // Passenger phone number (optional, validated format)
        [StringLength(20)]
        [RegularExpression(@"^\+[0-9]{7,19}$")]
        public string? PhoneNumber { get; set; }

        // Assigned seat number
        [StringLength(10)]
        public string? SeatNumber { get; set; }

        // Current ticket status
        [Required, StringLength(20)]
        [RegularExpression(@"^(Confirmed|Cancelled|WaitingList)$")]
        public string Status { get; set; } = "Confirmed";
        public decimal Fare { get; set; } = 0;
        // Record creation timestamp
        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        // Unique identity number for each passenger
        [Required, StringLength(20)]
        public string UniqueIdentityNumber { get; set; } = null!;
        // Navigation property for related booking
        [ForeignKey(nameof(BookingId))]
        public virtual Booking? Booking { get; set; }
    }
}
