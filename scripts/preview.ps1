<#
preview.ps1
Lightweight preview for dist/ folder. Requires python or npx serve.
Usage: .\scripts\preview.ps1 [port]
#>
param(
  [int]$port = 8000
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$distPath = Join-Path $root '..\dist' -Resolve
if (-not (Test-Path $distPath)) { Write-Error "dist/ not found. Run scripts\prepare-dist.ps1 first."; exit 1 }

Write-Host "Serving dist/ on http://127.0.0.1:$port"
try {
  & python -m http.server $port --directory $distPath
} catch {
  Write-Host "python not available. Trying 'npx serve'..."
  try { & npx serve $distPath -p $port } catch { Write-Error "No preview server available (python or npx missing)." }
}
