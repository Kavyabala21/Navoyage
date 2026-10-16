
using ApplicationLayer.Exceptions;
using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.Extensions.Configuration;
using Exception = ApplicationLayer.Exceptions.Exception;

namespace BusinessLayer.Services
{
    /// <summary>
    /// Handles vehicle instance management including
    /// creation, update, retrieval, soft deletion,
    /// and search operations.
    /// </summary>
    public class VehicleInstanceService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationManager _notificationManager;
        private readonly IConfiguration _config;

        /// <summary>
        /// Constructor for dependency injection.
        /// </summary>
        public VehicleInstanceService(
            IUnitOfWork unitOfWork,
            INotificationManager notificationManager,
            IConfiguration config)
        {
            _unitOfWork = unitOfWork;
            _notificationManager = notificationManager;
            _config = config;
        }

        // ----------------------------------------------------
        // GET ALL VEHICLE INSTANCES
        // ----------------------------------------------------

        /// <summary>
        /// Retrieves all vehicle instances.
        /// </summary>
        public List<VehicleInstance> GetAllVehicleInstances()
        {
            return _unitOfWork.VehicleInstanceRepo.GetAllVehicleInstances() ?? new List<VehicleInstance>();
        }

        // ----------------------------------------------------
        // GET BY INSTANCE ID
        // ----------------------------------------------------

        /// <summary>
        /// Retrieves a specific vehicle instance by its ID.
        /// Throws exception if not found.
        /// </summary>
        public VehicleInstance GetVehicleInstanceById(int id)
        {
            return _unitOfWork.VehicleInstanceRepo.GetVehicleInstanceById(id)
                ?? throw new Exception(_config["VehicleInstance:NotFound"]!);
        }

        // ----------------------------------------------------
        // GET BY VEHICLE ID
        // ----------------------------------------------------

