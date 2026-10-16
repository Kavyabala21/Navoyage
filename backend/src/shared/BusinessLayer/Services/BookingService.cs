using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System.Data;
using Exception = ApplicationLayer.Exceptions.Exception;
using System.Data.SqlClient;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles booking operations including creation, cancellation,
    /// and waiting list promotion.
    /// </summary>
    public class BookingService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public BookingService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        /// <summary>
        /// Generates a unique PNR using the last 10 digits of UTC ticks.
        /// </summary>
        private static string GeneratePNR()
        {
            return DateTime.UtcNow.Ticks.ToString()[^10..];
        }

        /// <summary>
        /// Retrieves all bookings from the system.
        /// </summary>
        public List<Booking> GetAllBookings()
        {
            return _unitOfWork.BookingRepo.GetAllBookings() ?? new List<Booking>();
        }

        /// <summary>
        /// Retrieves a specific booking by its ID.
        /// Throws NotFoundException if booking does not exist.
        /// </summary>
        public Booking GetBookingById(int id)
        {
            var booking = _unitOfWork.BookingRepo.GetBookingById(id);

            if (booking == null)
                throw new NotFoundException(_config["Bookings:NotFound"]!);

            return booking;
        }
        public int GetBookigsCount()
        {
            return _unitOfWork.BookingRepo.TotalBookingsCount();
        }

        /// <summary>
        /// Retrieves all bookings associated with a specific user.
        /// Returns an empty list if none are found.
        /// </summary>
        public List<Booking> GetBookingsByUserId(int userId)
        {
            var bookings = _unitOfWork.BookingRepo.GetBookingsByUserId(userId);

            return bookings ?? new List<Booking>();
        }

        /// <summary>
        /// Retrieves bookings for a specific vehicle instance.
        /// Returns an empty list if none are found.
        /// </summary>
        public List<Booking> GetBookingsByInstanceId(int instanceId)
        {
            var bookings = _unitOfWork.BookingRepo.GetBookingsByInstanceId(instanceId);

            return bookings ?? new List<Booking>();
        }
        public List<Booking> GetBookingsByTravelCompany(int ownerId)
        {
            var bookings = _unitOfWork.BookingRepo
                .GetBookingsByTravelCompany(ownerId);

            return bookings ?? new List<Booking>();
        }
        public Booking? GetBookingByPNR(string PNR)
        {
            return _unitOfWork.BookingRepo.GetPNRStatus(PNR);
        }
        /// <summary>
        /// Creates a new booking with passengers.
        /// Validates request, assigns seat status, updates availability,
        /// and sends appropriate notification.
        /// </summary>
        //public async Task AddBooking(BookingCreateRequest request, int userId)
        //{
        //    if (request == null)
        //        throw new Exception("Booking request is null");

        //    if (_unitOfWork?.BookingRepo == null)
        //        throw new Exception("BookingRepo is null");

        //    if (_unitOfWork?.PassengerRepo == null)
        //        throw new Exception("PassengerRepo is null");

        //    var bookings = _unitOfWork.BookingRepo.GetBookingsByInstanceId(request.InstanceId)
        //     .Select(b => new
        //     {
        //         Booking = b,
        //         Passengers = _unitOfWork.PassengerRepo.GetPassengersByBookingId(b.BookingId)

        //     })
        //         .ToList();
        //    // Get all passengers already booked for this instance
        //    var existingPassengers = bookings
        //        .SelectMany(b => b.Passengers)
        //        .ToList();

        //    // Check if any passenger in request already exists in same instance
        //    foreach (var passenger in request.Passengers)
        //    {
        //        bool exists = existingPassengers.Any(p =>
        //            p.UniqueIdentityNumber == passenger.UniqueIdentityNumber);

        //        if (exists)
        //            throw new Exception(_config["Booking:DuplicatePassenger"]!);
        //    }
        //    // Validate passenger list
        //    if (request.Passengers == null || request.Passengers.Count == 0)
        //        throw new Exception(_config["Booking:PassengerRequired"]!);

        //    // Validate maximum passenger limit
        //    if (request.Passengers.Count > 6)
        //        throw new Exception(_config["Booking:MaxPassengerLimit"]!);

        //    // Validate total amount
        //    if (request.TotalAmount <= 0)
        //        throw new Exception(_config["Booking:InvalidAmount"]!);

        //    // Validate vehicle instance
        //    var instance = _unitOfWork.VehicleInstanceRepo
        //        .GetVehicleInstanceById(request.InstanceId)
        //        ?? throw new Exception(_config["Booking:InvalidInstance"]!);

        //    // Create booking entity
        //    var booking = new Booking
        //    {
        //        UserId = userId,
        //        InstanceId = request.InstanceId,
        //        PNR = GeneratePNR(),
        //        Status = "Confirmed",
        //        TotalAmount = request.TotalAmount,
        //        CreatedOn = DateTime.UtcNow.AddHours(5.5),
        //        RazorpayOrderId = request.RazorpayOrderId,
        //        RazorpayPaymentId = request.RazorpayPaymentId,
        //        RazorpaySignature = request.RazorpaySignature,
        //        PaymentStatus = request.PaymentStatus ?? "Success"

        //    };

        //    // Persist booking
        //    await _unitOfWork.BookingRepo.AddBooking(booking);
        //    _unitOfWork.Save();

        //    int seatsAvailable = instance.AvailableSeats;
        //    bool hasWaitingList = false;

        //    // Process passengers and assign seat status
        //    foreach (var p in request.Passengers)
        //    {
        //        var passenger = new Passenger
        //        {
        //            BookingId = booking.BookingId,
        //            FirstName = p.FirstName,
        //            LastName = p.LastName,
        //            Age = p.Age,
        //            Gender = p.Gender,
        //            Email = p.Email,
        //            PhoneNumber = p.PhoneNumber,
        //            SeatNumber = p.SeatNumber,
        //            UniqueIdentityNumber = p.UniqueIdentityNumber,
        //            CreatedOn = DateTime.UtcNow.AddHours(5.5),
        //            Fare = p.Fare,
        //            Status = seatsAvailable > 0 ? "Confirmed" : "WaitingList"
        //        };

        //        if (seatsAvailable > 0)
        //            seatsAvailable--;
        //        else
        //            hasWaitingList = true;

        //        await _unitOfWork.PassengerRepo.AddPassenger(passenger);
        //    }

        //    // Update remaining seat availability
        //    instance.AvailableSeats = seatsAvailable;
        //    _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(instance, userId);
        //    _unitOfWork.Save();

        //    // Send booking notification
        //    string title = _config["Booking:Created"]!;

        //    string message = hasWaitingList
        //        ? _config["Booking:CreatedWithWaiting"]!.Replace("{PNR}", booking.PNR)
        //        : _config["Booking:CreatedConfirmed"]!.Replace("{PNR}", booking.PNR);

        //    await _notificationManager.NotifyAsync(userId, title, message);
        //}

        public async Task<(int BookingId, string PNR)> AddBooking(BookingCreateRequest request, int userId)
        {
            if (request == null)
                throw new Exception("Booking request is null");

            if (request.Passengers == null || request.Passengers.Count == 0)
                throw new Exception(_config["Booking:PassengerRequired"]!);

            if (request.Passengers.Count > 6)
                throw new Exception(_config["Booking:MaxPassengerLimit"]!);

            if (request.TotalAmount <= 0)
                throw new Exception(_config["Booking:InvalidAmount"]!);

            //  Generate PNR in C#
            var pnr = GeneratePNR();

            //  Create DataTable 
            var table = new DataTable();
            table.Columns.Add("FirstName");
            table.Columns.Add("LastName");
            table.Columns.Add("Age", typeof(int));
            table.Columns.Add("Gender");
            table.Columns.Add("Email");
            table.Columns.Add("PhoneNumber");
            table.Columns.Add("SeatNumber");
            table.Columns.Add("UniqueIdentityNumber");
            table.Columns.Add("Fare", typeof(int));

            foreach (var p in request.Passengers)
            {
                table.Rows.Add(
                    p.FirstName, p.LastName, p.Age, p.Gender,
                    p.Email, p.PhoneNumber, p.SeatNumber,
                    p.UniqueIdentityNumber, p.Fare
                );
            }

            string connectionString = _config.GetConnectionString("BookingConnection")
                ?? _config.GetConnectionString("DefaultConnection")!;

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand("sp_AddBooking", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@UserId", userId);
                    cmd.Parameters.AddWithValue("@InstanceId", request.InstanceId);
                    cmd.Parameters.AddWithValue("@PNR", pnr); 
                    cmd.Parameters.AddWithValue("@TotalAmount", request.TotalAmount);
                    cmd.Parameters.AddWithValue("@RazorpayOrderId", (object?)request.RazorpayOrderId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@RazorpayPaymentId", (object?)request.RazorpayPaymentId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@RazorpaySignature", (object?)request.RazorpaySignature ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@PaymentStatus", request.PaymentStatus ?? "Success");

                    cmd.Parameters.Add(new SqlParameter
                    {
                        ParameterName = "@Passengers",
                        SqlDbType = SqlDbType.Structured,
                        TypeName = "PassengerType",
                        Value = table
                    });

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            return (
                                reader.GetInt32(0),   // BookingId
                                reader.GetString(1)   // PNR
                            );
                        }
                    }
                }
            }

            throw new Exception("Booking failed");
        }
        /// <summary>
        /// Cancels an existing booking.
        /// Restores seats, promotes waiting list, processes refund,
        /// and sends appropriate notifications.
        /// </summary>
        public async Task CancelBooking(int bookingId, int userId, bool isAdmin)
        {
            var booking = _unitOfWork.BookingRepo.GetBookingById(bookingId)
                ?? throw new Exception(_config["Booking:NotFound"]!);

            if (!isAdmin && booking.UserId != userId)
                throw new Exception(_config["Booking:Unauthorized"]!);

            if (booking.Status == "Cancelled")
                throw new Exception(_config["Booking:AlreadyCancelled"]!);

            if (string.IsNullOrEmpty(booking.RazorpayPaymentId))
                throw new Exception("Invalid payment id");

            var passengers = _unitOfWork.PassengerRepo
                .GetPassengersByBookingId(bookingId);

            int cancelledFareTotal = 0;

            foreach (var p in passengers)
            {
                if (p.Status == "Confirmed")
                {
                    cancelledFareTotal += (int)Math.Round(p.Fare);
                }

                p.Status = "Cancelled";
                p.Fare = 0;

                _unitOfWork.PassengerRepo.UpdatePassenger(p);
            }

            booking.TotalAmount -= cancelledFareTotal;
            if (booking.TotalAmount < 0) booking.TotalAmount = 0;

            booking.Status = "Cancelled";

            _unitOfWork.BookingRepo.UpdateBooking(booking);

            _unitOfWork.Save();

            //  RAZORPAY REFUND (MULTIPLE REFUNDS SUPPORTED)
            if (!string.IsNullOrEmpty(booking.RazorpayPaymentId))
            {
                try
                {
                    var client = new Razorpay.Api.RazorpayClient(
                        _config["Razorpay:Key"],
                        _config["Razorpay:Secret"]);

                    int refundAmount = cancelledFareTotal * 100;

                    if (refundAmount <= 0)
                        throw new Exception("Invalid refund amount");

                    var payment = client.Payment.Fetch(booking.RazorpayPaymentId);

                    if (payment == null)
                        throw new Exception("Payment not found in Razorpay");

                    var status = payment["status"]?.ToString();

                    if (status != "captured")
                        throw new Exception("Payment not captured. Refund not possible");

                    var refund = payment.Refund(new Dictionary<string, object>
            {
                { "amount", refundAmount }
            });

                    if (refund == null || refund["id"] == null)
                        throw new Exception("Refund failed in Razorpay");

                    Console.WriteLine("Refund ID: " + refund!["id"]);

                    booking.PaymentStatus =
                        booking.TotalAmount == 0 ? "Refunded" : "PartiallyRefunded";

                    _unitOfWork.BookingRepo.UpdateBooking(booking);
                    _unitOfWork.Save();

                    await _notificationManager.NotifyAsync(
                        booking.UserId,
                        "Booking Cancelled",
                        $"Refund of ₹{cancelledFareTotal} processed"
                    );
                }
                catch (Exception ex)
                {
                    throw new Exception("Refund failed: " + ex.Message);
                }
            }
        }
        /// <summary>
        /// Promotes waiting list passengers to confirmed status
        /// when seats become available.
        /// </summary>
        private async Task PromoteWaitingList(VehicleInstance instance, int userId)
        {
            if (instance.AvailableSeats <= 0)
                return;

            var waitingPassengers = _unitOfWork.PassengerRepo
                .GetWaitingListPassengersByInstance(instance.InstanceId);

            foreach (var p in waitingPassengers)
            {
                if (instance.AvailableSeats <= 0)
                    break;

                p.Status = "Confirmed";
                instance.AvailableSeats--;

                _unitOfWork.PassengerRepo.UpdatePassenger(p);

                await _notificationManager.NotifyAsync(
                    p.Booking!.UserId,
                    _config["Booking:SeatConfirmedTitle"]!,
                    _config["Booking:SeatConfirmedMessage"]!
                );
            }

            _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(instance, userId);
            _unitOfWork.Save();
        }
    }
}
