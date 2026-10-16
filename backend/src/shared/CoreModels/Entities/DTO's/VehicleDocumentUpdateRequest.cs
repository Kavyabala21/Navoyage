using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace CoreModels.Entities
{
    public class VehicleDocumentUpdateRequest
    {
        [StringLength(100)]
        public string? DocumentName { get; set; }

        public IFormFile? File { get; set; }
    }
}
