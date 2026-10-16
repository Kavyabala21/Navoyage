using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles passenger-related operations such as retrieval,
    /// individual passenger cancellation, waiting list promotion,
    /// and automatic booking status updates.
    /// </summary>
    public class PassengerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public PassengerService(
            IUnitOfWork uow,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = uow;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ---------------- RETRIEVE PASSENGERS ----------------

        /// <summary>
        /// Retrieves all passengers associated with a specific booking.
        /// </summary>
        public List<Passenger> GetPassengersByBookingId(int bookingId)
        {
            return _unitOfWork.PassengerRepo
                .GetPassengersByBookingId(bookingId) ?? new List<Passenger>();
        }

        public Passenger GetById(int passengerId)
        {
            return _unitOfWork.PassengerRepo.GetById(passengerId)!;
        }

        // ---------------- CANCEL PASSENGER ----------------

        /// <summary>
        /// Cancels an individual passenger.
        /// 
        /// Validates authorization, updates seat availability,
        /// promotes waiting list if applicable, updates booking status
        /// if all passengers are cancelled, and sends notifications.
        /// </summary>
        public Task CancelPassenger(int passengerId, int userId, bool isAdmin = false)
        {
            var passenger = _unitOfWork.PassengerRepo.GetById(passengerId)
                ?? throw new Exception(_config["Passenger:NotFound"]);

            if (passenger.Status == "Cancelled")
                throw new Exception(_config["Passenger:AlreadyCancelled"]);

            var booking = _unitOfWork.BookingRepo
                .GetBookingById(passenger.BookingId)
                ?? throw new Exception(_config["Passenger:BookingNotFound"]);

            if (!isAdmin && booking.UserId != userId)
                throw new Exception(_config["Passenger:Unauthorized"]);
            int cancelledFare = (int)Math.Round(passenger.Fare); 

            passenger.Status = "Cancelled";
            passenger.Fare = 0;

            _unitOfWork.PassengerRepo.UpdatePassenger(passenger);

            booking.TotalAmount -= cancelledFare;
            if (booking.TotalAmount < 0) booking.TotalAmount = 0;

            var instance = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceById(booking.InstanceId)
                ?? throw new Exception(_config["Passenger:InstanceNotFound"]);

            instance.AvailableSeats += 1;

            // WAITING LIST
            var waitingPassenger = _unitOfWork.PassengerRepo
                .GetWaitingListPassengersByInstance(instance.InstanceId)
                .FirstOrDefault();

            if (waitingPassenger != null)
            {
                waitingPassenger.Status = "Confirmed";
                instance.AvailableSeats -= 1;

                _unitOfWork.PassengerRepo.UpdatePassenger(waitingPassenger);
            }

            var allPassengers = _unitOfWork.PassengerRepo
                .GetPassengersByBookingId(booking.BookingId);

            if (allPassengers.Count == 1 || allPassengers.All(p => p.Status == "Cancelled"))
            {
                booking.Status = "Cancelled";
                booking.TotalAmount = 0;
            }

            _unitOfWork.BookingRepo.UpdateBooking(booking);
            _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(instance, userId);
            _unitOfWork.Save();
            Console.WriteLine("==== REFUND DEBUG START ====");
            Console.WriteLine("PaymentId: " + booking.RazorpayPaymentId);
            Console.WriteLine("Cancelled Fare: " + cancelledFare);
            Console.WriteLine("Refund Amount (paise): " + (cancelledFare * 100));
            //  RAZORPAY REFUND
            if (!string.IsNullOrEmpty(booking.RazorpayPaymentId))
            {
                try
                {
                    var client = new Razorpay.Api.RazorpayClient(
                        _config["Razorpay:Key"],
                        _config["Razorpay:Secret"]);

                    int refundAmount = cancelledFare * 100;

                    if (refundAmount <= 0)
                        throw new Exception("Invalid refund amount");

                    var payment = client.Payment.Fetch(booking.RazorpayPaymentId);

                    if (payment == null)
                        throw new Exception("Payment not found");

                    var status = payment["status"]?.ToString();

                    if (status != "captured")
                        throw new Exception("Payment not captured");

                    var refund = payment.Refund(new Dictionary<string, object>
            {
                { "amount", refundAmount }
            });

                    if (refund == null || refund["id"] == null)
                        throw new Exception("Refund failed");
                    Console.WriteLine("Razorpay Status: " + payment["status"]);
                    Console.WriteLine("Refund ID: " + refund!["id"]);

                    booking.PaymentStatus =
                        booking.TotalAmount == 0 ? "Refunded" : "PartiallyRefunded";

                    _unitOfWork.BookingRepo.UpdateBooking(booking);
                    _unitOfWork.Save();
                }
                catch (Exception ex)
                {
                    throw new Exception("Refund failed: " + ex.Message);
                }
            }

            return Task.CompletedTask;
        }
    }
    }
