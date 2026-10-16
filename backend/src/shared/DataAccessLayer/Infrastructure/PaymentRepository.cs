using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

namespace DataAccessLayer.Repositories
{
    public class PaymentRepository : IPaymentRepository
    {
        private readonly ApplicationDbContext _context;

        public PaymentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public Payment AddPayment(Payment payment)
        {
            _context.Payment.Add(payment);
            _context.SaveChanges();
            return payment;
        }

        public Payment? GetPaymentById(int paymentId)
        {
            return _context.Payment
                .Include(p => p.Booking)
                .FirstOrDefault(p => p.PaymentId == paymentId);
        }

        public Payment? GetPaymentByBookingId(int bookingId)
        {
            return _context.Payment
                .FirstOrDefault(p => p.BookingId == bookingId);
        }

        public void UpdatePayment(Payment payment)
        {
            _context.Payment.Update(payment);
            _context.SaveChanges();
        }
    }
}
