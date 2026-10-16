using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreModels.Entities
{
    [Table("tbl_Pricing")]
    public class Pricing
    {
        // Primary key for pricing entries
        [Key]
        public int PricingId { get; set; }

        // Links this pricing to a specific vehicle
        [Required]
        public int VehicleId { get; set; }

        // Seat category (Economy, Sleeper, Business, etc.)
        [Required, StringLength(50)]
        public string SeatClass { get; set; } = null!;

        // Base price for this seat class; must always be greater than zero
        [Required, Column(TypeName = "decimal(10,2)")]
        [Range(0.01, double.MaxValue)]
        public decimal BasePrice { get; set; }

        // Seasonal pricing type (Festival, Weekend, Weekday)
        [StringLength(50)]
        public string? SeasonType { get; set; }

        // Date from which the pricing becomes active
        [Required]
        public DateTime EffectiveFrom { get; set; }

        // Optional end date for seasonal or temporary pricing
        public DateTime? EffectiveTo { get; set; }

        // Timestamp when the pricing entry was created
        [Required]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        // Navigation reference to related Vehicle
        [ForeignKey(nameof(VehicleId))]
        public virtual Vehicle? Vehicle { get; set; }
    }
}
