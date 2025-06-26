# StopRemoteHealth.ps1 - PowerShell script to stop all Remote Health services
Write-Host "`nStopping Remote Health Monitoring System..." -ForegroundColor Cyan
Write-Host ""

# Stop the frontend server (Node.js processes)
Write-Host "Stopping Frontend server..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | ForEach-Object { $_.Kill() }
        Write-Host "Frontend server stopped successfully." -ForegroundColor Green
    } else {
        Write-Host "Frontend server was not running." -ForegroundColor Gray
    }
} catch {
    Write-Host "Error stopping frontend server: $_" -ForegroundColor Red
}

# Stop the backend server (Python/uvicorn processes)
Write-Host "Stopping Backend server..." -ForegroundColor Yellow
try {
    $pythonProcesses = Get-Process -Name "python" -ErrorAction SilentlyContinue
    if ($pythonProcesses) {
        $pythonProcesses | ForEach-Object { $_.Kill() }
        Write-Host "Backend server stopped successfully." -ForegroundColor Green
    } else {
        Write-Host "Backend server was not running." -ForegroundColor Gray
    }
} catch {
    Write-Host "Error stopping backend server: $_" -ForegroundColor Red
}

Write-Host "`nRemote Health Monitoring System has been shut down." -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 3
