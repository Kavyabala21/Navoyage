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
    public class RoutesController : ControllerBase
    {
        private readonly RoutesService _service;
        private readonly IConfiguration _config;
        private readonly ILogger<RoutesController> _logger;

        public RoutesController(
            RoutesService service,
            IConfiguration config,
            ILogger<RoutesController> logger)
        {
            _service = service;
            _config = config;
            _logger = logger;
        }

        // ----------------------------------------------------
        // ADD ROUTE
        // ----------------------------------------------------

        [HttpPost("AddRoute")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> AddRoute([FromBody] Routes route)
        {
            try
            {
                if (!TryGetAuthenticatedUserId(out var authId))
                    return InvalidUserResponse();

                await _service.AddRoute(
                    route,
                    authId,
                    GetAuthorizationHeader(),
                    HttpContext.RequestAborted);

                string message = _config["Route:AddedMessage"]!
                    .Replace("{RouteName}", route.RouteName);

                return new GenericResponse
                {
                    status = true,
                    data = route,
                    Message = message
                };
            }
            catch (ValidationAppException ex)
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
                _logger.LogError(ex, "Error while adding route.");
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // UPDATE ROUTE
        // ----------------------------------------------------

        [HttpPut("UpdateRoute")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> UpdateRoute([FromBody] Routes route)
        {
            try
            {
                if (!TryGetAuthenticatedUserId(out var authId))
                    return InvalidUserResponse();

                await _service.UpdateRoute(
                    route,
                    authId,
                    GetAuthorizationHeader(),
                    HttpContext.RequestAborted);

                string message = _config["Route:UpdatedMessage"]!
                    .Replace("{RouteName}", route.RouteName);

                return new GenericResponse
                {
                    status = true,
                    data = route,
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
                _logger.LogError(ex, "Error while updating route.");
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET ALL ROUTES
        // ----------------------------------------------------

        [HttpGet("GetAllRoutes")]
        [AllowAnonymous]
        public GenericResponse GetAllRoutes()
        {
            return new GenericResponse
            {
                status = true,
                data = _service.GetAllRoutes(),
                Message = _config["Route:RetrievedAll"]
            };
        }

        // ----------------------------------------------------
        // GET ROUTE BY ID
        // ----------------------------------------------------

        [HttpGet("GetRouteById/{id}")]
        [AllowAnonymous]
        public GenericResponse GetRouteById(int id)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetRouteById(id),
                    Message = _config["Route:Retrieved"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET ROUTE BY OwnerID
        // ----------------------------------------------------

        [HttpGet("GetRouteByOwnerId")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> GetRouteByOwnerId()
        {
            try
            {
                if (!TryGetAuthenticatedUserId(out var ownerId))
                    return InvalidUserResponse();

                return new GenericResponse
                {
                    status = true,
                    data = await _service.GetRoutesByOwnerId(
                        ownerId,
                        GetAuthorizationHeader(),
                        HttpContext.RequestAborted),
                    Message = _config["Route:Retrieved"]
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
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error while getting routes by owner.");
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // GET ROUTES BY FROM–TO LOCATIONS
        // ----------------------------------------------------

        [HttpGet("GetRouteByFromToLocations")]
        [AllowAnonymous]
        public GenericResponse GetRouteByFromToLocations(
            int fromStopId,
            int toStopId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetRoutesByFromToLocations(fromStopId, toStopId),
                    Message = _config["Route:RetrievedAll"]
                };
            }
            catch (ValidationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // DELETE ROUTE
        // ----------------------------------------------------

        [HttpPut("DeleteRoute/{id}")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> DeleteRoute(int id)
        {
            try
            {
                if (!TryGetAuthenticatedUserId(out var authId))
                    return InvalidUserResponse();

                var route = _service.GetRouteById(id);

                await _service.DeleteRoute(id, authId);
                string message = _config["Route:DeletedMessage"]!
                    .Replace("{RouteName}", route.RouteName);

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
                _logger.LogError(ex, "Error while deleting route.");
                return GenericResponse.Fail(ex);
            }
        }

        private bool TryGetAuthenticatedUserId(out int userId)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("nameid")
                ?? User.FindFirstValue("sub");

            return int.TryParse(value, out userId);
        }

        private static GenericResponse InvalidUserResponse()
        {
            return new GenericResponse
            {
                status = false,
                Message = "Invalid or missing authenticated user id."
            };
        }

        private string? GetAuthorizationHeader()
        {
            var header = Request.Headers["Authorization"].ToString();
            return string.IsNullOrWhiteSpace(header) ? null : header;
        }
    }
}
