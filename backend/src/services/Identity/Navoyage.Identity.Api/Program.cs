using ApplicationLayer.Interfaces;
using Navoyage.Extensions;
using Navoyage.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

builder.AddNavoyageApiDefaults("Identity");
builder.Services.AddScoped<ITokenService, TokenService>();

var app = builder.Build();

app.UseNavoyageApiDefaults();

app.Run();
