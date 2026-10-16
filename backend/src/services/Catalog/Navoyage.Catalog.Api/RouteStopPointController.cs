using ApplicationLayer.Exceptions;
using BusinessLayer.Services;
using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Navoyage.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RouteStopPointController : ControllerBase
    {
        private readonly RouteStopPointService _service;
        private readonly IConfiguration _config;
        private readonly ILogger<RouteStopPointController> _logger;

        public RouteStopPointController(
            RouteStopPointService service,
            IConfiguration config,
            ILogger<RouteStopPointController> logger)
        {
            _service = service;
            _config = config;
            _logger = logger;
        }

        // ----------------------------------------------------
        // GET ALL ROUTE STOP POINTS
        // ----------------------------------------------------

        [HttpGet("GetAll")]
        [AllowAnonymous]
        public GenericResponse GetAll()
        {
            return new GenericResponse
            {
                status = true,
                data = _service.GetAllRouteStopPoints(),
                Message = _config["RouteStopPoint:RetrievedAll"]
            };
        }

        // ----------------------------------------------------
        // GET ROUTE STOP POINT BY ID
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
                    data = _service.GetRouteStopPointById(id),
                    Message = _config["RouteStopPoint:Retrieved"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // GET ROUTE STOP POINT BY RouteID
        // ----------------------------------------------------

        [HttpGet("GetRouteStopPointByRouteId/{routeId:int}")]
        [AllowAnonymous]
        public GenericResponse GetByRouteId(int routeId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetRouteStopPointsByRouteId(routeId),
                    Message = _config["RouteStopPoint:Retrieved"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error while getting route stop points by route id.");
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // ADD ROUTE STOP POINT
        // ----------------------------------------------------

        [HttpPost("Add")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> Add([FromBody] RouteStopPoint model)
        {
            try
            {
                int authId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

               await _service.AddRouteStopPoint(model, authId);

                var routeName = _service
                    .GetAllRouteStopPoints()
                    .FirstOrDefault(r => r.RouteId == model.RouteId)?.Route?.RouteName ?? "Route";

                string message = _config["RouteStopPoint:AddedMessage"]!
                    .Replace("{RouteName}", routeName);

                return new GenericResponse
                {
                    status = true,
                    data = model,
                    Message = message
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
            catch (InvalidOperationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error while adding route stop point.");
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // UPDATE ROUTE STOP POINT
        // ----------------------------------------------------

        [HttpPut("Update")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> Update([FromBody] RouteStopPoint model)
        {
            try
            {
                int authId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

               await _service.UpdateRouteStopPoint(model, authId);

                var routeName = _service
                    .GetAllRouteStopPoints()
                    .FirstOrDefault(r => r.RouteId == model.RouteId)?.Route?.RouteName ?? "Route";

                string message = _config["RouteStopPoint:UpdatedMessage"]!
                    .Replace("{RouteName}", routeName);

                return new GenericResponse
                {
                    status = true,
                    data = model,
                    Message = message
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
            catch (InvalidOperationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error while updating route stop point.");
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // DELETE ROUTE STOP POINT
        // ----------------------------------------------------

        [HttpPut("Delete/{id}")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> Delete(int id)
        {
            try
            {
                int authId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                var existing = _service.GetRouteStopPointById(id);

               await _service.DeleteRouteStopPoint(id, authId);

                string message = _config["RouteStopPoint:DeletedMessage"]!
                    .Replace("{RouteName}", existing?.Route?.RouteName ?? "Route");

                return new GenericResponse
                {
                    status = true,
                    Message = message
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (InvalidOperationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (UnauthorizedActionException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error while deleting route stop point.");
                return GenericResponse.Fail(ex);
            }
        }
    }
}
