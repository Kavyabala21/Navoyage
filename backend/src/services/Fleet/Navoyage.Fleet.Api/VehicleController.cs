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
    public class VehicleController : ControllerBase
    {
        private readonly VehicleService _vehicleService;
        private readonly IConfiguration _config;
        private readonly ILogger<VehicleController> _logger;

        public VehicleController(
            VehicleService vehicleService,
            IConfiguration config,
            ILogger<VehicleController> logger)
        {
            _vehicleService = vehicleService;
            _config = config;
            _logger = logger;
        }

        // ----------------------------------------------------
        // GET ALL VEHICLES
        // ----------------------------------------------------
        [HttpGet("GetAllVehicles")]
        [Authorize(Roles = "TravelCompanyOwner,Admin")]
        public async Task<GenericResponse> GetAllVehicles()
        {
            return new GenericResponse
            {
                status = true,
                data = await _vehicleService.GetAllVehicleResponsesAsync(
                    GetAuthorizationHeader(),
                    HttpContext.RequestAborted),
                Message = "Vehicles retrieved successfully"
            };
        }

        // ----------------------------------------------------
        // GET VEHICLE BY ID
        // ----------------------------------------------------
        [HttpGet("GetVehicleById/{id}")]
        [Authorize(Roles = "TravelCompanyOwner,Admin")]
        public async Task<GenericResponse> GetVehicleById(int id)
        {
            try
            {
                var vehicle = await _vehicleService.GetVehicleResponseByIdAsync(
                    id,
                    GetAuthorizationHeader(),
                    HttpContext.RequestAborted);

                if (vehicle is null)
                    throw new NotFoundException(_config["Vehicle:NotFound"]!);

                return new GenericResponse
                {
                    status = true,
                    data = vehicle,
                    Message = "Vehicle retrieved successfully"
                };
            }
            catch (NotFoundException)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["Vehicle:NotFound"]
                };
            }
        }

        // ----------------------------------------------------
        // ADD VEHICLE
        // ----------------------------------------------------
        [HttpPost("AddVehicle")]
        [Authorize(Roles = "TravelCompanyOwner")]
        [Consumes("multipart/form-data")]
        public async Task<GenericResponse> AddVehicle(
            [FromForm] VehicleDetailsRequest vehicle)
        {
            try
            {
                int ownerId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                var newVehicle =
                    await _vehicleService.AddVehicle(vehicle, ownerId);

                string message = _config["Vehicle:AddedMessage"]!
                    ?.Replace("{CODE}", newVehicle.VehicleCode)!;

                return new GenericResponse
                {
                    status = true,
                    data = await _vehicleService.ToVehicleResponseAsync(
                        newVehicle,
                        GetAuthorizationHeader(),
                        HttpContext.RequestAborted),
                    Message = message
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
            catch (ApplicationLayer.Exceptions.Exception ex)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = ex.Message
                };
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to add vehicle.");

                return new GenericResponse
                {
                    status = false,
                    Message = "Failed to add vehicle. Please try again."
                };
            }
        }

        // ----------------------------------------------------
        // UPDATE VEHICLE
        // ----------------------------------------------------
        [HttpPut("UpdateVehicle/{vehicleId}")]
        [Authorize(Roles = "TravelCompanyOwner")]
        [Consumes("multipart/form-data")]
        public async Task<GenericResponse> UpdateVehicle(
            int vehicleId,
            [FromForm] VehicleDetailsUpdateRequest request)
        {
            try
            {
                int ownerId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _vehicleService.UpdateVehicle(
                    vehicleId,
                    request,
                    ownerId
                );

                var updatedVehicle =
                    _vehicleService.GetVehicleById(vehicleId)!;

                string message = _config["Vehicle:UpdatedMessage"]!
                    ?.Replace("{CODE}", updatedVehicle.VehicleCode)!;

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
                    Message = _config["Vehicle:NotFound"]
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
        // APPROVE VEHICLE
        // ----------------------------------------------------
        [HttpPost("ApproveVehicle/{vehicleId}")]
        [Authorize(Roles = "Admin")]
        public async Task<GenericResponse> ApproveVehicle(int vehicleId)
        {
            try
            {
                int adminId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _vehicleService.ApproveVehicle(vehicleId, adminId);

                var vehicle =
                    _vehicleService.GetVehicleById(vehicleId)!;

                string message = _config["Vehicle:ApprovedMessage"]!
                    ?.Replace("{CODE}", vehicle.VehicleCode)!;

                return new GenericResponse
                {
                    status = true,
                    Message = message
                };
            }
            catch (ApplicationLayer.Exceptions.Exception)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = _config["Vehicle:DocumentsRequired"]
                };
            }
        }

        // ----------------------------------------------------
        // REJECT VEHICLE
        // ----------------------------------------------------
        [HttpPost("RejectVehicle/{vehicleId}")]
        [Authorize(Roles = "Admin")]
        public async Task<GenericResponse> RejectVehicle(int vehicleId)
        {
            try
            {
                int adminId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _vehicleService.RejectVehicle(vehicleId, adminId);

                var vehicle =
                    _vehicleService.GetVehicleById(vehicleId)!;

                string message = _config["Vehicle:RejectedMessage"]!
                    ?.Replace("{CODE}", vehicle.VehicleCode)!;

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
                    Message = _config["Vehicle:NotFound"]
                };
            }
        }

        // ----------------------------------------------------
        // DEACTIVATE VEHICLE
        // ----------------------------------------------------
        [HttpPut("DeactivateVehicle/{vehicleId}")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> DeactivateVehicle(int vehicleId)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _vehicleService.DeleteVehicle(vehicleId, userId);

                var vehicle =
                    _vehicleService.GetVehicleById(vehicleId)!;

                string message = _config["Vehicle:DeletedMessage"]!
                    ?.Replace("{CODE}", vehicle.VehicleCode)!;

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
                    Message = _config["Vehicle:NotFound"]
                };
            }
        }

        private string? GetAuthorizationHeader()
        {
            var header = Request.Headers["Authorization"].ToString();
            return string.IsNullOrWhiteSpace(header) ? null : header;
        }
    }
}
