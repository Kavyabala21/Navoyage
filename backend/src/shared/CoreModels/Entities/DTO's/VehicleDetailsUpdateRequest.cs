using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace CoreModels.Entities
{
    public class VehicleDetailsUpdateRequest
    {
        [StringLength(100)]
        public string? VehicleModel { get; set; }

        [Range(1, int.MaxValue)]
        public int? Capacity { get; set; }

        public IFormFile? VehicleImage { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public bool? IsActive { get; set; }
    }
}
