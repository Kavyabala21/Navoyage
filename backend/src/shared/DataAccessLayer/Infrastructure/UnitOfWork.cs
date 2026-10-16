using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using DataAccessLayer.Repositories;
namespace DataAccessLayer.Infrastructure
{
    public class UnitOfWork : IUnitOfWork
    {
        public IUserRepository UserRepo { get; }
        public IVehicleRepository VehicleRepo { get; }
        public IVehicleDocumentRepository VehicleDocumentRepo { get; }
        public ITravelCompanyRepository TravelCompanyRepo { get; }
        public IVehicleInstanceRepository VehicleInstanceRepo { get; }
        public IRoutesRepository RoutesRepo { get; }
        public IRouteStopPointRepository RouteStopPointRepo { get; }
        public IBookingRepository BookingRepo { get; }
        public IPassengerRepository PassengerRepo { get; }
        public IPaymentRepository PaymentRepo { get; }
        public IPricingRepository PricingRepo { get; }

        public ISeatLayoutRepository SeatLayoutRepo { get; }
        public IStopRepository StopRepo { get; }
        public IReviewRepository ReviewRepo { get; }

      public IAiRepository AiRepo { get; }

        public ApplicationDbContext _context;

        public UnitOfWork(
            ApplicationDbContext context,
            IUserRepository userRepo,
            IVehicleRepository vehicleRepo,
            IVehicleDocumentRepository vehicleDocumentRepo,
            ITravelCompanyRepository travelCompanyRepo,
            IVehicleInstanceRepository vehicleInstanceRepo,
            IRoutesRepository routesRepo,
            IRouteStopPointRepository routeStopPointRepo,
            IBookingRepository bookingRepo,
            IPassengerRepository passengerRepo,
            IPaymentRepository paymentRepo,
            IPricingRepository pricingRepo,
            ISeatLayoutRepository seatLayoutRepo,
            IStopRepository stopRepo,
            IReviewRepository reviewRepo,
            IAiRepository aiRepo
        )
        {
            _context = context;
            UserRepo = userRepo;
            VehicleRepo = vehicleRepo;
            VehicleDocumentRepo = vehicleDocumentRepo;
            TravelCompanyRepo = travelCompanyRepo;
            VehicleInstanceRepo = vehicleInstanceRepo;
            RoutesRepo = routesRepo;
            RouteStopPointRepo = routeStopPointRepo;
            BookingRepo = bookingRepo;
            PassengerRepo = passengerRepo;
            PaymentRepo = paymentRepo;
            PricingRepo = pricingRepo;
            SeatLayoutRepo = seatLayoutRepo;
            StopRepo = stopRepo;
            ReviewRepo = reviewRepo;
            AiRepo = aiRepo;
        }
        public async Task SaveAsync()
        {
            await _context.SaveChangesAsync();
        }

      

        // -------------------------------------------------------------
        // Releases database context resources once all operations are done
        // Ensures the connection and tracked objects are disposed properly
        // -------------------------------------------------------------
        public void Dispose()
        {
            _context.Dispose();
            GC.SuppressFinalize(this);
        }

        // -------------------------------------------------------------
        // Commits all pending changes from repositories to the database
        // Acts as a single transaction boundary for all repository actions
        // -------------------------------------------------------------
        public void Save()
        {
            _context.SaveChanges();
        }
    }
}
