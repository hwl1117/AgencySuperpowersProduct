# VideoBrain Desktop App Launcher
# Fully hidden - no console output

$ErrorActionPreference = "SilentlyContinue"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendUrl = "http://localhost:3000"
$BackendUrl = "http://localhost:8000/health"

# Find Chrome or Edge
$ChromePaths = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$Chrome = $null
foreach ($p in $ChromePaths) {
    if (Test-Path $p) {
        $Chrome = $p
        break
    }
}

if (-not $Chrome) { exit 1 }

# Check if services are already running
$backendRunning = $false
$frontendRunning = $false

try {
    $response = Invoke-WebRequest -Uri $BackendUrl -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) { $backendRunning = $true }
} catch {}

try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) { $frontendRunning = $true }
} catch {}

# Start backend if not running
if (-not $backendRunning) {
    $backendDir = Join-Path $RootDir "backend-node"
    Start-Process -FilePath "cmd" -ArgumentList "/c", "node", "server-v2.js" -WorkingDirectory $backendDir -WindowStyle Hidden
    Start-Sleep -Seconds 5

    $retries = 0
    while ($retries -lt 10) {
        try {
            $response = Invoke-WebRequest -Uri $BackendUrl -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) { break }
        } catch {}
        Start-Sleep -Seconds 2
        $retries++
    }
}

# Start frontend if not running
if (-not $frontendRunning) {
    $frontendDir = Join-Path $RootDir "frontend"
    Start-Process -FilePath "cmd" -ArgumentList "/c", "npm", "run", "dev" -WorkingDirectory $frontendDir -WindowStyle Hidden
    Start-Sleep -Seconds 8

    $retries = 0
    while ($retries -lt 15) {
        try {
            $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) { break }
        } catch {}
        Start-Sleep -Seconds 2
        $retries++
    }
}

# Launch Chrome in app mode
$chromeDataDir = Join-Path $RootDir ".chrome-data"
$chromeArgs = "--app=$FrontendUrl", "--window-size=1280,860", "--user-data-dir=$chromeDataDir", "--class=VideoBrain"
Start-Process -FilePath $Chrome -ArgumentList $chromeArgs
