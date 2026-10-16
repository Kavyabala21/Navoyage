
namespace ApplicationLayer.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository UserRepo { get; }
        IVehicleRepository VehicleRepo { get; }
        IVehicleDocumentRepository VehicleDocumentRepo { get; }
        ITravelCompanyRepository TravelCompanyRepo { get; }

        IVehicleInstanceRepository VehicleInstanceRepo { get; }
        IRoutesRepository RoutesRepo { get; }
        IRouteStopPointRepository RouteStopPointRepo { get; }
        IBookingRepository BookingRepo { get; }
        IPassengerRepository PassengerRepo { get; }
        IPaymentRepository PaymentRepo { get; }
        IPricingRepository PricingRepo { get; }
        ISeatLayoutRepository SeatLayoutRepo { get; }
        IStopRepository StopRepo { get; }
        IReviewRepository ReviewRepo { get; }
        IAiRepository AiRepo { get; }
        void Save();          
        Task SaveAsync();
    }
}
