using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles payment lifecycle including initiation,
    /// success/failure handling, seat assignment,
    /// and refund processing.
    /// </summary>
    public class PaymentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public PaymentService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ---------------- INITIATE PAYMENT ----------------

        /// <summary>
        /// Creates a new payment entry for a booking.
        /// Initializes payment with Pending status.
        /// </summary>
        public async Task<Payment> CreatePayment(
            int bookingId,
            decimal amount,
            string method)
        {
            // Validate booking existence
            var booking = _unitOfWork.BookingRepo
                .GetBookingById(bookingId)
                ?? throw new Exception(_config["Payment:BookingNotFound"]);

            // Create payment entity
            var payment = new Payment
            {
                BookingId = bookingId,
                Amount = amount,
                PaymentMethod = method,
                PaymentStatus = "Pending",
                CreatedOn = DateTime.UtcNow.AddHours(5.5)
            };

            // Persist payment
            var createdPayment = _unitOfWork.PaymentRepo
                .AddPayment(payment);

            return createdPayment;
        }

        // ---------------- PAYMENT SUCCESS ----------------

        /// <summary>
        /// Marks a payment as successful.
        /// Updates transaction ID, assigns seats,
        /// and sends confirmation notification.
        /// </summary>
        public async Task MarkPaymentSuccess(
            int paymentId,
            string transactionId)
        {
            // Retrieve payment
            var payment = _unitOfWork.PaymentRepo
                .GetPaymentById(paymentId)
                ?? throw new Exception(_config["Payment:PaymentNotFound"]);

            // Prevent duplicate success marking
            if (payment.PaymentStatus == "Success")
                throw new Exception(_config["Payment:AlreadyCompleted"]);

            // Update payment details
            payment.PaymentStatus = "Success";
            payment.TransactionId = transactionId;

            _unitOfWork.PaymentRepo.UpdatePayment(payment);

            // Assign seats after successful payment
            AssignSeatsAfterPayment(payment.BookingId);

            // Retrieve booking for notification
            var booking = _unitOfWork.BookingRepo
                .GetBookingById(payment.BookingId)!;

            string title = _config["Payment:SuccessTitle"]!;
            string message = _config["Payment:SuccessMessage"]
                ?.Replace("{PNR}", booking.PNR)!;

            // Notify user
            await _notificationManager.NotifyAsync(
                booking.UserId,
                title,
                message
            );
        }

        // ---------------- PAYMENT FAILURE ----------------

        /// <summary>
        /// Marks a payment as failed and notifies the user.
        /// </summary>
        public async Task MarkPaymentFailed(int paymentId)
        {
            // Retrieve payment
            var payment = _unitOfWork.PaymentRepo
                .GetPaymentById(paymentId)
                ?? throw new Exception(_config["Payment:PaymentNotFound"]);

            // Update payment status
            payment.PaymentStatus = "Failed";
            _unitOfWork.PaymentRepo.UpdatePayment(payment);

            // Retrieve booking for notification
            var booking = _unitOfWork.BookingRepo
                .GetBookingById(payment.BookingId)!;

            string title = _config["Payment:FailedTitle"]!;
            string message = _config["Payment:FailedMessage"]
                ?.Replace("{PNR}", booking.PNR)!;

            // Notify user
            await _notificationManager.NotifyAsync(
                booking.UserId,
                title,
                message
            );
        }

        // ---------------- SEAT ASSIGNMENT AFTER PAYMENT ----------------

        /// <summary>
        /// Assigns seats to passengers after successful payment.
        /// Confirms passengers if seats are available,
        /// otherwise assigns them to waiting list.
        /// Updates booking and vehicle instance accordingly.
        /// </summary>
        private void AssignSeatsAfterPayment(int bookingId)
        {
            var booking = _unitOfWork.BookingRepo
                .GetBookingById(bookingId)!;

            var instance = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceById(booking.InstanceId)!;

            var passengers = _unitOfWork.PassengerRepo
                .GetPassengersByBookingId(bookingId)
                .Where(p => p.Status != "Cancelled")
                .ToList();

            foreach (var p in passengers)
            {
                if (instance.AvailableSeats > 0)
                {
                    p.Status = "Confirmed";
                    instance.AvailableSeats--;
                }
                else
                {
                    p.Status = "WaitingList";
                }

                _unitOfWork.PassengerRepo.UpdatePassenger(p);
            }

            // Update booking status
            booking.Status = "Confirmed";

            _unitOfWork.BookingRepo.UpdateBooking(booking);
            _unitOfWork.VehicleInstanceRepo
                .UpdateVehicleInstance(instance, booking.UserId);

            _unitOfWork.Save();
        }

        // ---------------- REFUND PROCESS ----------------

        /// <summary>
        /// Processes refund for a successful payment.
        /// Updates payment status and notifies user.
        /// </summary>
        public async Task RefundPayment(
            int bookingId,
            decimal refundAmount)
        {
            // Retrieve payment
            var payment = _unitOfWork.PaymentRepo
                .GetPaymentByBookingId(bookingId)
                ?? throw new Exception(_config["Payment:PaymentNotFound"]);

            // Ensure refund only allowed for successful payments
            if (payment.PaymentStatus != "Success")
                throw new Exception(_config["Payment:RefundOnlySuccess"]);

            // Update payment details
            payment.PaymentStatus = "Refunded";
            payment.Amount = refundAmount;

            _unitOfWork.PaymentRepo.UpdatePayment(payment);
            _unitOfWork.Save();

            // Retrieve booking for notification
            var booking = _unitOfWork.BookingRepo
                .GetBookingById(bookingId)!;

            string title = _config["Payment:RefundTitle"]!;
            string message = _config["Payment:RefundMessage"]!
                ?.Replace("{Amount}", refundAmount.ToString())
                .Replace("{PNR}", booking.PNR)!;

            // Notify user
            await _notificationManager.NotifyAsync(
                booking.UserId,
                title,
                message
            );
        }
    }
}