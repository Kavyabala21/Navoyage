
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
namespace CoreModels.Entities
{
    public class VehicleDocumentUploadRequest
    {
        [Required]
        public int VehicleId { get; set; }
     

        [Required]
        public string DocumentName { get; set; } = null!;


        [Required]
        public IFormFile File { get; set; } = null!;
    }
}