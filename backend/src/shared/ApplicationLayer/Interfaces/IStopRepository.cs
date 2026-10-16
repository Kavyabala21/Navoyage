using System;

    using CoreModels.Entities;

    namespace ApplicationLayer.Interfaces
    {
        public interface IStopRepository
        {
            IEnumerable<Stop> GetAllStops();
            Stop? GetStopById(int id);
            Stop? GetStopByName(string name);
            Task AddStop(Stop stop);
            void UpdateStop(Stop stop);
            void DeleteStop(Stop stop);
        }
    }