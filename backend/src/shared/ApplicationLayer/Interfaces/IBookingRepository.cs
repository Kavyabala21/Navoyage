using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IBookingRepository
    {
        List<Booking> GetAllBookings();
        Booking? GetBookingById(int bookingId);
        List<Booking> GetBookingsByUserId(int userId);
        List<Booking> GetBookingsByTravelCompany(int OwnerId);
        List<Booking> GetBookingsByInstanceId(int instanceId);
        Task AddBooking(Booking booking);
        void UpdateBooking(Booking booking);
        int TotalBookingsCount();
        Booking? GetPNRStatus(string PNR);
    }
}
