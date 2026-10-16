using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    /// <summary>
    /// Handles database operations related to Booking entity.
    /// Responsible for retrieving, creating, and updating booking records
    /// along with related entities like Passenger and VehicleInstance.
    /// </summary>
    public class BookingRepository : IBookingRepository
    {
        private readonly ApplicationDbContext _context;

        /// <summary>
        /// Constructor for dependency injection.
        /// Initializes database context.
        /// </summary>
        public BookingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Retrieves all bookings from the database.
        /// 
        /// Includes:
        /// - Passenger details
        /// - Vehicle instance details
        /// 
        /// Orders results by latest created bookings first.
        /// </summary>
        public List<Booking> GetAllBookings()
        {
            return _context.Booking
                .Include(b => b.Passenger)
                .OrderByDescending(b => b.CreatedOn)
                .ToList();
        }

        /// <summary>
        /// Retrieves a single booking by its ID.
        /// 
        /// Includes:
        /// - Passenger details
        /// - Vehicle instance details
        /// 
        /// Returns null if booking is not found.
        /// </summary>
        public Booking? GetBookingById(int bookingId)
        {
            return _context.Booking
                .Include(b => b.Passenger)
                .FirstOrDefault(b => b.BookingId == bookingId);
        }

        /// <summary>
        /// Retrieves all bookings for a specific user.
        /// 
        /// Filters:
        /// - UserId match
        /// 
        /// Orders results by latest bookings first.
        /// </summary>
        public List<Booking> GetBookingsByUserId(int userId)
        {
            return _context.Booking
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedOn)
                .ToList();
        }

        /// <summary>
        /// Retrieves bookings for a specific vehicle instance.
        /// 
        /// Filters:
        /// - InstanceId match
        /// - Excludes cancelled bookings
        /// 
        /// Orders results by latest bookings first.
        /// </summary>
        public List<Booking> GetBookingsByInstanceId(int instanceId)
        {
            return _context.Booking
                .Where(b => b.InstanceId == instanceId)
                .Where(b => b.Status != "Cancelled")
                .OrderByDescending(b => b.CreatedOn)
                .ToList();
        }

        /// <summary>
        /// Retrieves bookings associated with a travel company owner.
        /// 
        /// Includes:
        /// - Passenger details
        /// - Vehicle instance
        /// - Vehicle
        /// - Travel company
        /// 
        /// Filters:
        /// - OwnerId match through navigation properties
        /// 
        /// Orders results by latest bookings first.
        /// </summary>
        public List<Booking> GetBookingsByTravelCompany(int ownerId)
        {
            return _context.Booking
                .Include(b => b.Passenger)
                .OrderByDescending(b => b.CreatedOn)
                .ToList();
        }
        public Booking GetPNRStatus(string pnr)
        {
            return _context.Booking
                .FirstOrDefault(b => b.PNR == pnr)!;
        }
        public int TotalBookingsCount()
        {
            return _context.Booking.Count();
        }

        /// <summary>
        /// Adds a new booking to the database.
        /// 
        /// Steps:
        /// 1. Add booking entity asynchronously.
        /// 2. Save changes to persist data.
        /// </summary>
        public async Task AddBooking(Booking booking)
        {
            await _context.Booking.AddAsync(booking);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates an existing booking in the database.
        /// 
        /// Steps:
        /// 1. Mark booking as modified.
        /// 2. Save changes to persist updates.
        /// </summary>
        public void UpdateBooking(Booking booking)
        {
            _context.Booking.Update(booking);
            _context.SaveChanges();
        }
    }
}
