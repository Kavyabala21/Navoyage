using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_VehicleInstance")]
    public class VehicleInstance
    {
        [Key]
        public int InstanceId { get; set; }

        // ID of the vehicle running this instance
        [Required]
        public int VehicleId { get; set; }

        // Route assigned for this trip
        [Required]
        public int RouteId { get; set; }

        // Journey start date
        [Required]
        public DateTime DepartureDate { get; set; }

        // Journey start time
        [Required]
        public TimeSpan DepartureTime { get; set; }

        // Journey end date
        [Required]
        public DateTime ArrivalDate { get; set; }

        // Journey end time
        [Required]
        public TimeSpan ArrivalTime { get; set; }

        // Total available seats for the trip
        [Required, Range(0, int.MaxValue)]
        public int TotalSeats { get; set; }

        // Seats remaining for booking
        [Required, Range(0, int.MaxValue)]
        public int AvailableSeats { get; set; }

        // Current operational status
        [Required, StringLength(20)]
        [RegularExpression(@"^(Scheduled|Delayed|Cancelled|Completed)$")]
        public string Status { get; set; } = "Scheduled";

        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
        public int? ModifiedBy { get; set; }



        // Navigation: reference to Vehicle
        [ForeignKey(nameof(VehicleId))]
        public virtual Vehicle? Vehicle { get; set; }

        // Navigation: reference to Route
        [ForeignKey(nameof(RouteId))]
        public virtual Routes? Route { get; set; }


        // Navigation: bookings for this trip
        [JsonIgnore]
        public virtual ICollection<Booking>? Booking { get; set; }
    }
}
