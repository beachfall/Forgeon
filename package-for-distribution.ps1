# Quick Distribution Package Creation

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Package for Distribution" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$buildFolder = "build\Forgeon Game Planner-win32-x64"
$zipName = "Forgeon-Game-Planner-1.0.0-Windows-x64.zip"
$zipPath = "build\$zipName"

# Check if build exists
if (-Not (Test-Path $buildFolder)) {
    Write-Host "✗ Build folder not found: $buildFolder" -ForegroundColor Red
    Write-Host "  Please run 'npm run pack:win' first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found build folder" -ForegroundColor Green
Write-Host "Creating distribution package..." -ForegroundColor Yellow
Write-Host ""

# Create ZIP
try {
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    Compress-Archive -Path $buildFolder -DestinationPath $zipPath -CompressionLevel Optimal -Force
    
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "✓ Created: $zipName" -ForegroundColor Green
    Write-Host "  Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray
    Write-Host ""
    
    # Calculate SHA256
    Write-Host "Calculating SHA256 checksum..." -ForegroundColor Yellow
    $hash = Get-FileHash $zipPath -Algorithm SHA256
    Write-Host "✓ SHA256: $($hash.Hash)" -ForegroundColor Green
    Write-Host ""
    
    # Save checksum to file
    $checksumFile = "build\SHA256SUMS.txt"
    "$($hash.Hash)  $zipName" | Out-File -FilePath $checksumFile -Encoding utf8
    Write-Host "✓ Checksum saved to: SHA256SUMS.txt" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  Package Ready for Distribution!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Distribution files in build folder:" -ForegroundColor Cyan
    Write-Host "  - $zipName" -ForegroundColor White
    Write-Host "  - SHA256SUMS.txt" -ForegroundColor White
    Write-Host ""
    Write-Host "Upload these files to:" -ForegroundColor Yellow
    Write-Host "  - GitHub Releases" -ForegroundColor White
    Write-Host "  - Your website" -ForegroundColor White
    Write-Host "  - itch.io" -ForegroundColor White
    Write-Host "  - Or any other distribution platform" -ForegroundColor White
    Write-Host ""
    
    $openFolder = Read-Host "Open build folder? (y/n)"
    if ($openFolder -eq "y") {
        Invoke-Item "build"
    }
    
} catch {
    Write-Host "Error creating package: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
