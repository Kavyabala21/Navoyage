using ApplicationLayer.Interfaces;
using CoreModels.Entities;
using Microsoft.EntityFrameworkCore;

public class PassengerRepository : IPassengerRepository
{
    private readonly ApplicationDbContext _context;

    public PassengerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public List<Passenger> GetPassengersByBookingId(int bookingId)
    {
        return _context.Passenger
            .Where(p => p.BookingId == bookingId)
            .ToList();
    }

    public Passenger? GetById(int passengerId)
    {
        return _context.Passenger.FirstOrDefault(p => p.PassengerId == passengerId);
    }

    public async Task AddPassenger(Passenger passenger)
    {
       await _context.Passenger.AddAsync(passenger);
        await _context.SaveChangesAsync();
    }

    public void UpdatePassenger(Passenger passenger)
    {
        _context.Passenger.Update(passenger);
    }
    public List<Passenger> GetWaitingListPassengersByInstance(int instanceId)
    {
        return _context.Passenger
            .Include(p => p.Booking)
            .Where(p =>
                p.Status == "WaitingList" &&
                p.Booking!.InstanceId == instanceId)
            .OrderBy(p => p.CreatedOn).ThenByDescending(p=>p.PassengerId)
            .ToList();
    }

}
