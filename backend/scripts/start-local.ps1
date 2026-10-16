param(
    [int]$PortOffset = $(if ($env:NAVOYAGE_PORT_OFFSET) { [int]$env:NAVOYAGE_PORT_OFFSET } else { 0 })
)

$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
$artifactRoot = if ($env:NAVOYAGE_RUN_ARTIFACTS) {
    $env:NAVOYAGE_RUN_ARTIFACTS
}
else {
    Join-Path $env:TEMP "Navoyage\RunArtifacts"
}

New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null

$projects = @(
    @{ Name = "Identity"; Port = 5101 + $PortOffset; Path = "src/services/Identity/Navoyage.Identity.Api/Navoyage.Identity.Api.csproj" },
    @{ Name = "Booking"; Port = 5102 + $PortOffset; Path = "src/services/Booking/Navoyage.Booking.Api/Navoyage.Booking.Api.csproj" },
    @{ Name = "Fleet"; Port = 5103 + $PortOffset; Path = "src/services/Fleet/Navoyage.Fleet.Api/Navoyage.Fleet.Api.csproj" },
    @{ Name = "Catalog"; Port = 5104 + $PortOffset; Path = "src/services/Catalog/Navoyage.Catalog.Api/Navoyage.Catalog.Api.csproj" },
    @{ Name = "Engagement"; Port = 5105 + $PortOffset; Path = "src/services/Engagement/Navoyage.Engagement.Api/Navoyage.Engagement.Api.csproj" },
    @{ Name = "Ai"; Port = 5106 + $PortOffset; Path = "src/services/Ai/Navoyage.Ai.Api/Navoyage.Ai.Api.csproj" },
    @{ Name = "Gateway"; Port = 5000 + $PortOffset; Path = "src/services/Gateway/Navoyage.Gateway.Api/Navoyage.Gateway.Api.csproj" }
)

$serviceUrls = @{}
foreach ($project in $projects) {
    $serviceUrls[$project.Name] = "http://localhost:$($project.Port)"
}

foreach ($project in $projects) {
    $isListening = Get-NetTCPConnection -State Listen -LocalPort $project.Port -ErrorAction SilentlyContinue
    if ($isListening) {
        Write-Host "$($project.Name) already listening on port $($project.Port); skipping."
        continue
    }

    $fullPath = Join-Path $backendRoot $project.Path
    $serviceArtifacts = Join-Path $artifactRoot ("{0}-{1}" -f $project.Name, [guid]::NewGuid().ToString("N"))

    dotnet build $fullPath `
        --artifacts-path $serviceArtifacts `
        -m:1 `
        -p:RestoreBuildInParallel=false `
        -p:NuGetAudit=false

    if ($LASTEXITCODE -ne 0) {
        throw "$($project.Name) build failed."
    }

    Start-Process powershell `
        -WorkingDirectory $backendRoot `
        -WindowStyle Hidden `
        -ArgumentList "-NoExit", "-Command", @"
`$env:ASPNETCORE_URLS='$($serviceUrls[$project.Name])'
`$env:ASPNETCORE_ENVIRONMENT='Development'
`$env:NAVOYAGE_IDENTITY_URL='$($serviceUrls.Identity)'
`$env:NAVOYAGE_BOOKING_URL='$($serviceUrls.Booking)'
`$env:NAVOYAGE_FLEET_URL='$($serviceUrls.Fleet)'
`$env:NAVOYAGE_CATALOG_URL='$($serviceUrls.Catalog)'
`$env:NAVOYAGE_ENGAGEMENT_URL='$($serviceUrls.Engagement)'
`$env:NAVOYAGE_AI_URL='$($serviceUrls.Ai)'
dotnet run --no-build --no-launch-profile --project '$fullPath' --artifacts-path '$serviceArtifacts'
"@
}

Write-Host "Navoyage microservices are starting."
Write-Host "Gateway: $($serviceUrls.Gateway)"
Write-Host "Identity: $($serviceUrls.Identity)"
Write-Host "Booking: $($serviceUrls.Booking)"
Write-Host "Fleet: $($serviceUrls.Fleet)"
Write-Host "Catalog: $($serviceUrls.Catalog)"
Write-Host "Engagement: $($serviceUrls.Engagement)"
Write-Host "AI: $($serviceUrls.Ai)"
