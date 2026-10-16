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
    public class PricingController : ControllerBase
    {
        private readonly PricingService _service;
        private readonly IConfiguration _config;

        public PricingController(
            PricingService service,
            IConfiguration config)
        {
            _service = service;
            _config = config;
        }

        // ----------------------------------------------------
        // ADD PRICING
        // ----------------------------------------------------

        [HttpPost("Add")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> Add([FromBody] Pricing pricing)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.AddPricing(pricing, userId);

                return new GenericResponse
                {
                    status = true,
                    data = pricing,
                    Message = _config["Pricing:AddedTitle"]
                };
            }
            catch (ValidationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (UnauthorizedActionException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // UPDATE PRICING
        // ----------------------------------------------------

        [HttpPut("Update")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> Update([FromBody] Pricing pricing)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.UpdatePricing(pricing, userId);

                return new GenericResponse
                {
                    status = true,
                    data = pricing,
                    Message = _config["Pricing:UpdatedTitle"]
                };
            }
            catch (ValidationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (InvalidOperationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET ALL PRICING
        // ----------------------------------------------------

        [HttpGet("GetAll")]
        [AllowAnonymous]
        public GenericResponse GetAll()
        {
            return new GenericResponse
            {
                status = true,
                data = _service.GetAll(),
                Message = _config["Pricing:Retrieved"]
            };
        }

        // ----------------------------------------------------
        // GET PRICING BY ID
        // ----------------------------------------------------

        [HttpGet("GetById/{id}")]
        [AllowAnonymous]
        public GenericResponse GetById(int id)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetById(id),
                    Message = _config["Pricing:Retrieved"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET PRICING BY VEHICLE
        // ----------------------------------------------------

        [HttpGet("GetByVehicle/{vehicleId}")]
        [AllowAnonymous]
        public GenericResponse GetByVehicle(int vehicleId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetByVehicle(vehicleId),
                    Message = _config["Pricing:Retrieved"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
    }
}
