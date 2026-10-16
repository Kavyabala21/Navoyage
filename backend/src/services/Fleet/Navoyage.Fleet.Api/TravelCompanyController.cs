using ApplicationLayer.Exceptions;
using BusinessLayer.Services;
using CoreModels.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace Navoyage.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TravelCompanyController : ControllerBase
    {
        private readonly TravelCompanyService _service;
        private readonly IConfiguration _config;

        public TravelCompanyController(
            TravelCompanyService service,
            IConfiguration config)
        {
            _service = service;
            _config = config;
        }

        // ----------------------------------------------------
        // CREATE COMPANY
        // ----------------------------------------------------

        [HttpPost("CreateCompany")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> CreateCompany(
            [FromBody] TravelCompany travelCompany)
        {
            try
            {
                int ownerId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                var company = await _service.CreateCompany(
                    travelCompany.CompanyName,
                    travelCompany.Description,
                    ownerId
                );

                return new GenericResponse
                {
                    status = true,
                    data = await _service.ToResponseAsync(
                        company,
                        GetAuthorizationHeader(),
                        HttpContext.RequestAborted),
                    Message = _config["TravelCompany:CreatedMessage"]
                        ?.Replace("{CompanyName}", company.CompanyName)
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET MY COMPANY
        // ----------------------------------------------------

        [HttpGet("GetMyCompany")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public async Task<GenericResponse> GetMyCompany()
        {
            try
            {
                int ownerId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );
                var ownerName = User.FindFirstValue(ClaimTypes.Name);

                var company = await _service.GetOrCreateMyCompany(ownerId, ownerName);

                return new GenericResponse
                {
                    status = true,
                    data = await _service.ToResponseAsync(
                        company,
                        GetAuthorizationHeader(),
                        HttpContext.RequestAborted),
                    Message = _config["TravelCompany:Retrieved"]
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET ALL COMPANIES
        // ----------------------------------------------------

        [HttpGet("GetAllCompanies")]
        [Authorize(Roles = "Admin")]
        public async Task<GenericResponse> GetAllCompanies()
        {
            return new GenericResponse
            {
                status = true,
                data = await _service.GetAllCompanyResponsesAsync(
                    GetAuthorizationHeader(),
                    HttpContext.RequestAborted),
                Message = _config["TravelCompany:RetrievedAll"]
            };
        }

        // ----------------------------------------------------
        // DEACTIVATE COMPANY
        // ----------------------------------------------------

        [HttpPut("DeactivateCompany/{id}")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public async Task<GenericResponse> DeactivateCompany(int id)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.DeactivateCompany(id, userId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["TravelCompany:DeactivatedMessage"]
                };
            }
            catch (System.Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        private string? GetAuthorizationHeader()
        {
            var header = Request.Headers["Authorization"].ToString();
            return string.IsNullOrWhiteSpace(header) ? null : header;
        }
    }
}
