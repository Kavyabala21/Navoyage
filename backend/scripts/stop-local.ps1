param(
    [int]$PortOffset = $(if ($env:NAVOYAGE_PORT_OFFSET) { [int]$env:NAVOYAGE_PORT_OFFSET } else { 0 }),
    [switch]$IncludeFrontend
)

$ErrorActionPreference = "Stop"

$ports = @(
    (5000 + $PortOffset),
    (5101 + $PortOffset),
    (5102 + $PortOffset),
    (5103 + $PortOffset),
    (5104 + $PortOffset),
    (5105 + $PortOffset),
    (5106 + $PortOffset)
)

if ($IncludeFrontend) {
    $ports += 4200
}

$processIds = New-Object System.Collections.Generic.HashSet[int]
$listeningRows = netstat -ano | Select-String 'LISTENING'

foreach ($row in $listeningRows) {
    $parts = ($row.ToString() -split '\s+') | Where-Object { $_ }
    if ($parts.Count -lt 5) {
        continue
    }

    $localAddress = $parts[1]
    $owningProcess = [int]$parts[-1]

    foreach ($port in $ports) {
        if ($localAddress -match ":$port$") {
            [void]$processIds.Add($owningProcess)
        }
    }
}

if ($processIds.Count -eq 0) {
    Write-Host "No Navoyage local ports are currently in use."
    return
}

foreach ($processId in $processIds) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if (-not $process) {
        continue
    }

    Write-Host "Stopping PID $processId ($($process.ProcessName))"
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Write-Host "Navoyage local ports cleared."
