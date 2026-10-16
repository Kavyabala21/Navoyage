using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles review management including submission,
    /// deletion, retrieval, and rating calculations.
    /// Ensures proper validation, authorization,
    /// and booking state verification before allowing reviews.
    /// </summary>
    public class ReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public ReviewService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        /* ================= ADD REVIEW ================= */

        /// <summary>
        /// Adds a review for a confirmed booking.
        /// Validates booking ownership, booking status,
        /// rating range, and ensures no duplicate review exists.
        /// Sends notification after successful submission.
        /// </summary>
        public async Task AddReview(Review review, int userId)
        {
            // Validate review object
            if (review == null)
                throw new ValidationAppException(_config["Review:DataRequired"]!);

            // Validate booking ID
            if (review.BookingId <= 0)
                throw new ValidationAppException(_config["Review:InvalidBooking"]!);

            // Validate rating range (1–5)
            if (review.Rating < 1 || review.Rating > 5)
                throw new ValidationAppException(_config["Review:InvalidRating"]!);

            // Retrieve associated booking
            var booking = _unitOfWork.BookingRepo.GetBookingById(review.BookingId)
                ?? throw new NotFoundException(_config["Review:BookingNotFound"]!);

            // Ensure user owns the booking
            if (booking.UserId != userId)
                throw new UnauthorizedActionException(_config["Review:UnauthorizedReview"]!);

            // Allow review only for confirmed bookings
            if (booking.Status != "Confirmed" && booking.Status != "Completed")
                throw new InvalidOperationAppException(_config["Review:UnconfirmedBooking"]!);

            // Prevent duplicate review for same booking
            bool exists = _unitOfWork.ReviewRepo
                .ReviewExistsForBooking(review.BookingId);

            if (exists)
                throw new InvalidOperationAppException(_config["Review:AlreadyExists"]!);

            // Set review metadata
            review.UserId = userId;
            review.CreatedOn = DateTime.UtcNow.AddHours(5.5);

            // Persist review
            await _unitOfWork.ReviewRepo.AddReview(review);
            _unitOfWork.Save();

            // Notify user about successful submission
            string title = _config["Review:SubmittedTitle"]!;
            string message = _config["Review:SubmittedMessage"]!;

            await _notificationManager.NotifyAsync(
                userId,
                title,
                message
            );
        }

        /* ================= DELETE REVIEW ================= */

        /// <summary>
        /// Deletes a review.
        /// Ensures valid review ID and verifies ownership.
        /// </summary>
        public async Task DeleteReview(int reviewId, int userId)
        {
            // Validate review ID
            if (reviewId <= 0)
                throw new ValidationAppException(_config["Review:InvalidReviewId"]!);

            // Retrieve review
            var review = await _unitOfWork.ReviewRepo.GetReviewById(reviewId)
                ?? throw new NotFoundException(_config["Review:ReviewNotFound"]!);

            // Ensure user owns the review
            if (review.UserId != userId)
                throw new UnauthorizedActionException(_config["Review:UnauthorizedReview"]!);

            // Delete review
            await _unitOfWork.ReviewRepo.DeleteReview(reviewId, userId);
            _unitOfWork.Save();
        }

        /* ================= GET METHODS ================= */

        /// <summary>
        /// Retrieves a review by its ID.
        /// </summary>
        public async Task<Review> GetReviewById(int reviewId)
        {
            if (reviewId <= 0)
                throw new ValidationAppException(_config["Review:InvalidReviewId"]!);

            return await _unitOfWork.ReviewRepo.GetReviewById(reviewId)
                ?? throw new NotFoundException(_config["Review:ReviewNotFound"]!);
        }

        /// <summary>
        /// Retrieves all reviews in the system.
        /// </summary>
        public async Task<List<Review>> GetAllReviews()
            => await _unitOfWork.ReviewRepo.GetAllReviews() ?? new List<Review>();

        /// <summary>
        /// Retrieves reviews submitted by a specific user.
        /// </summary>
        public async Task<List<Review>> GetReviewsByUserId(int userId)
        {
            if (userId <= 0)
                throw new ValidationAppException(_config["Review:InvalidUser"]!);

            return await _unitOfWork.ReviewRepo.GetReviewsByUserId(userId) ?? new List<Review>();
        }

        /// <summary>
        /// Retrieves reviews for a specific vehicle.
        /// </summary>
        public async Task<List<Review>> GetReviewsByVehicleId(int vehicleId)
        {
            if (vehicleId <= 0)
                throw new ValidationAppException(_config["Review:InvalidVehicle"]!);

            return await _unitOfWork.ReviewRepo.GetReviewsByVehicleId(vehicleId) ?? new List<Review>();
        }
        public bool ReviewExistsForBooking(int bookingId)
        {
            if (bookingId <= 0)
                throw new ValidationAppException(_config["Review:InvalidBooking"]!);
            if (_unitOfWork.ReviewRepo.ReviewExistsForBooking(bookingId))
            {
                return true;
            }
            return false;
        }
        /// <summary>
        /// Calculates and returns the average rating
        /// for a specific vehicle.
        /// </summary>
        public async Task<double> GetAverageRatingByVehicleId(int vehicleId)
        {
            if (vehicleId <= 0)
                throw new ValidationAppException(_config["Review:InvalidVehicle"]!);

            return await _unitOfWork.ReviewRepo.GetAverageRatingByVehicleId(vehicleId);
        }
    }
}
