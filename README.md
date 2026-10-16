# Navoyage Microservices

Open `backend/Navoyage.Microservices.sln` in Visual Studio. The application root contains `frontend`, `backend`, `database`, and `scripts` folders.

The GitLab-ready copy is exported to the sibling `NavoyageGitLab` folder. It contains source and empty configuration examples; local secrets, archives, uploads, logs, build output, dependencies, IDE state, and previous Git history are excluded.

The application has been reorganized into separate folders for the Angular frontend, .NET backend microservices, and database scripts while preserving the original screens and API behavior.

```text
frontend/   Angular UI copied from the original app
backend/    .NET microservices plus shared clean architecture layers
database/   SQL Server scripts split by service database
```

Default local flow without Docker:

```powershell
node .\scripts\setup-local.cjs
.\database\init-localdb.ps1
.\backend\scripts\start-local.ps1
cd frontend
npm install
npm start
```

The frontend talks to the gateway at `http://localhost:5000/api`. SignalR notifications connect directly to the engagement service at `http://localhost:5105/hubs/notifications`.

The backend defaults to SQL Server LocalDB with one database per service:

The existing SQL instance, database names, and stored data are retained during the Navoyage rebrand. The legacy names below identify physical databases only; all application screens, service projects, namespaces, runtime configuration keys, and logos use Navoyage. No database recreation or migration is required for this rename.

```text
EndaVay_Identity
EndaVay_Booking
EndaVay_Fleet
EndaVay_Catalog
EndaVay_Engagement
```

If you use SQL Server Express or Developer Edition instead, put the service-specific connection strings in the ignored `backend/config/appsettings.local.json`, or set `ConnectionStrings__IdentityConnection` and the corresponding variables for the other services. `docker-compose.yml` is optional for machines that have Docker installed.

After rebuilding and restarting the renamed backend services, sign in again so the browser receives a token for `Navoyage.Identity` and `Navoyage.Client`.

Build outputs are written per project under `backend/.artifacts`.

## Local Credentials

Run `node scripts/setup-local.cjs` once. This creates the ignored `backend/config/appsettings.local.json` with a new random JWT signing key. Existing local settings are preserved when the command runs again. Each microservice reads the same file; native .NET environment variables take precedence.

The checked-in `backend/config/appsettings.shared.json` and `backend/config/appsettings.local.example.json` contain empty credential fields. Configure fresh values only in the local file or deployment secrets:

| Setting | Environment Variable | Used For |
| --- | --- | --- |
| `Jwt:Key` | `Jwt__Key` | Signing and validating login tokens; use the same random key across services |
| `Razorpay:Key` | `Razorpay__Key` | Public checkout key ID |
| `Razorpay:Secret` | `Razorpay__Secret` | Backend payment verification and refunds |
| `Unsplash:AccessKey` | `Unsplash__AccessKey` | Place images |
| `Gemini:ApiKey` | `Gemini__ApiKey` | AI trip generation |

The frontend has no embedded provider keys. It receives only the public Razorpay key ID when an authenticated user creates a payment order. Provider secrets and JWT signing keys stay on the backend. AI, external images, and payments require your own configured provider credentials.

For optional Docker Compose, copy `.env.example` to the ignored `.env` file and fill the values there. `SQL_SA_PASSWORD` and `JWT_SIGNING_KEY` are required; there are no checked-in default passwords. Initialize the service schemas in your SQL container before using database features.

If older credentials were shared or committed, revoke or rotate them in the provider dashboards. Removing values from source does not revoke credentials. Restart services and sign in again after changing the JWT key.

## GitLab Upload

Run `node scripts/check-secrets.cjs` before committing. The included GitLab pipeline repeats this check and reports file locations without printing credential values. This check detects configured secret fields, common token formats, private keys, credential URLs, personal machine paths, and accidentally tracked private files; it does not replace provider rotation or a full security audit.

Use only the clean `NavoyageGitLab` folder for upload. It is initialized as an empty Git repository on `main`. From that folder:

```powershell
node scripts/check-secrets.cjs
git status --short
git add .
git commit -m "Initial Navoyage application"
git remote add origin <your-gitlab-repository-url>
git push -u origin main
```

Replace the repository URL placeholder before running the remote command. In the original working folder, `node scripts/prepare-gitlab.cjs` creates the clean sibling copy; it refuses to overwrite an existing export.
