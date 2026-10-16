FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
ARG SERVICE_PROJECT
RUN dotnet restore "$SERVICE_PROJECT"
RUN dotnet publish "$SERVICE_PROJECT" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /src/config ./config
ARG SERVICE_DLL
ENV SERVICE_DLL=$SERVICE_DLL
ENTRYPOINT ["sh", "-c", "dotnet $SERVICE_DLL"]
