using ApplicationLayer.Interfaces;
using CoreModels.Entities;

using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly ApplicationDbContext _context;
        public ReviewRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddReview(Review review)
        {
            _context.Review.Add(review);
            await _context.SaveChangesAsync();
        }
        public async Task DeleteReview(int reviewId, int userId)
        {
            var review = await _context.Review.FindAsync(reviewId)
                ?? throw new Exception("Review not found");

            if (review.UserId != userId)
                throw new Exception("Unauthorized to delete this review");
          
            _context.Review.Remove(review);
            await _context.SaveChangesAsync();
        }

        public async Task<Review?> GetReviewById(int reviewId)
        {
            return await _context.Review
                .FirstOrDefaultAsync(r => r.ReviewId == reviewId);
        }

        public async Task<List<Review>> GetAllReviews()
        {
            return await _context.Review
                .OrderByDescending(r => r.CreatedOn)
                .ToListAsync();
        }

        public async Task<List<Review>> GetReviewsByUserId(int userId)
        {
            return await _context.Review
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedOn)
                .ToListAsync();
        }

        public async Task<List<Review>> GetReviewsByVehicleId(int vehicleId)
        {
            return await Task.FromResult(new List<Review>());
        }

        public  bool ReviewExistsForBooking(int bookingId)
        {
            if (_context.Review.Any(r => r.BookingId == bookingId))
            {
                return true;
            }
            return false ;
        }
        public async Task<double> GetAverageRatingByVehicleId(int vehicleId)
        {
            return await Task.FromResult(0d);
        }
    }
}
