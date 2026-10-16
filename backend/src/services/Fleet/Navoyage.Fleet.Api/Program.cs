using Navoyage.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddNavoyageApiDefaults("Fleet");

var app = builder.Build();

app.UseNavoyageApiDefaults();

app.Run();
