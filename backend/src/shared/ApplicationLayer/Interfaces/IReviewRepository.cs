using CoreModels.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationLayer.Interfaces
{
    public interface IReviewRepository
    {
        Task AddReview(Review review);
        Task DeleteReview(int reviewId,int userId);

        Task<Review?> GetReviewById(int reviewId);
        Task<List<Review>> GetAllReviews();
        Task<List<Review>> GetReviewsByUserId(int userId);
        Task<List<Review>> GetReviewsByVehicleId(int vehicleId);

       bool ReviewExistsForBooking(int bookingId);
        Task<double> GetAverageRatingByVehicleId(int vehicleId);
    }

}
