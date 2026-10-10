$ErrorActionPreference = 'Stop'
$appDirectory = $PSScriptRoot
$workspaceDirectory = Split-Path (Split-Path $appDirectory -Parent) -Parent
$privateDirectory = Join-Path $workspaceDirectory 'work/private'
$secretPath = Join-Path $privateDirectory 'converty-worker.secret'
if (!(Test-Path -LiteralPath $secretPath)) { throw 'The owner worker key is missing. This launcher works on the configured owner PC only.' }
$lockPath = Join-Path $privateDirectory 'worker.lock'
try { $workerLock = [IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None') }
catch { throw 'Converty worker is already running. Use Stop-Worker.ps1 before starting another copy.' }
$nativeProcess = $null
$stopPath = Join-Path $privateDirectory 'worker.stop'
try {
    Remove-Item -LiteralPath $stopPath -ErrorAction SilentlyContinue
    $nodeExecutable = (Get-Command node -ErrorAction Stop).Source
    Remove-Item Env:CONVERTY_WORKER_TOKEN -ErrorAction SilentlyContinue
    $env:PORT = '5175'
    $env:HOST = '127.0.0.1'
    $nativeProcess = Start-Process -FilePath $nodeExecutable -ArgumentList ('"' + (Join-Path $appDirectory 'api.js') + '"') -WorkingDirectory $appDirectory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $privateDirectory 'native.log') -RedirectStandardError (Join-Path $privateDirectory 'native-error.log')
    $nativeReady = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if ($nativeProcess.HasExited) { throw 'The local converter could not start. See work/private/native-error.log.' }
        try { $health = Invoke-WebRequest 'http://127.0.0.1:5175/api/health' -UseBasicParsing -TimeoutSec 2; if ($health.StatusCode -eq 200) { $nativeReady = $true; break } } catch { Start-Sleep -Milliseconds 500 }
    }
    if (!$nativeReady) { throw 'The local converter did not become ready.' }
    $secureKey = Get-Content -LiteralPath $secretPath | ConvertTo-SecureString
    $env:CONVERTY_WORKER_TOKEN = [Net.NetworkCredential]::new('', $secureKey).Password
    $env:CONVERTY_LOCAL_API = 'http://127.0.0.1:5175'
    $env:CONVERTY_PUBLIC_API = 'https://converty-tump3-api.onrender.com'
    $env:CONVERTY_WORKER_STOP_FILE = $stopPath
    $env:CONVERTY_WORKER_REPORT = Join-Path $privateDirectory 'worker-last-run.json'
    Write-Host 'Converty YouTube worker is running. Keep this PC awake and connected. Use Stop-Worker.ps1 or Ctrl+C to stop.'
    & $nodeExecutable (Join-Path $appDirectory 'owner-worker.mjs')
} finally {
    Remove-Item Env:CONVERTY_WORKER_TOKEN -ErrorAction SilentlyContinue
    if ($nativeProcess -and !$nativeProcess.HasExited) { Stop-Process -Id $nativeProcess.Id -ErrorAction SilentlyContinue }
    $workerLock.Dispose()
}
