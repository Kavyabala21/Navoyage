using ApplicationLayer.Exceptions;
using BusinessLayer.Services;
using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace Navoyage.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SeatLayoutController : ControllerBase
    {
        private readonly SeatLayoutService _service;
        private readonly IConfiguration _config;

        public SeatLayoutController(
            SeatLayoutService service,
            IConfiguration config)
        {
            _service = service;
            _config = config;
        }

        // ----------------------------------------------------
        // GET SEAT LAYOUT BY VEHICLE
        // ----------------------------------------------------

        [HttpGet("GetSeatLayoutByVehicleId/{vehicleId}")]
        [AllowAnonymous]
        public GenericResponse GetSeatLayoutByVehicle(int vehicleId)
        {
            try
            {
                var layout = _service.GetSeatLayoutByVehicleId(vehicleId);

                return new GenericResponse
                {
                    status = true,
                    data = layout,
                    Message = layout == null
                        ? _config["SeatLayout:LayoutNotFound"]
                        : _config["SeatLayout:Retrieved"]
                };
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(new Exception(ex.Message));
            }
        }

        // ----------------------------------------------------
        // SAVE FULL SEAT LAYOUT
        // ----------------------------------------------------

        [HttpPost("SaveSeatLayout")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> Save([FromBody] SeatLayoutSaveRequest request)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

               await _service.SaveLayout(request.VehicleId, request.LayoutJSON, userId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["SeatLayout:CreatedMessage"]
                };
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // UPDATE INDIVIDUAL SEAT PRICE
        // ----------------------------------------------------

        [HttpPut("UpdateSeatPrice")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> UpdateSeatPrice([FromBody] SeatPriceUpdateRequest request)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

               await _service.UpdateSeatPrice(request, userId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["SeatLayout:SeatPriceUpdatedMessage"]
                };
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // UPDATE FULL SEAT LAYOUT
        // ----------------------------------------------------

        [HttpPut("UpdateSeatLayout")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> UpdateLayout([FromBody] SeatLayoutUpdateRequest request)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

               await _service.UpdateLayout(request.VehicleId, request.LayoutJSON, userId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["SeatLayout:UpdatedMessage"]
                };
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
    }
}
