# Windows Build Guide

## ✅ Build Complete!

Your Windows build of **Forgeon Game Planner v1.0.0** is ready for distribution.

## 📦 Build Output

Located in `build/` directory:

### 1. Portable ZIP (Recommended for distribution)
```
Forgeon-Game-Planner-v1.0.0-win64-portable.zip (~505 MB)
```
- **Users simply extract and run**
- No installation required
- All files contained in one folder
- Easy to distribute via download

### 2. Unpacked Build (For testing)
```
Forgeon Game Planner-win32-x64/
```
- Direct executable
- Use for testing before zipping
- Run `Forgeon Game Planner.exe`

## 🚀 Future Builds

To rebuild the application:

### Method 1: Using the build script
```powershell
.\build-windows.ps1
```

### Method 2: Manual build
```powershell
npm run pack:win
```

### Method 3: With electron-builder (requires admin/symlink privileges)
```powershell
npm run build:win
```

## 📤 Distribution Checklist

Before releasing:

- [x] Build created successfully
- [x] Portable ZIP created
- [ ] Test the executable on a clean Windows machine
- [ ] Verify all features work (especially file operations)
- [ ] Test project creation and saving
- [ ] Test data export/import
- [ ] Verify dark/light theme switching
- [ ] Check all icons load correctly
- [ ] Test without models folder (AI assistant gracefully handles missing models)
- [ ] Include README-RELEASE.md in your distribution

## 📝 Release Notes to Include

```markdown
# Forgeon Game Planner v1.0.0

## New in this release:
- Full game development planning suite
- Task, asset, and milestone management
- Story organization (acts, scenes, characters, locations, quests)
- Class and mechanics documentation
- Note-taking with categories
- Dark/Light theme
- Multi-project support
- Data export/import
- Optional AI assistant (requires GGUF models)

## Known issues:
- Story Map visualization disabled (coming in v1.1)
- First launch initialization may take a few seconds

## System Requirements:
- Windows 10 or later (64-bit)
- 4GB RAM minimum
- ~600MB disk space
```

## 🎯 Where to Upload

Recommended platforms:
- **GitHub Releases**: Attach the ZIP file to a release tag
- **Itch.io**: Upload as Windows build
- **Own website**: Direct download link
- **Google Drive / Dropbox**: For sharing with testers

## 🔐 Optional: Code Signing

For production releases, consider code signing to avoid Windows SmartScreen warnings:

1. Obtain a code signing certificate
2. Use `signtool.exe` to sign the `.exe`
3. Or configure electron-builder with certificate details

## 📊 Build Info

- **Electron Version**: 39.1.1
- **Node Version**: (current system)
- **Platform**: win32-x64
- **Build Tool**: electron-packager
- **Build Date**: November 26, 2025

## 🐛 Troubleshooting

### Build fails with symlink errors
- Use `npm run pack:win` instead of `npm run build:win`
- electron-packager doesn't require admin privileges

### App won't start
- Check Windows Defender/Antivirus
- Run from extracted folder, not from within ZIP
- Ensure all DLL files are present in the folder

### Models folder missing
- The app creates it automatically on first launch
- AI assistant is optional - app works without models

---

**Build Status**: ✅ READY FOR RELEASE
**Build Method**: electron-packager (no admin required)
**Distribution Format**: Portable ZIP
