using Navoyage.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddNavoyageApiDefaults("Ai");

var app = builder.Build();

app.UseNavoyageApiDefaults();

app.Run();
