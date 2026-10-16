param(
    [string[]]$Services = @("identity", "fleet", "catalog", "booking", "engagement")
)

$ErrorActionPreference = "Stop"

$databaseRoot = $PSScriptRoot
$defaultLocalDbInstance = "EndaVayLocalDb"
$serverName = if ($env:NAVOYAGE_SQLSERVER) {
    $env:NAVOYAGE_SQLSERVER
}
else {
    "(localdb)\$defaultLocalDbInstance"
}

$localDb = Get-Command sqllocaldb -ErrorAction SilentlyContinue
$localDbInstance = if ($serverName -match '^\(localdb\)\\(.+)$') { $Matches[1] } else { $null }
if ($localDb -and $localDbInstance) {
    & sqllocaldb start $localDbInstance | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Could not start SQL Server LocalDB instance '$localDbInstance'. Use SQL Server Express/Developer and set NAVOYAGE_SQLSERVER, or repair LocalDB."
    }
}

$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    Write-Host "sqlcmd is not installed."
    Write-Host "Open the required database\services\<service>\01-schema.sql file in SQL Server Management Studio or Azure Data Studio and run it manually."
    exit 1
}

foreach ($service in $Services) {
    $scriptPath = Join-Path $databaseRoot "services\$service\01-schema.sql"

    if (-not (Test-Path $scriptPath)) {
        throw "Database script not found for service '$service': $scriptPath"
    }

    Write-Host "Initializing Navoyage $service database on $serverName..."
    & sqlcmd -S $serverName -E -C -b -i $scriptPath
    if ($LASTEXITCODE -ne 0) {
        throw "Database initialization failed for service '$service'."
    }
}

Write-Host "Navoyage service database initialization complete."
