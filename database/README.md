# Navoyage Database

The Navoyage application continues to use the existing physical SQL databases and LocalDB instance listed below. Keeping these names preserves access to existing records; the rebrand does not rename, drop, or recreate databases.

The database layer is split by microservice. Each service owns its own database and schema:

```text
services/identity/01-schema.sql     EndaVay_Identity
services/booking/01-schema.sql      EndaVay_Booking
services/fleet/01-schema.sql        EndaVay_Fleet
services/catalog/01-schema.sql      EndaVay_Catalog
services/engagement/01-schema.sql   EndaVay_Engagement
```

The original single-database script is still kept as a legacy reference in `NavoyageDatabase.sql` and `init/01-NavoyageDatabase.sql`.

Local default service databases:

```text
Server=(localdb)\EndaVayLocalDb;Database=EndaVay_Identity;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;
Server=(localdb)\EndaVayLocalDb;Database=EndaVay_Booking;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;
Server=(localdb)\EndaVayLocalDb;Database=EndaVay_Fleet;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;
Server=(localdb)\EndaVayLocalDb;Database=EndaVay_Catalog;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;
Server=(localdb)\EndaVayLocalDb;Database=EndaVay_Engagement;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True;
```

To initialize every service database without Docker, run this from the repository root:

```powershell
.\database\init-localdb.ps1
```

To initialize only one service database:

```powershell
.\database\init-localdb.ps1 -Services booking
```

The script uses `sqlcmd` against `(localdb)\EndaVayLocalDb`. If `sqlcmd` is not installed, open the required `services/<service>/01-schema.sql` file in SQL Server Management Studio or Azure Data Studio and run it against your local SQL Server instance.

If LocalDB is not available on your machine, install/start SQL Server Express or Developer Edition and point the initializer to that instance:

```powershell
$env:NAVOYAGE_SQLSERVER = ".\SQLEXPRESS"
.\database\init-localdb.ps1
```

Then put the service-specific connection overrides in the ignored `backend/config/appsettings.local.json` to use the same server name. Keep database passwords out of SQL scripts and shared configuration.
