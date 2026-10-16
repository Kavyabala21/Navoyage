# Navoyage Backend

This backend is split into microservice hosts around the original feature groups while reusing the existing clean architecture layers.

- `src/shared/ApplicationLayer`: repository and service contracts.
- `src/shared/BusinessLayer`: use-case/business services.
- `src/shared/CoreModels`: entities and DTOs.
- `src/shared/DataAccessLayer`: EF Core context and repositories.
- `src/shared/Navoyage.ServiceDefaults`: shared auth, CORS, EF, Swagger, logging, and DI setup.
- `src/services/Identity`: users, login, registration, JWT profile endpoints.
- `src/services/Booking`: bookings, passengers, payments, reviews.
- `src/services/Fleet`: vehicles, vehicle documents, instances, seat layouts, travel companies.
- `src/services/Catalog`: routes, route stop points, stops, pricing, distance.
- `src/services/Engagement`: notifications and SignalR hub.
- `src/services/Ai`: trip-planning AI endpoint.
- `src/services/Gateway`: HTTP gateway preserving the existing frontend API paths.

Local ports:

```text
Gateway    http://localhost:5000
Identity   http://localhost:5101
Booking    http://localhost:5102
Fleet      http://localhost:5103
Catalog    http://localhost:5104
Engagement http://localhost:5105
AI         http://localhost:5106
```

Run all services locally:

```powershell
node ..\scripts\setup-local.cjs
.\scripts\start-local.ps1
```

If you see `Only one usage of each socket address is normally permitted`, clear the old local processes first:

```powershell
.\scripts\stop-local.ps1 -IncludeFrontend
```

Visual Studio 2022 multiple startup projects should only start the API hosts:

```text
Navoyage.Gateway.Api
Navoyage.Identity.Api
Navoyage.Booking.Api
Navoyage.Fleet.Api
Navoyage.Catalog.Api
Navoyage.Engagement.Api
Navoyage.Ai.Api
```

Leave the shared clean architecture projects as `None`: `ApplicationLayer`, `BusinessLayer`, `CoreModels`, `DataAccessLayer`, and `Navoyage.ServiceDefaults`. They are class libraries and cannot be started directly.

The Gateway is the backend entry point for API calls at `http://localhost:5000/api`; it is not the Angular UI. Run the frontend separately and open `http://localhost:4200` for the application screens.

Public defaults live in `config/appsettings.shared.json`. Private local credentials and connection overrides belong in the ignored `config/appsettings.local.json`; all services read this file, with environment variables taking precedence. The shared JWT key must contain at least 32 bytes. By default the services use SQL Server LocalDB with separate databases:

```text
Identity   EndaVay_Identity
Booking    EndaVay_Booking
Fleet      EndaVay_Fleet
Catalog    EndaVay_Catalog
Engagement EndaVay_Engagement
AI         InMemory
```

Before starting the services, initialize the database from the repository root:

```powershell
.\database\init-localdb.ps1
```

For SQL Server Express or Developer Edition, override the service-specific connection strings in `config/appsettings.local.json` or environment variables. Never add passwords or provider keys to shared configuration or launch profiles.
