<#
prepare-dist.ps1
Prepares a production-ready dist/ folder for static hosting (Cloudflare Pages).
- Copies necessary assets
- Attempts to minify JS via esbuild if npx is available (optional)
- Leaves js/config.js untouched; set production values there before running

Usage: .\scripts\prepare-dist.ps1 [-Production]
#>
param(
  [switch]$Production
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $root

$distPath = Join-Path $root '..\dist'
$distPath = Resolve-Path -LiteralPath $distPath -ErrorAction SilentlyContinue
if (-not $distPath) { $distPath = Join-Path $root '..\dist' }

Write-Host "Preparing dist at: $distPath"

if (Test-Path $distPath) {
  Remove-Item -Recurse -Force $distPath
}
New-Item -ItemType Directory -Force -Path $distPath | Out-Null

# Files and folders to copy
$items = @('index.html','css','js','img','README.md')

foreach ($i in $items) {
  $src = Join-Path $root "..\$i"
  if (Test-Path $src) {
    Write-Host "Copying: $i"
    Copy-Item -Path $src -Destination $distPath -Recurse -Force
  }
}

# Optional minify step: prefer esbuild via npx
Write-Host "Attempting optional JS minification using 'npx esbuild'. This requires Node and npx. If missing, raw JS files will be copied as-is."
try {
  $npxVersion = & npx -v 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "npx found. Running esbuild to minify JS into dist/js..."
    # Run esbuild through npx; it will download if necessary
    & npx esbuild "./js/*.js" --minify --legal-comments=none --outdir="$distPath/js" 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) { Write-Warning "esbuild returned non-zero exit code; JS was not minified." }
  } else {
    Write-Host "npx not available — skipping minification.";
  }
} catch {
  Write-Host "Minification skipped: $_";
}

Write-Host "Dist prepared at: $distPath"
Write-Host "Tip: Set production settings in js/config.js before running this script (BACKEND_URL, BLOCK_EXPLORER, RPC_URLS)."
Pop-Location
