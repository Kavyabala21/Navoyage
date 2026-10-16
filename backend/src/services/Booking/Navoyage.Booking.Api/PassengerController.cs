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
    public class PassengerController : ControllerBase
    {
        private readonly PassengerService _service;
        private readonly BookingService _bookingService;
        private readonly IConfiguration _config;

        public PassengerController(
            PassengerService service,
            IConfiguration config,BookingService bookingService)
        {
            _service = service;
            _config = config;
            _bookingService = bookingService;
        }

        // ----------------------------------------------------
        // GET PASSENGERS BY BOOKING ID
        // ----------------------------------------------------

        [HttpGet("PassengersByBookingId/{bookingId}")]
        public GenericResponse GetPassengersByBooking(int bookingId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetPassengersByBookingId(bookingId),
                    Message = _config["Booking:BookingFound"]
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
        // CANCEL PASSENGER BOOKING
        // ----------------------------------------------------

        [HttpPut("CancelBookingForPassenger/{passengerId}")]
        public async Task<GenericResponse> Cancel(int passengerId)
        {
            try
            {
                var userClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userClaim == null)
                    throw new UnauthorizedActionException("Invalid user");

                int userId = int.Parse(userClaim.Value);

                bool isCustomer = User.IsInRole("Customer");

                await _service.CancelPassenger(passengerId, userId, isCustomer);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["Passenger:PassengerCancelledMessage"]
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
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (InvalidOperationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
    }
}
