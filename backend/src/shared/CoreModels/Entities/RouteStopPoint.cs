using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CoreModels.Entities
{
    [Table("tbl_RouteStopPoint")]
    public class RouteStopPoint
    {
        [Key]
        public int RouteStopPointId { get; set; }

        // Stores the associated Route reference
        [Required]
        public int RouteId { get; set; }

        // Stores the associated Stop reference
        [Required]
        public int StopId { get; set; }

        // Represents the order in which stops appear in the route
        [Required]
        public int SequenceOrder { get; set; }

        // Timestamp stored when the route-stop entry is created
        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);
        public int? ModifiedBy { get; set; } = null;
        public DateTime? ModifiedOn { get; set; } = null;
        public bool IsActive { get; set; } = true;
        [Required]
        public int CreatedBy { get; set; }
        // Navigation property pointing to Route details
        [ForeignKey(nameof(RouteId))]
        public virtual Routes? Route { get; set; }

        // Navigation property pointing to Stop details
        [ForeignKey(nameof(StopId))]
        public virtual Stop? Stop { get; set; }
    }
}
