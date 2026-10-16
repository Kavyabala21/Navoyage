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
    public class ReviewController : ControllerBase
    {
        private readonly ReviewService _service;
        private readonly IConfiguration _config;

        public ReviewController(
            ReviewService service,
            IConfiguration config)
        {
            _service = service;
            _config = config;
        }

        // ----------------------------------------------------
        // ADD REVIEW
        // ----------------------------------------------------

        [HttpPost("AddReview")]
        [Authorize(Roles = "Customer")]
        public async Task<GenericResponse> AddReview([FromBody] Review review)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.AddReview(review, userId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["Review:SubmittedTitle"]
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
            catch (NotFoundException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // DELETE REVIEW
        // ----------------------------------------------------

        [HttpDelete("DeleteReview/{reviewId}")]
        public async Task<GenericResponse> DeleteReview(int reviewId)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                await _service.DeleteReview(reviewId, userId);

                return new GenericResponse
                {
                    status = true,
                    Message = _config["Review:Deleted"]
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
        }

        // ----------------------------------------------------
        // GET REVIEW BY ID
        // ----------------------------------------------------

        [HttpGet("GetReviewById/{reviewId}")]
        public async Task<GenericResponse> GetReviewById(int reviewId)
        {
            try
            {
                var review = await _service.GetReviewById(reviewId);

                return new GenericResponse
                {
                    status = true,
                    data = review,
                    Message = _config["Review:Retrieved"]
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
        }

        // ----------------------------------------------------
        // GET MY REVIEWS
        // ----------------------------------------------------

        [HttpGet("GetMyReviews")]
        public async Task<GenericResponse> GetMyReviews()
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                return new GenericResponse
                {
                    status = true,
                    data = await _service.GetReviewsByUserId(userId),
                    Message = _config["Review:UserReviewsRetrieved"]
                };
            }
            catch (ValidationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }

        // ----------------------------------------------------
        // GET REVIEWS BY VEHICLE
        // ----------------------------------------------------

        [HttpGet("GetReviewsByVehicle/{vehicleId}")]
        [AllowAnonymous]
        public async Task<GenericResponse> GetReviewsByVehicle(int vehicleId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = await _service.GetReviewsByVehicleId(vehicleId),
                    Message = _config["Review:VehicleReviewsRetrieved"]
                };
            }
            catch (ValidationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // GET REVIEWS BY VEHICLE
        // ----------------------------------------------------

        [HttpGet("GetReviewsByBooking/{bookingId}")]
        [AllowAnonymous]
        public async Task<GenericResponse> GetReviewsByBooking(int bookingId)
        {
            try
            {
                return new GenericResponse
                {
                    status = _service.ReviewExistsForBooking(bookingId),
                    Message = _config["Review:BookingReviewsRetrieved"]
                };
            }
            catch (ValidationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
        // ----------------------------------------------------
        // GET AVERAGE RATING
        // ----------------------------------------------------

        [HttpGet("Vehicle/{vehicleId}/AverageRating")]
        [AllowAnonymous]
        public async Task<GenericResponse> GetAverageRating(int vehicleId)
        {
            try
            {
                return new GenericResponse
                {
                    status = true,
                    data = await _service.GetAverageRatingByVehicleId(vehicleId),
                    Message = _config["Review:AverageRatingRetrieved"]
                };
            }
            catch (ValidationAppException ex)
            {
                return GenericResponse.Fail(ex);
            }
        }
    }
}
