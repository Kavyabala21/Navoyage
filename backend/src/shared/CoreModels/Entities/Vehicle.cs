using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_Vehicle")]
    public class Vehicle
    {
        // Primary Key

        [Key]
        public int VehicleId { get; set; }


        // Core Vehicle Details

        [Required, StringLength(20)]
        public string VehicleCode { get; set; } = null!;

        [Required]
        public int TravelCompanyId { get; set; }

        [Required, StringLength(20)]
        [RegularExpression(@"^(Bus|Train|Flight)$")]
        public string ModeOfTransport { get; set; } = null!;

        [StringLength(100)]
        public string? VehicleModel { get; set; }

        [Required, Range(1, int.MaxValue)]
        public int Capacity { get; set; }


        // Media

        [StringLength(300)]
        [Url]
        public string? VehicleImageUrl { get; set; }


        // Status & Validation

        [Required, StringLength(20)]
        [RegularExpression(@"^(Good|Moderate|Bad|NeedApproval)$")]
        public string VehicleCondition { get; set; } = "NeedApproval";

        [Required]
        public bool ConditionVerified { get; set; } = false;

        [Required]
        public bool IsActive { get; set; } = true;


        // Audit Fields

        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        public DateTime? ModifiedOn { get; set; }

        [Required]
        public int ModifiedBy { get; set; } 


        // Additional Information

        public string? Description { get; set; }


        // Navigation Properties

        [ForeignKey(nameof(TravelCompanyId))]
        public virtual TravelCompany? TravelCompany { get; set; }

        [JsonIgnore]
        public virtual ICollection<VehicleDocument>? VehicleDocument { get; set; }

        [JsonIgnore]
        public virtual ICollection<SeatLayout>? SeatLayout { get; set; }

        [JsonIgnore]
        public  virtual ICollection<Pricing>? Pricing { get; set; }

        [JsonIgnore]
        public virtual ICollection<VehicleInstance>? VehicleInstance { get; set; }
    }
}
