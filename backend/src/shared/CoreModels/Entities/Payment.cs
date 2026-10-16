using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreModels.Entities
{
    [Table("tbl_Payment")]
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }  // Primary key for the payment record

        [Required]
        public int BookingId { get; set; }  // Links payment to a booking

        [Required, Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; } // Amount charged for the booking

        [Required, StringLength(20)]
        [RegularExpression(@"^(Card|UPI|NetBanking)$")]
        public string PaymentMethod { get; set; } = null!; // Supported payment modes

        [Required, StringLength(20)]
        [RegularExpression(@"^(Pending|Success|Failed|Refunded)$")]
        public string PaymentStatus { get; set; } = "Pending"; // Current payment state

        [StringLength(100)]
        public string? TransactionId { get; set; } // External transaction reference number

        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        [ForeignKey(nameof(BookingId))]
        public virtual Booking? Booking { get; set; } // Navigation property to booking
    }
    public class PaymentRequest
    {
        public decimal Amount { get; set; }
    }
    public class PaymentVerifyRequest
    {
        public string? razorpay_order_id { get; set; }
        public string? razorpay_payment_id { get; set; }
        public string? razorpay_signature { get; set; }

        public BookingCreateRequest? BookingRequest { get; set; }
        public int UserId { get; set; }
    }
}
