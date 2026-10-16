using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace CoreModels.Entities
{
    [Table("tbl_Route")]
    public class Routes
    {
        [Key]
        public int RouteId { get; set; }
        // Primary key for identifying each route

        [Required]
        public int TravelCompanyId { get; set; }
        // Links the route to a specific travel company

        [Required, StringLength(150)]
        public string RouteName { get; set; } = null!;
        // Name of the route (e.g., Hyderabad → Bangalore)

        [Required]
        public bool IsActive { get; set; } = true;
        // Indicates whether the route is active and usable

        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);
        public DateTime? ModifiedOn { get; set; } = null;
        // Timestamp when the route was created

        [JsonIgnore]
        [ForeignKey(nameof(TravelCompanyId))]
        public virtual TravelCompany? TravelCompany { get; set; }
        // Navigation property to travel company that owns the route
        public int? ParentRouteId { get; set; }
        [JsonIgnore]
        public virtual ICollection<RouteStopPoint>? RouteStopPoint { get; set; }
        // Collection of stops belonging to this route (ignored in JSON response)
    }
}
