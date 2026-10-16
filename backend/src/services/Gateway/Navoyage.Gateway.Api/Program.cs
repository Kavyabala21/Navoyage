using Microsoft.Extensions.Primitives;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

builder.Services.AddHttpClient("gateway", client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("NavoyageFrontend", policy =>
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

var app = builder.Build();
var routes = builder.Configuration
    .GetSection("ServiceRoutes")
    .Get<Dictionary<string, string>>() ?? new Dictionary<string, string>();
ApplyServiceBaseUrlOverrides(routes, builder.Configuration);

app.UseCors("NavoyageFrontend");

app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "Navoyage.Gateway.Api",
    checkedAt = DateTimeOffset.UtcNow
}));

app.MapGet("/", () => Results.Content("""
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Navoyage Gateway</title>
        <style>
            body { font-family: Segoe UI, Arial, sans-serif; margin: 40px; line-height: 1.5; color: #1f2937; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
            a { color: #2563eb; }
        </style>
    </head>
    <body>
        <h1>Navoyage Gateway is running</h1>
        <p>This is the backend API gateway, not the Angular frontend.</p>
        <p>Open the frontend at <a href="http://localhost:4200">http://localhost:4200</a>.</p>
        <p>Gateway health check: <a href="/health">/health</a></p>
        <p>API calls should use <code>http://localhost:5000/api</code>.</p>
    </body>
    </html>
    """, "text/html"));

app.Map("/{**path}", async (
    HttpContext context,
    IHttpClientFactory httpClientFactory) =>
{
    var targetBaseUrl = ResolveTargetBaseUrl(context.Request.Path, routes);
    if (targetBaseUrl is null)
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsJsonAsync(new
        {
            status = false,
            message = $"No service route configured for '{context.Request.Path}'."
        });
        return;
    }

    var targetUri = BuildTargetUri(context.Request, targetBaseUrl);
    using var requestMessage = CreateProxyRequest(context, targetUri);
    var client = httpClientFactory.CreateClient("gateway");

    using var responseMessage = await client.SendAsync(
        requestMessage,
        HttpCompletionOption.ResponseHeadersRead,
        context.RequestAborted);

    context.Response.StatusCode = (int)responseMessage.StatusCode;
    CopyHeaders(responseMessage.Headers, context.Response.Headers);
    CopyHeaders(responseMessage.Content.Headers, context.Response.Headers);
    context.Response.Headers.Remove("transfer-encoding");

    await responseMessage.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
});

app.Run();

static string? ResolveTargetBaseUrl(PathString path, IReadOnlyDictionary<string, string> routes)
{
    var requestPath = path.Value ?? "/";

    return routes
        .OrderByDescending(route => route.Key.Length)
        .FirstOrDefault(route => requestPath.StartsWith(route.Key, StringComparison.OrdinalIgnoreCase))
        .Value;
}

static void ApplyServiceBaseUrlOverrides(
    IDictionary<string, string> routes,
    IConfiguration configuration)
{
    OverrideRoutes(routes, GetServiceBaseUrl(configuration, "Identity"), "/api/User");
    OverrideRoutes(
        routes,
        GetServiceBaseUrl(configuration, "Booking"),
        "/api/Booking",
        "/api/Passenger",
        "/api/payment",
        "/api/Review");
    OverrideRoutes(
        routes,
        GetServiceBaseUrl(configuration, "Fleet"),
        "/api/VehicleDocument",
        "/api/VehicleInstance",
        "/api/Vehicle",
        "/api/TravelCompany",
        "/api/SeatLayout",
        "/Documents");
    OverrideRoutes(
        routes,
        GetServiceBaseUrl(configuration, "Catalog"),
        "/api/RouteStopPoint",
        "/api/Routes",
        "/api/Stop",
        "/api/Pricing",
        "/api/Distance");
    OverrideRoutes(
        routes,
        GetServiceBaseUrl(configuration, "Engagement"),
        "/api/notifications",
        "/hubs/notifications");
    OverrideRoutes(routes, GetServiceBaseUrl(configuration, "Ai"), "/api/ai-trip");
}

static string? GetServiceBaseUrl(IConfiguration configuration, string serviceName)
{
    return configuration[$"ServiceBaseUrls:{serviceName}"] ??
        configuration[$"NAVOYAGE_{serviceName.ToUpperInvariant()}_URL"];
}

static void OverrideRoutes(
    IDictionary<string, string> routes,
    string? baseUrl,
    params string[] routePrefixes)
{
    if (string.IsNullOrWhiteSpace(baseUrl))
    {
        return;
    }

    foreach (var routePrefix in routePrefixes)
    {
        routes[routePrefix] = baseUrl;
    }
}

static Uri BuildTargetUri(HttpRequest request, string targetBaseUrl)
{
    var builder = new UriBuilder(targetBaseUrl)
    {
        Path = request.Path,
        Query = request.QueryString.HasValue
            ? request.QueryString.Value![1..]
            : string.Empty
    };

    return builder.Uri;
}

static HttpRequestMessage CreateProxyRequest(HttpContext context, Uri targetUri)
{
    var request = context.Request;
    var requestMessage = new HttpRequestMessage(new HttpMethod(request.Method), targetUri);

    if (!HttpMethods.IsGet(request.Method) &&
        !HttpMethods.IsHead(request.Method) &&
        !HttpMethods.IsDelete(request.Method) &&
        !HttpMethods.IsTrace(request.Method))
    {
        requestMessage.Content = new StreamContent(request.Body);
    }

    foreach (var header in request.Headers)
    {
        if (!requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
        {
            requestMessage.Content?.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }
    }

    requestMessage.Headers.Host = targetUri.Authority;
    return requestMessage;
}

static void CopyHeaders(IEnumerable<KeyValuePair<string, IEnumerable<string>>> source, IHeaderDictionary target)
{
    foreach (var header in source)
    {
        target[header.Key] = new StringValues(header.Value.ToArray());
    }
}
