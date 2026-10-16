using Microsoft.EntityFrameworkCore;
namespace CoreModels.Entities
{
        public class ApplicationDbContext : DbContext
        {
            public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
                : base(options)
            {
            }
            public DbSet<User> User { get; set; }
            public DbSet<TravelCompany> TravelCompany { get; set; }
            public DbSet<Vehicle> Vehicle { get; set; }
            public DbSet<VehicleDocument> VehicleDocument { get; set; }
            public DbSet<Routes> Routes { get; set; }
            public DbSet<Stop> Stop { get; set; }
            public DbSet<RouteStopPoint> RouteStopPoint { get; set; }
            public DbSet<SeatLayout> SeatLayout { get; set; }
            public DbSet<Pricing> Pricing { get; set; }
            public DbSet<VehicleInstance> VehicleInstance { get; set; }
            public DbSet<Booking> Booking { get; set; }
            public DbSet<Passenger> Passenger { get; set; }
            public DbSet<Payment> Payment { get; set; }
            public DbSet<Review> Review { get; set; }
            public DbSet<Notification> Notification { get; set; }
            public DbSet<Notification> Notifications { get; set; }
    }
}