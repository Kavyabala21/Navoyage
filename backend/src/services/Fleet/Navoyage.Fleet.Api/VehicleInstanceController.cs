using ApplicationLayer.Exceptions;
using BusinessLayer.Services;
using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Exception = System.Exception;

namespace Navoyage.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class VehicleInstanceController : ControllerBase
    {
        private readonly VehicleInstanceService _service;

        public VehicleInstanceController(VehicleInstanceService service)
        {
            _service = service;
        }

        // ----------------------------------------------------
        // GET ALL VEHICLE INSTANCES
        // ----------------------------------------------------
        [HttpGet("GetAllVehicleInstances")]
        [AllowAnonymous]
        public GenericResponse GetAllVehicleInstances()
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetAllVehicleInstances(),
                    Message = "Vehicle instances retrieved successfully"
                };
            }
            catch (InvalidOperationAppException ex)
            {
                return GenericResponse.Fail(ex);

            }
        }

        // ----------------------------------------------------
        // GET BY INSTANCE ID
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
                    data = _service.GetVehicleInstanceById(id),
                    Message = "Vehicle instance retrieved successfully"
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);

            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET BY VEHICLE ID
        // ----------------------------------------------------
        [HttpGet("GetVehicleInstanceByVehicleId/{vehicleId}")]
        [AllowAnonymous]
        public GenericResponse GetVehicleInstanceByVehicleId(int vehicleId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetVehicleInstanceByVehicleId(vehicleId),
                    Message = "Vehicle instances retrieved successfully"
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);

            }
        }

        // ----------------------------------------------------
        // ADD VEHICLE INSTANCE
        // ----------------------------------------------------
        [HttpPost("Add")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> Add([FromBody] VehicleInstance instance)
        {
            try
            {
                int authId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.AddVehicleInstance(instance, authId);

                return new GenericResponse
                {
                    status = true,
                    Message = "Vehicle instance added successfully",
                    data = instance.InstanceId
                };
            }
            catch (Exception ex)
            {
                return new GenericResponse
                {
                    status = false,
                    Message = ex.InnerException?.Message ?? ex.Message
                };
            }
        }

        // ----------------------------------------------------
        // UPDATE VEHICLE INSTANCE
        // ----------------------------------------------------
        [HttpPut("Update")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> Update([FromBody] VehicleInstance instance)
        {
            try
            {
                int authId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.UpdateVehicleInstance(instance, authId);

                return new GenericResponse
                {
                    status = true,
                    Message = "Vehicle instance updated successfully",
                    data = instance
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (UnauthorizedActionException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (InvalidOperationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (ApplicationException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // CANCEL VEHICLE INSTANCE
        // ----------------------------------------------------
        [HttpPut("CancelVehicleInstance/{id}")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> CancelInstance(int id)
        {
            try
            {
                int authId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.CancelVehicleInstance(id, authId);

                return new GenericResponse
                {
                    status = true,
                    Message = "Vehicle instance cancelled successfully"
                };
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
        // DELETE VEHICLE INSTANCE (SOFT DELETE)
        // ----------------------------------------------------
        [HttpPut("DeleteVehicleInstance/{id}")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> Delete(int id)
        {
            try
            {
                int authId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.DeleteVehicleInstance(id, authId);

                return new GenericResponse
                {
                    status = true,
                    Message = "Vehicle instance deleted successfully"
                };
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
        // SEARCH FOR VEHICLE INSTANCES
        // ----------------------------------------------------
        [HttpGet("Search")]
        public GenericResponse Search(int startId, int endId, string departureDate)
        {
            try
            {
                if (startId == endId)
                    return GenericResponse.Fail(new Exception("Start and End cannot be same"));

                if (!DateTime.TryParse(departureDate, out var parsedDate))
                    return GenericResponse.Fail(new Exception("Invalid date format"));

                var data = _service.Search(startId, endId, parsedDate);

                if (data == null || !data.Any())
                {
                    return new GenericResponse
                    {
                        status = true,
                        data = new List<VehicleInstance>(),
                        Message = "No trips found for given criteria"
                    };
                }

                return new GenericResponse
                {
                    status = true,
                    data = data,
                    Message = "Search results retrieved successfully"
                };
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
    }
}
