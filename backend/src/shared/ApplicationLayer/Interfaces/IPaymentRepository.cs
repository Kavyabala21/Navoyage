using CoreModels.Entities;

namespace ApplicationLayer.Interfaces
{
    public interface IPaymentRepository
    {
        Payment AddPayment(Payment payment);
        Payment? GetPaymentById(int paymentId);
        Payment? GetPaymentByBookingId(int bookingId);
        void UpdatePayment(Payment payment);
    }
}
