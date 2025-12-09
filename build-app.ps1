# Forgeon Game Planner - Windows Build Script
# Run this script to build the Windows application

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Forgeon Game Planner - Build Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if node is available
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "ERROR: Node.js not found in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js or run this from a terminal where Node.js is available." -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCheck) {
    Write-Host "ERROR: npm not found in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js or run this from a terminal where npm is available." -ForegroundColor Yellow
    exit 1
}

Write-Host "Node.js version: " -NoNewline
node --version
Write-Host "npm version: " -NoNewline
npm --version
Write-Host ""

# Navigate to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Project directory: $scriptPath" -ForegroundColor Green
Write-Host ""

# Check if electron-packager is installed
Write-Host "Checking dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if (-not $packageJson.devDependencies.'electron-packager') {
    Write-Host "Installing electron-packager..." -ForegroundColor Yellow
    npm install --save-dev electron-packager
}

# Clean old build
Write-Host "`nCleaning old build..." -ForegroundColor Yellow
if (Test-Path "build\Forgeon Game Planner-win32-x64") {
    Remove-Item -Recurse -Force "build\Forgeon Game Planner-win32-x64" -ErrorAction SilentlyContinue
    Write-Host "Old build removed" -ForegroundColor Green
}

# Build the application
Write-Host "`nBuilding application..." -ForegroundColor Yellow
Write-Host "This may take 30-60 seconds...`n" -ForegroundColor Cyan

npm run pack:win

# Check if build was successful
if (Test-Path "build\Forgeon Game Planner-win32-x64\Forgeon Game Planner.exe") {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Build location:" -ForegroundColor Cyan
    Write-Host "  $scriptPath\build\Forgeon Game Planner-win32-x64\" -ForegroundColor White
    Write-Host ""
    Write-Host "Executable:" -ForegroundColor Cyan
    Write-Host "  Forgeon Game Planner.exe" -ForegroundColor White
    Write-Host ""
    
    # Get file size
    $exePath = "build\Forgeon Game Planner-win32-x64\Forgeon Game Planner.exe"
    $fileSize = (Get-Item $exePath).Length / 1MB
    Write-Host "Executable size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to create ZIP
    $createZip = Read-Host "Create portable ZIP for distribution? (Y/N)"
    if ($createZip -eq "Y" -or $createZip -eq "y") {
        Write-Host "`nCreating portable ZIP..." -ForegroundColor Yellow
        $zipPath = "build\Forgeon-Game-Planner-v1.0.0-win64-portable.zip"
        
        if (Test-Path $zipPath) {
            Remove-Item $zipPath -Force
        }
        
        Compress-Archive -Path "build\Forgeon Game Planner-win32-x64" -DestinationPath $zipPath -Force
        
        $zipSize = (Get-Item $zipPath).Length / 1MB
        Write-Host "ZIP created: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
        Write-Host "Location: $zipPath" -ForegroundColor White
    }
    
    Write-Host "`nBuild complete! You can now test the application." -ForegroundColor Green
    Write-Host ""
    
} else {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "The build did not complete successfully." -ForegroundColor Yellow
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    exit 1
}
