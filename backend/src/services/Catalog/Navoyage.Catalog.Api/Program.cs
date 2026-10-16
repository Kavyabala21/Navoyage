using Navoyage.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddNavoyageApiDefaults("Catalog");

var app = builder.Build();

app.UseNavoyageApiDefaults();

app.Run();
