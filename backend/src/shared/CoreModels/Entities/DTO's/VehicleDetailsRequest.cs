using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace CoreModels.Entities
{
    public class VehicleDetailsRequest
    {
        [Required]
        public int TravelCompanyId { get; set; }

        [Required, StringLength(20)]
        public string VehicleCode { get; set; } = null!;

        [Required]
        [RegularExpression("^(Bus|Train|Flight)$")]
        public string ModeOfTransport { get; set; } = null!;

        [StringLength(100)]
        public string? VehicleModel { get; set; }

        [Required, Range(1, int.MaxValue)]
        public int Capacity { get; set; }

        public IFormFile VehicleImage { get; set; } = null!;

        [StringLength(500)]
        public string? Description { get; set; }
    }

}
