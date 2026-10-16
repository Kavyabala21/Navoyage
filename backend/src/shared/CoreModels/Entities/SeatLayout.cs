using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CoreModels.Entities
{
    [Table("tbl_SeatLayout")]
    public class SeatLayout
    {
        [Key]
        // Primary key for layout record
        public int Id { get; set; }

        [Required]
        // References the vehicle this layout belongs to
        public int VehicleId { get; set; }

        [Required]
        // Stores full seat layout structure in JSON format
        public string LayoutJSON { get; set; } = null!;

        [Required]
        // Timestamp when layout was created
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow.AddHours(5.5);

        // Timestamp when layout was last updated
        public DateTime? ModifiedOn { get; set; }

        [ForeignKey(nameof(VehicleId))]
        // Navigation property for vehicle details
        public virtual Vehicle? Vehicle { get; set; }
    }
}
