using System.Security.Claims;
using System.Security.Authentication;
using System.Text;
using ApplicationLayer.Interfaces;
using BusinessLayer.Services;
using CoreModels.Entities;
using DataAccessLayer.Infrastructure;
using DataAccessLayer.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Serilog;

namespace Navoyage.ServiceDefaults;

public static class NavoyageApiDefaults
{
    private const string CorsPolicy = "NavoyageFrontend";

    public static WebApplicationBuilder AddNavoyageApiDefaults(
        this WebApplicationBuilder builder,
        string serviceName)
    {
        var backendRoot = FindBackendRoot();

        builder.Configuration
            .AddJsonFile(Path.Combine(backendRoot, "config", "appsettings.shared.json"), optional: false, reloadOnChange: true)
            .AddJsonFile(Path.Combine(backendRoot, "config", "Response-Messages.json"), optional: false, reloadOnChange: true)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddJsonFile(Path.Combine(backendRoot, "config", "appsettings.local.json"), optional: true, reloadOnChange: true)
            .AddEnvironmentVariables();

        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
        {
            throw new InvalidOperationException(
                "Configure Jwt__Key with a random signing key of at least 32 bytes, or run node scripts/setup-local.cjs from the application root.");
        }

        builder.Host.UseSerilog((context, services, loggerConfiguration) =>
        {
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .WriteTo.Console();
        });

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(CorsPolicy, policy =>
            {
                var origins = builder.Configuration
                    .GetSection("Cors:AllowedOrigins")
                    .Get<string[]>() ?? ["http://localhost:4200"];

                policy.WithOrigins(origins)
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            });
        });

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)),
                    RoleClaimType = ClaimTypes.Role
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrWhiteSpace(accessToken) &&
                            path.StartsWithSegments("/hubs/notifications"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        builder.Services.AddAuthorization();
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddHttpClient();

        builder.Services.AddDbContext<ApplicationDbContext>(options =>
        {
            var connectionStringName = GetConnectionStringName(serviceName);
            var connectionString = builder.Configuration.GetConnectionString(connectionStringName)
                ?? builder.Configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(connectionString) ||
                connectionString.StartsWith("InMemory", StringComparison.OrdinalIgnoreCase))
            {
                options.UseLazyLoadingProxies()
                    .UseInMemoryDatabase($"Navoyage_{serviceName}");
                return;
            }

            options.UseLazyLoadingProxies()
                .UseSqlServer(connectionString, sql =>
                {
                    sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                    sql.CommandTimeout(60);
                    sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                });
        });

        builder.Services.AddNavoyageApplicationServices();

        return builder;
    }

    private static string GetConnectionStringName(string serviceName)
    {
        return serviceName.ToLowerInvariant() switch
        {
            "identity" => "IdentityConnection",
            "booking" => "BookingConnection",
            "fleet" => "FleetConnection",
            "catalog" => "CatalogConnection",
            "engagement" => "EngagementConnection",
            "ai" => "AiConnection",
            _ => "DefaultConnection"
        };
    }

    public static WebApplication UseNavoyageApiDefaults(this WebApplication app)
    {
        app.UseSerilogRequestLogging();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        var documentsPath = Path.Combine(
            Directory.GetCurrentDirectory(),
            app.Configuration["FileStorage:DocumentsPath"] ?? "Documents");
        Directory.CreateDirectory(documentsPath);

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(documentsPath),
            RequestPath = "/Documents"
        });

        app.UseRouting();
        app.UseCors(CorsPolicy);
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();
        app.MapGet("/", (IHostEnvironment environment, IConfiguration configuration) =>
        {
            if (environment.IsDevelopment())
            {
                return Results.Redirect("/swagger");
            }

            return Results.Ok(new
            {
                status = "Running",
                service = configuration["Service:Name"] ?? environment.ApplicationName,
                docs = "/swagger",
                health = "/health"
            });
        }).AllowAnonymous();

        app.MapGet("/health", () => Results.Ok(new
        {
            status = "Healthy",
            service = app.Configuration["Service:Name"] ?? app.Environment.ApplicationName,
            checkedAt = DateTimeOffset.UtcNow
        })).AllowAnonymous();

        return app;
    }

    private static IServiceCollection AddNavoyageApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<IVehicleDocumentRepository, VehicleDocumentRepository>();
        services.AddScoped<ITravelCompanyRepository, TravelCompanyRepository>();
        services.AddScoped<IVehicleInstanceRepository, VehicleInstanceRepository>();
        services.AddScoped<IRoutesRepository, RoutesRepository>();
        services.AddScoped<IRouteStopPointRepository, RouteStopPointRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IPassengerRepository, PassengerRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IPricingRepository, PricingRepository>();
        services.AddScoped<ISeatLayoutRepository, SeatLayoutRepository>();
        services.AddScoped<IStopRepository, StopRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IDistanceRepository, DistanceService>();
        services.AddHttpClient<IIdentityUserClient, IdentityUserClient>((serviceProvider, client) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var identityUrl = configuration["ServiceUrls:Identity"] ?? "http://localhost:5101";
            client.BaseAddress = new Uri(identityUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<ITravelCompanyClient, TravelCompanyClient>((serviceProvider, client) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var fleetUrl = configuration["ServiceUrls:Fleet"] ?? "http://localhost:5103";
            client.BaseAddress = new Uri(fleetUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddHttpClient<IAiRepository, AiRepository>(client =>
        {
            client.Timeout = TimeSpan.FromMinutes(2);
            client.DefaultRequestVersion = System.Net.HttpVersion.Version11;
            client.DefaultVersionPolicy = System.Net.Http.HttpVersionPolicy.RequestVersionOrLower;
        })
        .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
        {
            SslOptions = new()
            {
                EnabledSslProtocols = SslProtocols.Tls12
            }
        });

        services.AddScoped<INotificationSender, NoOpNotificationSender>();
        services.AddHttpClient<INotificationManager, HttpNotificationManager>((serviceProvider, client) =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var engagementUrl = configuration["ServiceUrls:Engagement"] ?? "http://localhost:5105";
            client.BaseAddress = new Uri(engagementUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });

        services.AddScoped<UserService>();
        services.AddScoped<VehicleService>();
        services.AddScoped<VehicleDocumentService>();
        services.AddScoped<TravelCompanyService>();
        services.AddScoped<VehicleInstanceService>();
        services.AddScoped<RoutesService>();
        services.AddScoped<RouteStopPointService>();
        services.AddScoped<BookingService>();
        services.AddScoped<PassengerService>();
        services.AddScoped<PaymentService>();
        services.AddScoped<PricingService>();
        services.AddScoped<SeatLayoutService>();
        services.AddScoped<StopService>();
        services.AddScoped<NotificationService>();
        services.AddScoped<ReviewService>();
        services.AddScoped<AiService>();

        return services;
    }

    private static string FindBackendRoot()
    {
        var directory = new DirectoryInfo(Directory.GetCurrentDirectory());

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "config", "appsettings.shared.json")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException("Could not find backend/config/appsettings.shared.json.");
    }
}

internal sealed class NoOpNotificationSender : INotificationSender
{
    public Task SendToUserAsync(int userId, string title, string message)
    {
        return Task.CompletedTask;
    }
}

internal sealed class NoOpNotificationManager : INotificationManager
{
    public Task NotifyAsync(int userId, string title, string message)
    {
        return Task.CompletedTask;
    }
}
