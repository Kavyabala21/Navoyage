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
    [Authorize]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _service;
        private readonly IConfiguration _config;
        public BookingController(BookingService service, IConfiguration config)
        {
            _service = service;
            _config = config;
        }

        // ----------------------------------------------------
        // GET ALL BOOKINGS (ADMIN ONLY)
        // ----------------------------------------------------
        [HttpGet("GetAll")]
        [Authorize(Roles = "Admin,TravelCompanyOwner")]
        public GenericResponse GetAll()
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetAllBookings(),
                    Message = _config["Booking:BookingsFound"]
                };
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // GET BOOKING BY PNR
        //-----------------------------------------------------
        [HttpGet("GetByPNR")]
        [AllowAnonymous]
        public GenericResponse GetByPNR(string PNR)
        {
            try
            {
                var booking = _service.GetBookingByPNR(PNR);

                if (booking == null)
                {
                    return new GenericResponse
                    {
                        status = false,
                        data = null,
                        Message = _config["Bookings:NotFound"]
                    };
                }

                return new GenericResponse
                {
                    status = true,
                    data = booking,
                    Message = _config["Booking:BookingFound"]
                };
            }
            catch (Exception ex)
            {
              return  GenericResponse.Fail(ex);
            }
        }
        [HttpGet("TotalBookingsCount")]
        [AllowAnonymous]
        public GenericResponse TotalBookingsCount()
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetBookigsCount(),
                    Message = "Total bookings fetched successfully."
                };       
            }
            catch(NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        
        // ----------------------------------------------------
        // GET BOOKING BY ID
        // ----------------------------------------------------
        [HttpGet("GetById/{id}")]
        public GenericResponse GetById(int id)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetBookingById(id),
                    Message = _config["Booking:BookingFound"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // GET BOOKING BY INSTANCEID
        // ----------------------------------------------------
        [HttpGet("GetBookingsByInstanceId")]
        public GenericResponse GetByInstanceId(int instanceId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = _service.GetBookingsByInstanceId(instanceId),
                    Message = _config["Booking:BookingFound"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // GET BOOKINGS OF LOGGED-IN USER
        // ----------------------------------------------------
        [HttpGet("MyBookings")]
        public GenericResponse MyBookings()
        {
            int userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value
            );

            return new GenericResponse
            {
                status = true,
                data = _service.GetBookingsByUserId(userId),
                Message = _config["Bookings:BookingsFound"]
            };
        }
        [HttpGet("GetBookingsByTravelCompany")]
        [Authorize(Roles = "TravelCompanyOwner")]
        public GenericResponse GetBookingsByTravelCompany()
        {
            try
            {
                int ownerId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                return new GenericResponse
                {
                    status = true,
                    data = _service.GetBookingsByTravelCompany(ownerId),
                    Message = _config["Bookings:BookingsFound"]
                };
            }
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // ADD NEW BOOKING (CUSTOMER)
        // ----------------------------------------------------
        [HttpPost("CreateBooking")]
        [Authorize(Roles = "Customer")]
        public async Task<GenericResponse> CreateBooking([FromBody] BookingCreateRequest request)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

              await _service.AddBooking(request, userId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["Bookings:Created"]
                };
            }
            catch (Exception ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        [HttpPut("Cancel/{bookingId}")]
        [Authorize(Roles = "Customer")]
        public async Task<GenericResponse> Cancel(int bookingId)
        {
            try
            {
                var userClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userClaim == null)
                    throw new UnauthorizedActionException("Invalid user");

                int userId = int.Parse(userClaim.Value);

                bool isAdmin = User.IsInRole("Admin");

                await _service.CancelBooking(bookingId, userId, isAdmin);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["Bookings:CancelledTitle"]
                };
            }
         
            catch (UnauthorizedActionException ex)
            {
                return GenericResponse.Fail(ex);

            }
            catch (InvalidOperationAppException ex)
            {
                 
                return GenericResponse.Fail(ex);

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


    }
}
