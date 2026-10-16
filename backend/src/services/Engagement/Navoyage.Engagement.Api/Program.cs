using ApplicationLayer.Interfaces;
using Navoyage.API.Hubs;
using Navoyage.ServiceDefaults;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

builder.AddNavoyageApiDefaults("Engagement");
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();
builder.Services.AddScoped<INotificationSender, SignalRNotificationSender>();
builder.Services.AddScoped<INotificationManager, NotificationManager>();

var app = builder.Build();

app.UseNavoyageApiDefaults();
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();
