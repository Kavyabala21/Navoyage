using ApplicationLayer.Exceptions;
using BusinessLayer.Services;
using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Exception = ApplicationLayer.Exceptions.Exception;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StopController : ControllerBase
{
    private readonly StopService _service;
    private readonly IConfiguration _config;

    public StopController(
        StopService service,
        IConfiguration config)
    {
        _service = service;
        _config = config;
    }

    // ---------------- GET ALL ----------------

    [HttpGet]
    [AllowAnonymous]
    public GenericResponse GetAllStops()
    {
        return new GenericResponse
        {
            status = true,
            data = _service.GetAllStops(),
            Message = _config["Stop:RetrievedAll"]
        };
    }

    // ---------------- GET BY ID ----------------

    [HttpGet("{id}")]
    [AllowAnonymous]
    public GenericResponse GetStopById(int id)
    {
        try
        {
            return new GenericResponse
            {
                status = true,
                data = _service.GetStopById(id),
                Message = _config["Stop:Retrieved"]
            };
        }
        catch (NotFoundException ex)
        {
            return GenericResponse.Fail(ex);
        }
    }
    // ---------------- CREATE ----------------

    [HttpPost]
    [Authorize(Roles = "Admin,TravelCompanyOwner")]
    public async Task<GenericResponse> Create([FromBody] Stop stop)
    {
        try
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value
            );

            var createdStop = await _service.CreateStop(stop, userId);

            return new GenericResponse
            {
                status = true,
                data = createdStop,
                Message = _config["Stop:CreatedMessage"]
            };
        }
        catch (AlreadyExistsException ex)
        {
            return GenericResponse.Fail(ex);
        }
        catch (Exception ex)
        {
            return GenericResponse.Fail(ex);
        }
    }

    // ---------------- UPDATE ----------------

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,TravelCompanyOwner")]
    public async Task<GenericResponse> Update(int id, [FromBody] Stop stop)
    {
        try
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value
            );

            var updatedStop = await _service.UpdateStop(id, stop, userId);

            return new GenericResponse
            {
                status = true,
                data = updatedStop,
                Message = _config["Stop:UpdatedMessage"]
            };
        }
        catch (Exception ex)
        {
            return GenericResponse.Fail(ex);
        }
        catch(ApplicationException ex)
        {
            return GenericResponse.Fail(ex);
        }
    }

    // ---------------- DELETE ----------------

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,TravelCompanyOwner")]
    public async Task<GenericResponse> Delete(int id)
    {
        try
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value
            );

            await _service.DeleteStop(id, userId);

            return new GenericResponse
            {
                status = true,
                Message = _config["Stop:DeletedMessage"]
            };
        }
        catch (Exception ex)
        {
            return GenericResponse.Fail(ex);
        }
        catch(ApplicationException ex)
        {
            return GenericResponse.Fail(ex);
        }
    }
}
