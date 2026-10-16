using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace CoreModels.Entities
{
    [Table("tbl_Stop")]
    public class Stop
    {
        [Key]
        // Primary key for the stop
        public int StopId { get; set; }

        [Required, StringLength(100)]
        // Name of the stop (must be unique in DB)
        public string StopName { get; set; } = null!;

        [Required, Column(TypeName = "decimal(10,6)")]
        // Latitude of the stop location
        public double Latitude { get; set; }

        [Required, Column(TypeName = "decimal(10,6)")]
        // Longitude of the stop location
        public double Longitude { get; set; }

        [Required]
        // Timestamp when the stop was created
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);
        public DateTime? ModifiedOn { get; set; } = null;

        [JsonIgnore]
        // Navigation property for mapping with route stop points
        public virtual ICollection<RouteStopPoint>? RouteStopPoint { get; set; }
    }
}
