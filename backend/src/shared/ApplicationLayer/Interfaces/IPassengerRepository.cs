using CoreModels.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationLayer.Interfaces
{
    public interface IPassengerRepository
    {
        List<Passenger> GetPassengersByBookingId(int bookingId);
        Passenger? GetById(int passengerId);
        Task AddPassenger(Passenger passenger);
        void UpdatePassenger(Passenger passenger);
        List<Passenger> GetWaitingListPassengersByInstance(int instanceId);

    }

}
