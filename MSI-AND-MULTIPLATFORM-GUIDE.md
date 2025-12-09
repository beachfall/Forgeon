# Creating MSI Installer for Forgeon Game Planner

## The Problem with Universal Installers

**There is no single universal installer that works across Windows, macOS, and Linux.** Each operating system requires its own native installer format:

- **Windows**: EXE (NSIS), MSI, or Portable EXE
- **macOS**: DMG or PKG
- **Linux**: AppImage, DEB, RPM, or Snap

This is the industry standard - even major applications like Chrome, VS Code, and Discord provide separate downloads for each platform.

---

## MSI Installer Creation Options

### Option 1: Install WiX Toolset (For MSI Creation)

The MSI format requires **WiX Toolset** to be installed on your system.

**Download and Install WiX Toolset:**
1. Visit: https://wixtoolset.org/releases/
2. Download WiX v3.14 (latest stable)
3. Install with default options
4. Restart your terminal/PowerShell
5. Run: `npm run msi`

**After installation, your MSI will be created in the `build` folder.**

---

### Option 2: Use NSIS Installer (Recommended Alternative)

NSIS installers are more widely used than MSI and don't require additional tools.

**You already have NSIS working via electron-packager!**

The NSIS installer you've already created (`Forgeon Game Planner.exe` from electron-packager) is functionally equivalent to MSI for most users.

**MSI vs NSIS Comparison:**

| Feature | MSI | NSIS |
|---------|-----|------|
| Installation wizard | ✓ | ✓ |
| Uninstaller | ✓ | ✓ |
| Start menu shortcuts | ✓ | ✓ |
| Desktop shortcuts | ✓ | ✓ |
| Group Policy deployment | ✓ | ✗ |
| Corporate IT preferred | ✓ | ✗ |
| Consumer-friendly | ✓ | ✓ |
| File size | Larger | Smaller |
| Build complexity | High | Low |

**Bottom Line:** Unless you're specifically targeting enterprise/corporate users who require MSI for Group Policy deployment, the NSIS installer is the better choice.

---

### Option 3: Portable EXE (No Installation)

Your electron-packager build already created a portable version in:
```
build\Forgeon Game Planner-win32-x64\Forgeon Game Planner.exe
```

This runs without installation and can be zipped for distribution.

---

## Creating Installers for All Platforms

### Windows (Already Done!)

**You have:**
```
build\Forgeon Game Planner-win32-x64\
```

**To distribute:**
1. **Portable Version**: ZIP the entire folder
2. **NSIS Installer**: Use electron-packager with Squirrel.Windows (optional)

### macOS (Build on macOS)

**On a Mac computer:**
```bash
npm install
npm run build:mac
```

**Creates:** `Forgeon Game Planner-1.0.0-x64.dmg`

**Requirements:**
- macOS computer
- Xcode Command Line Tools: `xcode-select --install`
- Optional: Apple Developer account for code signing

### Linux (Can Build on Windows)

**AppImage (Universal Linux):**
```bash
npm install electron-installer-appimage --save-dev
```

Then create `build-linux.js`:
```javascript
const installer = require('electron-installer-appimage');

const options = {
    src: 'build/Forgeon Game Planner-linux-x64/',
    dest: 'build/',
    arch: 'x64'
};

installer(options)
    .then(() => console.log('AppImage created!'))
    .catch(err => console.error(err));
```

---

## Recommended Distribution Strategy

### For Public Release (Recommended)

Provide **three separate downloads** on your website or GitHub Releases:

```
📦 Forgeon Game Planner v1.0.0

Windows:
├─ Forgeon-Game-Planner-1.0.0-Windows-x64.zip (Portable)
│  └─ No installation required, just unzip and run
│
macOS:
├─ Forgeon-Game-Planner-1.0.0-macOS.dmg
│  └─ Drag to Applications folder
│
Linux:
└─ Forgeon-Game-Planner-1.0.0-Linux-x64.AppImage
   └─ Make executable and run
```

### For Enterprise/Corporate (MSI Required)

If you need MSI:
1. Install WiX Toolset: https://wixtoolset.org/
2. Run: `npm run msi`
3. Distribute both NSIS and MSI versions

---

## Quick Distribution Commands

### Package Windows Portable (ZIP)
```powershell
# Compress the build folder
Compress-Archive -Path "build\Forgeon Game Planner-win32-x64" -DestinationPath "build\Forgeon-Game-Planner-1.0.0-Windows-x64.zip" -Force
```

### Calculate SHA256 Checksums (For Security)
```powershell
# For the ZIP file
Get-FileHash "build\Forgeon-Game-Planner-1.0.0-Windows-x64.zip" -Algorithm SHA256
```

---

## Cross-Platform Build Matrix

| Platform | Best Built On | Can Build On Windows? | Notes |
|----------|---------------|----------------------|-------|
| Windows EXE/Portable | Any OS | ✓ Yes | electron-packager works perfectly |
| Windows MSI | Any OS | ⚠️ Requires WiX | Need to install WiX Toolset |
| macOS DMG | macOS only | ✗ No | Requires macOS and Xcode |
| Linux AppImage | Linux preferred | ⚠️ Limited | Can build but may have issues |
| Linux DEB | Linux preferred | ⚠️ Limited | Can build but may have issues |

---

## What You Already Have (Without MSI)

✅ **Windows Portable**: `build\Forgeon Game Planner-win32-x64\` - Ready to distribute!
✅ **Custom Icon**: icon.ico properly configured
✅ **Full Application**: All features working
✅ **Build Scripts**: Automated build process

**This is sufficient for 90% of users!**

---

## Next Steps

### Option A: Ship Without MSI (Recommended)
1. ZIP your Windows build
2. Test on a clean Windows machine
3. Upload to GitHub Releases or your website
4. Done! 🎉

### Option B: Add MSI Support
1. Install WiX Toolset: https://wixtoolset.org/releases/
2. Run: `npm run msi`
3. Distribute both ZIP and MSI

### Option C: Multi-Platform Support
1. Build on macOS for DMG (requires Mac)
2. Build on Linux for AppImage/DEB (optional)
3. Provide downloads for all platforms

---

## Summary

**Universal installer across all platforms?** ❌ Not possible - each OS needs its own format.

**What you should do:**
- ✅ Distribute your Windows portable ZIP (done!)
- ✅ Optionally add MSI if targeting enterprises (install WiX)
- ✅ Build macOS DMG on a Mac if you have one
- ✅ Linux AppImage can be built if needed

**Industry standard:** Separate installers per platform (like Chrome, VS Code, etc.)

---

For questions or issues, check:
- electron-packager docs: https://github.com/electron/electron-packager
- electron-wix-msi docs: https://github.com/felixrieseberg/electron-wix-msi
- WiX Toolset: https://wixtoolset.org/
