using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_VehicleDocument")]
    public class VehicleDocument
    {
        // Primary Key

        [Key]
        public int DocumentId { get; set; }


        // Core Document Details

        [Required]
        public int VehicleId { get; set; }

        [Required, StringLength(200)]
        public string DocumentName { get; set; } = null!;

        [Required]
        public string DocumentUrl { get; set; } = null!;


        // Upload Metadata

        [Required]
        public DateTime UploadedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        [Required]
        public int UploadedBy { get; set; }


        // Approval Status
        [Required, StringLength(20)]
        [RegularExpression(@"^(Pending|Approved|Rejected)$")]
        public string Status { get; set; } = "Pending";

        public string? AdminRemarks { get; set; }


        // Navigation Properties

        [JsonIgnore]
        [ForeignKey(nameof(VehicleId))]
        public virtual Vehicle? Vehicle { get; set; }

        [JsonIgnore]
        [ForeignKey(nameof(UploadedBy))]
        public virtual User? Uploader { get; set; }
    }
}
