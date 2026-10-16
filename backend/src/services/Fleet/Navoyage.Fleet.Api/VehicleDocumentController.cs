using ApplicationLayer.Exceptions;
using BusinessLayer.Services;
using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace Navoyage.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class VehicleDocumentController : ControllerBase
    {
        private readonly VehicleDocumentService _service;
        private readonly IConfiguration _config;

        public VehicleDocumentController(
            VehicleDocumentService service,
            IConfiguration config)
        {
            _service = service;
            _config = config;
        }

        // ----------------------------------------------------
        // UPLOAD DOCUMENT
        // ----------------------------------------------------
        [HttpPost("UploadVehicleDocuments")]
        [Authorize(Roles = "TravelCompanyOwner")]
        [Consumes("multipart/form-data")]
        public async Task<GenericResponse> UploadVehicleDocument(
            [FromForm] VehicleDocumentUploadRequest model)
        {
            try
            {
                if (model.File == null || model.File.Length == 0)
                    return new GenericResponse
                    {
                        status = false,
                        Message = _config["VehicleDocument:FileRequired"]
                    };

                int ownerId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                var document = await _service.UploadDocument(
                    model.VehicleId,
                    model.DocumentName,
                    model.File,
                    ownerId
                );

                string message = _config["VehicleDocument:UploadedMessage"]!
                    ?.Replace("{NAME}", document.DocumentName)!;

                return new GenericResponse
                {
                    status = true,
                    Message = message,
                    data = _service.ToResponse(document)
                };
            }
            catch (ValidationAppException ex)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = ex.Message
                };
            }
            catch (NotFoundException)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["VehicleDocument:VehicleNotFound"]
                };
            }
        }

        // ----------------------------------------------------
        // UPDATE DOCUMENT
        // ----------------------------------------------------
        [HttpPut("UpdateDocument/{documentId}")]
        [Authorize(Roles = "TravelCompanyOwner")]
        [Consumes("multipart/form-data")]
        public async Task<GenericResponse> UpdateDocument(
            int documentId,
            [FromForm] VehicleDocumentUpdateRequest request)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.UpdateDocument(
                    documentId,
                    request,
                    userId
                );

                string message = _config["VehicleDocument:UpdatedMessage"]!
                    ?.Replace("{NAME}", request.DocumentName ?? "")!;

                return new GenericResponse
                {
                    status = true,
                    Message = message
                };
            }
            catch (NotFoundException)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["VehicleDocument:NotFound"]
                };
            }
            catch (InvalidOperationAppException)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["VehicleDocument:CannotModifyApproved"]
                };
            }
            catch (ValidationAppException ex)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = ex.Message
                };
            }
        }

        // ----------------------------------------------------
        // GET DOCUMENTS BY VEHICLE
        // ----------------------------------------------------
        [HttpGet("GetDocumentsByVehicleId/{vehicleId}")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public GenericResponse GetDocumentsByVehicleId(int vehicleId)
        {
            try
            {
                var documents = _service.GetDocumentResponsesByVehicle(vehicleId);

                return new GenericResponse
                {
                    status = true,
                    data = documents,
                    Message = "Documents retrieved successfully"
                };
            }
            catch (ValidationAppException)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["VehicleDocument:InvalidVehicleId"]
                };
            }
        }

        // ----------------------------------------------------
        // GET ALL DOCUMENTS
        // ----------------------------------------------------
        [HttpGet("GetAllDocuments")]
        [Authorize(Roles = "Admin")]
        public GenericResponse GetAllDocuments()
        {
            return new GenericResponse
            {
                status = true,
                data = _service.GetAllDocumentResponses(),
                Message = "Documents retrieved successfully"
            };
        }

        // ----------------------------------------------------
        // APPROVE / REJECT
        // ----------------------------------------------------
        [HttpPut("ApproveOrRejectDocument/{documentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<GenericResponse> ApproveOrRejectDocument(
            int documentId,
            [FromQuery] string status,
            [FromQuery] string vehicleCondition,
            [FromQuery] string? remarks)
        {
            try
            {
                int adminId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                var document = await _service.ApproveOrRejectDocument(
                    adminId,
                    documentId,
                    status,
                    vehicleCondition,
                    remarks
                );

                string message = _config["VehicleDocument:ReviewedMessage"]!
                    ?.Replace("{NAME}", document.DocumentName)!
                    ?.Replace("{STATUS}", document.Status.ToLower())!;

                return new GenericResponse
                {
                    status = true,
                    Message = message,
                    data = document
                };
            }
            catch (NotFoundException)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["VehicleDocument:NotFound"]
                };
            }
            catch (ValidationAppException ex)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = ex.Message
                };
            }
        }

        // ----------------------------------------------------
        // GET DOCUMENT BY ID
        // ----------------------------------------------------
        [HttpGet("GetDocument/{documentId}")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public GenericResponse GetDocument(int documentId)
        {
            try
            {
                var doc = _service.GetDocumentResponseById(documentId);

                return new GenericResponse
                {
                    status = true,
                    data = doc,
                    Message = "Document retrieved successfully"
                };
            }
            catch (NotFoundException)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["VehicleDocument:NotFound"]
                };
            }
        }
    }
}
