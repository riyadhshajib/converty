$workspaceDirectory = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$privateDirectory = Join-Path $workspaceDirectory 'work/private'
if (Test-Path -LiteralPath $privateDirectory) {
    [IO.File]::WriteAllText((Join-Path $privateDirectory 'worker.stop'), 'Owner requested stop')
    Write-Host 'Stop requested. Converty will cancel its current YouTube job and disconnect within about 20 seconds.'
} else { Write-Host 'No configured owner worker was found on this PC.' }
