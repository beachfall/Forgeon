# Forgeon Game Planner - Windows Build Script
# This script creates a portable Windows build

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Forgeon Game Planner - Windows Build Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous build
Write-Host "[1/4] Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
    Write-Host "      ✓ Cleaned" -ForegroundColor Green
} else {
    Write-Host "      ✓ No previous build found" -ForegroundColor Green
}

# Step 2: Install dependencies (if needed)
Write-Host ""
Write-Host "[2/4] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "      Installing npm packages..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "      ✓ Dependencies already installed" -ForegroundColor Green
}

# Step 3: Build with electron-packager
Write-Host ""
Write-Host "[3/4] Building Windows application..." -ForegroundColor Yellow
npm run pack:win

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "      ✗ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Create ZIP archive
Write-Host ""
Write-Host "[4/4] Creating portable ZIP..." -ForegroundColor Yellow
$version = "1.0.0"
$zipName = "Forgeon-Game-Planner-v$version-win64-portable.zip"
$buildFolder = "Forgeon Game Planner-win32-x64"

Set-Location "build"
if (Test-Path $buildFolder) {
    Compress-Archive -Path $buildFolder -DestinationPath $zipName -Force
    
    $zipFile = Get-Item $zipName
    $sizeMB = [math]::Round($zipFile.Length / 1MB, 2)
    
    Write-Host "      ✓ Created: $zipName" -ForegroundColor Green
    Write-Host "      ✓ Size: $sizeMB MB" -ForegroundColor Green
} else {
    Write-Host "      ✗ Build folder not found!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

# Success!
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  BUILD COMPLETE! " -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output location:" -ForegroundColor Cyan
Write-Host "  • Unpacked: build\$buildFolder\" -ForegroundColor White
Write-Host "  • Portable: build\$zipName" -ForegroundColor White
Write-Host ""
Write-Host "To test the build:" -ForegroundColor Cyan
Write-Host "  cd 'build\$buildFolder'" -ForegroundColor White
Write-Host "  .\Forgeon` Game` Planner.exe" -ForegroundColor White
Write-Host ""
