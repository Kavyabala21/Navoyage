using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_Booking")]
    public class Booking
    {
        // Unique identity of each booking
        [Key]
        public int BookingId { get; set; }

        // References the user who made the booking
        [Required]
        public int UserId { get; set; }

        // References the scheduled vehicle instance for the journey
        [Required]
        public int InstanceId { get; set; }

        // Unique PNR number assigned to each booking
        [StringLength(20)]
        public string? PNR { get; set; }

        // Total price paid for the booking
        [Required, Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        // Current status of booking
        // Allowed values: Confirmed, Cancelled, Completed, WaitingList
        [Required, StringLength(20)]
        [RegularExpression(@"^(Confirmed|Cancelled|Completed|WaitingList)$")]
        public string Status { get; set; } = "Confirmed";

        // Payment reference if payment is completed
        public int? PaymentId { get; set; }

        // Timestamp when booking was created
        [Required]
        public DateTime CreatedOn { get; set; }= DateTime.UtcNow.AddHours(5.5);

        // Navigation property for user who made the booking
        [ForeignKey(nameof(UserId))]
        [JsonIgnore]
        public virtual User? User { get; set; }

        // Navigation property for the vehicle instance booked
        [ForeignKey(nameof(InstanceId))]
        [JsonIgnore]
        public virtual VehicleInstance? VehicleInstance { get; set; }

        // List of passengers under this booking
        [JsonIgnore]
        public virtual ICollection<Passenger>? Passenger { get; set; }

        // Payment transaction details
        [JsonIgnore]
        public virtual ICollection<Payment>? Payment { get; set; }
        public string? RazorpayOrderId { get; set; }
        public string? RazorpayPaymentId { get; set; }
        public string? RazorpaySignature { get; set; }

        [Required]
        public string PaymentStatus { get; set; } = "Pending";
    }
}
