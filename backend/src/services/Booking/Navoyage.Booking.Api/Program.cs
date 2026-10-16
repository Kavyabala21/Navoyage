using Navoyage.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddNavoyageApiDefaults("Booking");

var app = builder.Build();

app.UseNavoyageApiDefaults();

app.Run();
