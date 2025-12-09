# Forgeon Game Planner - Multi-Platform Build Script
# This script creates installers for Windows, macOS, and Linux

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Forgeon Game Planner - Installer Builder" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is available
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build Options:" -ForegroundColor Cyan
Write-Host "1. Windows MSI only" -ForegroundColor White
Write-Host "2. Windows All (NSIS installer + MSI + Portable)" -ForegroundColor White
Write-Host "3. All Platforms (Windows + macOS + Linux)" -ForegroundColor White
Write-Host "4. Cancel" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select option (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Building Windows MSI installer..." -ForegroundColor Yellow
        Write-Host "This may take several minutes..." -ForegroundColor Gray
        Write-Host ""
        npm run build:win-msi
    }
    "2" {
        Write-Host ""
        Write-Host "Building all Windows installers..." -ForegroundColor Yellow
        Write-Host "This will create: NSIS installer, MSI installer, and Portable EXE" -ForegroundColor Gray
        Write-Host "This may take several minutes..." -ForegroundColor Gray
        Write-Host ""
        npm run build:win-all
    }
    "3" {
        Write-Host ""
        Write-Host "Building installers for all platforms..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "NOTE: This will build:" -ForegroundColor Cyan
        Write-Host "  - Windows: NSIS installer, MSI installer, Portable EXE" -ForegroundColor White
        Write-Host "  - macOS: DMG installer" -ForegroundColor White
        Write-Host "  - Linux: AppImage and DEB package" -ForegroundColor White
        Write-Host ""
        Write-Host "IMPORTANT: Building for macOS and Linux on Windows has limitations." -ForegroundColor Yellow
        Write-Host "For best results, build macOS installers on macOS and Linux installers on Linux." -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "Continue? (y/n)"
        if ($confirm -ne "y") {
            Write-Host "Build cancelled." -ForegroundColor Yellow
            exit 0
        }
        Write-Host ""
        Write-Host "Building for all platforms..." -ForegroundColor Yellow
        Write-Host "This may take 10+ minutes..." -ForegroundColor Gray
        Write-Host ""
        npm run build:all
    }
    "4" {
        Write-Host "Build cancelled." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Invalid choice. Build cancelled." -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Build Completed Successfully!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your installers are located in the 'build' folder:" -ForegroundColor Cyan
    Write-Host "  - Windows NSIS: Forgeon Game Planner-1.0.0-x64.exe" -ForegroundColor White
    Write-Host "  - Windows MSI: Forgeon Game Planner-1.0.0-x64.msi" -ForegroundColor White
    Write-Host "  - Windows Portable: Forgeon Game Planner-1.0.0-x64.exe (portable)" -ForegroundColor White
    Write-Host "  - macOS: Forgeon Game Planner-1.0.0-x64.dmg" -ForegroundColor White
    Write-Host "  - Linux AppImage: Forgeon Game Planner-1.0.0-x64.AppImage" -ForegroundColor White
    Write-Host "  - Linux DEB: forgeon-game-planner_1.0.0_amd64.deb" -ForegroundColor White
    Write-Host ""
    
    $openFolder = Read-Host "Open build folder? (y/n)"
    if ($openFolder -eq "y") {
        Invoke-Item "build"
    }
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  Build Failed!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Missing icon.ico file" -ForegroundColor White
    Write-Host "  - Cross-platform build limitations on Windows" -ForegroundColor White
    Write-Host "  - Missing node_modules (run: npm install)" -ForegroundColor White
}