        /// <summary>
        /// Retrieves all vehicle instances associated with a specific vehicle.
        /// </summary>
        public List<VehicleInstance> GetVehicleInstanceByVehicleId(int vehicleId)
        {
            var instances = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceByVehicleId(vehicleId)
                ?.ToList() ?? new List<VehicleInstance>();

            var now = DateTime.UtcNow;

            bool isUpdated = false;

            foreach (var i in instances)
            {
                if (!i.IsActive)
                    continue;

                if (i.Status != null && i.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
                    continue;

                var endTime = DateTime.SpecifyKind(
                    i.ArrivalDate.Date + i.ArrivalTime,
                    DateTimeKind.Utc);

                if (endTime <= now)
                {
                    i.Status = "Completed";
                    _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(i, 0);
                    isUpdated = true;
                }
            }

            if (isUpdated)
            {
                _unitOfWork.Save();
            }

            return instances;
        }

        // ----------------------------------------------------
        // ADD VEHICLE INSTANCE
        // ----------------------------------------------------

        /// <summary>
        /// Creates a new vehicle instance.
        /// Initializes metadata and sends notification after creation.
        /// </summary>
        // ONLY showing modified parts inside your same class

        // ----------------------------------------------------
        // ADD VEHICLE INSTANCE
        // ----------------------------------------------------

        public async Task AddVehicleInstance(VehicleInstance instance, int authId)
        {
            instance.CreatedOn = DateTime.UtcNow.AddHours(5.5);
            instance.IsActive = true;

            var existingInstances = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceByVehicleId(instance.VehicleId);

            var newStart = instance.DepartureDate.Date + instance.DepartureTime;
            var newEnd = instance.ArrivalDate.Date + instance.ArrivalTime;

            if (newEnd <= newStart)
                throw new ApplicationException(_config["VehicleInstance:TimeError"]!);

            var conflict = existingInstances.Any(e =>
            {
                var existingStart = e.DepartureDate.Date + e.DepartureTime;
                var existingEnd = e.ArrivalDate.Date + e.ArrivalTime;

                return newStart < existingEnd && newEnd > existingStart;
            });

            if (conflict)
                throw new ApplicationException(_config["VehicleInstance:InstanceExists"]!);

            // -------- ADD ORIGINAL --------
            await _unitOfWork.VehicleInstanceRepo.AddVehicleInstance(instance, authId);

            var route = _unitOfWork.RoutesRepo.GetRouteById(instance.RouteId);
            string routeName = route?.RouteName ?? "Unknown Route";

            string title = _config["VehicleInstance:CreatedTitle"]!;
            string message = _config["VehicleInstance:CreatedMessage"]!
                                .Replace("{ROUTE}", routeName);

            await _notificationManager.NotifyAsync(authId, title, message);

            // -------- REVERSE LOGIC --------
            var reverseRoute = _unitOfWork.RoutesRepo
                .GetAllRoutes()
                .FirstOrDefault(r => r.ParentRouteId == instance.RouteId);

            if (reverseRoute == null)
            {
                throw new ApplicationException("Reverse route not available. Confirm to continue without reverse instance.");
            }

            DateTime departureDateTime = instance.DepartureDate.Date + instance.DepartureTime;
            DateTime arrivalDateTime = instance.ArrivalDate.Date + instance.ArrivalTime;

            TimeSpan journeyDuration = arrivalDateTime - departureDateTime;

            DateTime reverseStart = arrivalDateTime.AddHours(12);
            DateTime reverseArrival = reverseStart.Add(journeyDuration);

            var reverseInstance = new VehicleInstance
            {
                VehicleId = instance.VehicleId,
                RouteId = reverseRoute.RouteId,
                DepartureDate = reverseStart.Date,
                DepartureTime = reverseStart.TimeOfDay,
                ArrivalDate = reverseArrival.Date,
                ArrivalTime = reverseArrival.TimeOfDay,
                TotalSeats = instance.TotalSeats,
                AvailableSeats = instance.TotalSeats,
                Status = "Scheduled",
                CreatedOn = DateTime.UtcNow.AddHours(5.5),
                IsActive = true
            };

            await _unitOfWork.VehicleInstanceRepo.AddVehicleInstance(reverseInstance, authId);
        }


        // ----------------------------------------------------
        // UPDATE VEHICLE INSTANCE
        // ----------------------------------------------------
        // ----------------------------------------------------
        // UPDATE VEHICLE INSTANCE
        // ----------------------------------------------------

        /// <summary>
        /// Updates an existing vehicle instance.
        /// Validates existence and updates relevant fields.
        /// Sends notification after successful update.
        /// </summary>
        public async Task UpdateVehicleInstance(VehicleInstance instance, int authId)
        {
            var existing = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceById(instance.InstanceId)
                ?? throw new Exception(_config["VehicleInstance:NotFound"]!);

            var booking = _unitOfWork.BookingRepo.GetBookingsByInstanceId(instance.InstanceId);

            existing.RouteId = instance.RouteId;
            existing.DepartureDate = instance.DepartureDate;
            existing.DepartureTime = instance.DepartureTime;
            existing.ArrivalDate = instance.ArrivalDate;
            existing.ArrivalTime = instance.ArrivalTime;
            existing.TotalSeats = instance.TotalSeats;
            existing.AvailableSeats = instance.AvailableSeats;
            existing.Status = instance.Status;

            var existingInstances = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceByVehicleId(instance.VehicleId);

            var newStart = instance.DepartureDate.Date + instance.DepartureTime;
            var newEnd = instance.ArrivalDate.Date + instance.ArrivalTime;

            if (newEnd <= newStart)
                throw new ApplicationException(_config["VehicleInstance:TimeError"]!);

            var conflict = existingInstances.Any(e =>
            {
                var existingStart = e.DepartureDate.Date + e.DepartureTime;
                var existingEnd = e.ArrivalDate.Date + e.ArrivalTime;

                return newStart < existingEnd && newEnd > existingStart;
            });

            if (conflict && existing.InstanceId != instance.InstanceId)
                throw new ApplicationException(_config["VehicleInstance:InstanceExists"]!);

            if (booking != null)
                throw new ApplicationException(_config["VehicleInstance:Can'tUpdate"]!);

            _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(existing, authId);
            _unitOfWork.Save();

            // -------- REVERSE LOGIC --------
            var reverseRoute = _unitOfWork.RoutesRepo
                .GetAllRoutes()
                .FirstOrDefault(r => r.ParentRouteId == instance.RouteId);

            if (reverseRoute != null)
            {
                var reverseInstance = _unitOfWork.VehicleInstanceRepo
                    .GetAllVehicleInstances()
                    .FirstOrDefault(v =>
                        v.RouteId == reverseRoute.RouteId &&
                        v.VehicleId == instance.VehicleId);

                DateTime departureDateTime = instance.DepartureDate.Date + instance.DepartureTime;
                DateTime arrivalDateTime = instance.ArrivalDate.Date + instance.ArrivalTime;

                TimeSpan journeyDuration = arrivalDateTime - departureDateTime;

                DateTime reverseStart = arrivalDateTime.AddHours(12);
                DateTime reverseArrival = reverseStart.Add(journeyDuration);

                if (reverseInstance != null)
                {
                    reverseInstance.DepartureDate = reverseStart.Date;
                    reverseInstance.DepartureTime = reverseStart.TimeOfDay;
                    reverseInstance.ArrivalDate = reverseArrival.Date;
                    reverseInstance.ArrivalTime = reverseArrival.TimeOfDay;
                    reverseInstance.TotalSeats = instance.TotalSeats;
                    reverseInstance.AvailableSeats = instance.TotalSeats;

                    _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(reverseInstance, authId);
                }
                else
                {
                    var newReverse = new VehicleInstance
                    {
                        VehicleId = instance.VehicleId,
                        RouteId = reverseRoute.RouteId,
                        DepartureDate = reverseStart.Date,
                        DepartureTime = reverseStart.TimeOfDay,
                        ArrivalDate = reverseArrival.Date,
                        ArrivalTime = reverseArrival.TimeOfDay,
                        TotalSeats = instance.TotalSeats,
                        AvailableSeats = instance.TotalSeats,
                        Status = "Scheduled",
                        CreatedOn = DateTime.UtcNow.AddHours(5.5),
                        IsActive = true
                    };

                    await _unitOfWork.VehicleInstanceRepo.AddVehicleInstance(newReverse, authId);
                }
            }

            // -------- EXISTING NOTIFICATION --------
            var vehicle = _unitOfWork.VehicleRepo.GetVehicleById(existing.VehicleId);

            string vehicleCode = vehicle?.VehicleCode ?? "Unknown Vehicle";

            string title = _config["VehicleInstance:UpdatedTitle"]!;
            string message = _config["VehicleInstance:UpdatedMessage"]!
                                .Replace("{CODE}", vehicleCode);

            await _notificationManager.NotifyAsync(authId, title, message);
        }

        // ----------------------------------------------------
        // SOFT DELETE VEHICLE INSTANCE
        // ----------------------------------------------------

        /// <summary>
        /// Soft deletes a vehicle instance by marking it inactive.
        /// Sends notification after deletion.
        /// </summary>
        public async Task DeleteVehicleInstance(int instanceId, int authId)
        {
            var instance = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceById(instanceId)
                ?? throw new Exception(_config["VehicleInstance:NotFound"]!);

            instance.IsActive = false;
            var bookings = _unitOfWork.BookingRepo.GetBookingsByInstanceId(instanceId);
            if (bookings != null || instance.Status != "Completed")
            {
                throw new Exception(_config["VehicleInstance:Can'tDelete"]!);
            }
            _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(instance, authId);
            _unitOfWork.Save();

            // Retrieve vehicle code for notification
            var vehicle = _unitOfWork.VehicleRepo
                .GetVehicleById(instance.VehicleId);

            string vehicleCode = vehicle?.VehicleCode ?? "Unknown Vehicle";

            string title = _config["VehicleInstance:DeletedTitle"]!;
            string message = _config["VehicleInstance:DeletedMessage"]!
                                .Replace("{CODE}", vehicleCode);

            await _notificationManager.NotifyAsync(authId, title, message);
        }

        // ----------------------------------------------------
        // SOFT CANCEL VEHICLE INSTANCE
        // ----------------------------------------------------

        /// <summary>
        /// Soft cancel a vehicle instance by marking it cancelled.
        /// Sends notification after deletion.
        /// </summary>
        public async Task CancelVehicleInstance(int instanceId, int authId)
        {
            var instance = _unitOfWork.VehicleInstanceRepo
                .GetVehicleInstanceById(instanceId)
                ?? throw new Exception(_config["VehicleInstance:NotFound"]!);

            /* PREVENT CANCELLATION AFTER DEPARTURE */
            var startTime = DateTime.SpecifyKind(
                instance.DepartureDate.Date + instance.DepartureTime,
                DateTimeKind.Utc);

            if (startTime <= DateTime.UtcNow)
            {
                throw new ApplicationException("Cannot cancel trip after departure.");
            }

            /* CANCEL INSTANCE */
            instance.Status = "Cancelled";
            _unitOfWork.VehicleInstanceRepo.UpdateVehicleInstance(instance, authId);
            _unitOfWork.Save();

            /* GET ALL BOOKINGS */
            var bookings = _unitOfWork.BookingRepo
                .GetBookingsByInstanceId(instanceId);

            foreach (var booking in bookings)
            {
                if (booking.Status == "Cancelled")
                    continue;

                var passengers = _unitOfWork.PassengerRepo
                    .GetPassengersByBookingId(booking.BookingId);

                decimal refundAmount = 0;

                foreach (var p in passengers)
                {
                    if (p.Status == "Confirmed")
                    {
                        refundAmount += p.Fare;
                    }

                    p.Status = "Cancelled";
                    p.Fare = 0;

                    _unitOfWork.PassengerRepo.UpdatePassenger(p);
                }

                booking.Status = "Cancelled";
                booking.TotalAmount = 0;

                _unitOfWork.BookingRepo.UpdateBooking(booking);

                /* REFUND */
                var payment = _unitOfWork.PaymentRepo
                    .GetPaymentByBookingId(booking.BookingId);

                if (payment != null && payment.PaymentStatus == "Success")
                {
                    payment.PaymentStatus = "Refunded";
                    _unitOfWork.PaymentRepo.UpdatePayment(payment);
                }

                _unitOfWork.Save();

                /*  SINGLE COMBINED NOTIFICATION TO USER */
                string userMessage = _config["Booking:TripCancelledMessage"]!
                    .Replace("{PNR}", booking.PNR)
                    .Replace("{AMOUNT}", refundAmount.ToString("0.00"));

                await _notificationManager.NotifyAsync(
                    booking.UserId,
                    _config["Booking:TripCancelledTitle"]!,
                    userMessage
                );
            }

            /* STEP 3: NOTIFY TRAVEL COMPANY OWNER */
            var vehicle = _unitOfWork.VehicleRepo
                .GetVehicleById(instance.VehicleId);

            string vehicleCode = vehicle?.VehicleCode ?? "Unknown Vehicle";

            string ownerMessage = $"Trip for vehicle {vehicleCode} has been cancelled. All bookings refunded.";

            await _notificationManager.NotifyAsync(
                authId,
                _config["VehicleInstance:DeletedTitle"]!,
                ownerMessage
            );
        }

        // ----------------------------------------------------
        // SEARCH VEHICLE INSTANCES
        // ----------------------------------------------------

        /// <summary>
        /// Searches for vehicle instances based on
        /// starting stop, ending stop, and departure date.
        /// </summary>
        public List<VehicleInstance> Search(int startId, int endId, DateTime departureDate)
        {
            if (startId <= 0 || endId <= 0)
                throw new ApplicationException("Invalid stop IDs");

            return _unitOfWork.VehicleInstanceRepo
                .Search(startId, endId, departureDate) ?? new List<VehicleInstance>();
        }
    }
}
