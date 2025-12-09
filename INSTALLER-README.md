# Forgeon Game Planner - Installer Build Guide

## Quick Start

### Windows MSI Installer Only
```powershell
npm run build:win-msi
```

### All Windows Installers (NSIS + MSI + Portable)
```powershell
npm run build:win-all
```

### Interactive Build Script
```powershell
.\build-installers.ps1
```

## Available Build Scripts

| Script | Creates | Command |
|--------|---------|---------|
| `build:win-msi` | Windows MSI installer only | `npm run build:win-msi` |
| `build:win-all` | All Windows formats (NSIS, MSI, Portable) | `npm run build:win-all` |
| `build:win` | Windows NSIS installer only | `npm run build:win` |
| `build:mac` | macOS DMG installer | `npm run build:mac` |
| `build:linux` | Linux AppImage + DEB package | `npm run build:linux` |
| `build:all` | All platforms (Windows, macOS, Linux) | `npm run build:all` |

## Output Files

All installers are created in the `build` folder:

### Windows
- **NSIS Installer**: `Forgeon Game Planner-1.0.0-x64.exe` - Standard installer with install wizard
- **MSI Installer**: `Forgeon Game Planner-1.0.0-x64.msi` - Enterprise-friendly, supports Group Policy
- **Portable**: `Forgeon Game Planner-1.0.0-x64.exe` - No installation required, runs from any folder

### macOS
- **DMG**: `Forgeon Game Planner-1.0.0-x64.dmg` - Drag-and-drop installer

### Linux
- **AppImage**: `Forgeon Game Planner-1.0.0-x64.AppImage` - Universal Linux format
- **DEB**: `forgeon-game-planner_1.0.0_amd64.deb` - For Debian/Ubuntu-based distros

## About Universal Installers

**Short Answer**: There is no single universal installer that works on Windows, macOS, and Linux.

**Why?** Each operating system has fundamentally different:
- Executable formats (EXE vs Mach-O vs ELF)
- Installation mechanisms
- Security requirements
- File system structures

**Best Practice**: Create native installers for each platform:
- Users download the installer for their specific OS
- Each installer provides the best experience for that platform
- This is the standard approach used by major software (Chrome, VS Code, Discord, etc.)

## Cross-Platform Building Limitations

### Building on Windows
✅ **Can Build**:
- Windows installers (NSIS, MSI, Portable)

⚠️ **Limited Support**:
- macOS DMG (requires additional tools, may have issues)
- Linux packages (works but not code-signed)

### Building on macOS
✅ **Can Build**:
- macOS DMG (native, code-signable)
- Windows installers (via Wine/Docker)
- Linux packages

### Building on Linux
✅ **Can Build**:
- Linux packages (native)
- Windows installers (via Wine/Docker)
- macOS DMG (limited, requires additional tools)

**Recommendation**: For production releases, build each installer on its native platform for best results.

## MSI vs NSIS vs Portable

### MSI Installer (.msi)
**Best For**: Enterprise environments, corporate deployment
- Supports Windows Installer technology
- Can be deployed via Group Policy
- Allows repair and modify operations
- Integrated with Windows Update mechanisms
- Preferred by IT departments

### NSIS Installer (.exe)
**Best For**: General consumer distribution
- Modern, customizable installer UI
- Smaller file size
- More flexible installation options
- Standard for most consumer applications

### Portable (.exe)
**Best For**: Users who don't want to install
- No installation required
- Runs from any folder (USB drive, cloud storage)
- No registry changes
- No administrator privileges needed

## Build Time Expectations

- **Single Windows installer**: 2-5 minutes
- **All Windows installers**: 5-10 minutes
- **All platforms**: 10-20 minutes (depending on your system)

## Troubleshooting

### "Cannot find icon.ico"
Ensure `icons/application/icon.ico` exists. The script expects a 256x256 ICO file.

### Cross-platform build fails
This is normal on Windows. Build macOS/Linux installers on their respective platforms for production releases.

### MSI build fails
Check that:
1. You have the latest electron-builder: `npm install electron-builder@latest`
2. No other installation is running
3. You have write permissions to the build folder

### Build is too slow
- Close unnecessary programs
- Disable antivirus scanning for the project folder temporarily
- Use SSD instead of HDD if available

## Distribution Recommendations

### For Public Release
Provide all formats and let users choose:
```
Downloads:
├── Windows (choose one)
│   ├── NSIS Installer (recommended)
│   ├── MSI Installer (for enterprise)
│   └── Portable (no install)
├── macOS
│   └── DMG Installer
└── Linux
    ├── AppImage (universal)
    └── DEB Package (Ubuntu/Debian)
```

### For Enterprise
Provide MSI installer with:
- Group Policy deployment instructions
- Silent install command: `msiexec /i "Forgeon Game Planner-1.0.0-x64.msi" /quiet`
- IT administrator documentation

## File Sizes (Approximate)

- Windows NSIS: ~200 MB
- Windows MSI: ~200 MB
- Windows Portable: ~200 MB
- macOS DMG: ~220 MB
- Linux AppImage: ~230 MB
- Linux DEB: ~200 MB

All formats include the full Electron runtime and application.

## Code Signing (Optional)

For production releases, consider code signing:
- **Windows**: Requires code signing certificate (EV or OV)
- **macOS**: Requires Apple Developer account ($99/year)
- **Linux**: Not typically required

Code signing prevents security warnings when users download and run your app.

## Next Steps

1. Build your desired installer(s)
2. Test on a clean system
3. Prepare release notes
4. Upload to your distribution platform (GitHub Releases, website, etc.)
5. Provide checksums (SHA256) for verification

---

**Need Help?** Check the electron-builder documentation: https://www.electron.build/
