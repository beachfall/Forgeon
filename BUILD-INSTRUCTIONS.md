# How to Build Forgeon Game Planner

## Quick Build Instructions

### Step 1: Open a PowerShell/CMD terminal where npm works

You need to use a terminal where Node.js/npm is available. This is usually:
- The terminal where you ran `npm start` previously
- Windows PowerShell (if Node.js is in your PATH)
- Command Prompt
- VS Code integrated terminal

### Step 2: Run the build script

```powershell
cd "d:\Custom Builds\GameDev Planner"
.\build-app.ps1
```

**OR** manually:

```powershell
cd "d:\Custom Builds\GameDev Planner"
npm run pack:win
```

### Step 3: Find your build

After successful build:
- **Location**: `d:\Custom Builds\GameDev Planner\build\Forgeon Game Planner-win32-x64\`
- **Executable**: `Forgeon Game Planner.exe`

---

## If Build Fails

### Error: "npm is not recognized"

**Solution**: You're in a terminal without Node.js in the PATH.

Try one of these:
1. Open a new PowerShell window (not PowerShell Extension in VS Code)
2. Use Command Prompt (Win + R, type `cmd`)
3. In VS Code, open a new terminal (Ctrl + Shift + `)

### Error: "electron-packager not found"

**Solution**: Install dependencies first:

```powershell
cd "d:\Custom Builds\GameDev Planner"
npm install
```

Then try building again.

---

## About Application Icons

Windows application icons need to be in `.ico` format. electron-packager will:
- Use the default Electron icon if no `.ico` is found
- Look for `icon.ico` in the project root or icons folder

### To Create Custom Icon

You have PNG icons in `icons/application/`. To convert to ICO:

**Option 1: Use Online Converter**
1. Go to https://www.icoconverter.com/ or https://convertico.com/
2. Upload `icons/application/256x256.png`
3. Download the `.ico` file
4. Save it as `icons/application/icon.ico`
5. Rebuild the app

**Option 2: Use ImageMagick (if installed)**
```powershell
magick convert icons/application/256x256.png -define icon:auto-resize=256,128,64,48,32,16 icons/application/icon.ico
```

**Option 3: Use main.js configuration**
The icon is set in `main.js` line 24:
```javascript
icon: path.join(__dirname, 'icons', 'application', '512x512.png')
```

This controls the icon while the app is running. For the .exe file icon, you need `.ico` format.

---

## Build Output

After building, you'll have:

```
build/
  Forgeon Game Planner-win32-x64/
    Forgeon Game Planner.exe    ← Your application
    resources/
    locales/
    chrome_*.pak
    *.dll files
    ... (all Electron runtime files)
```

To distribute:
1. ZIP the entire `Forgeon Game Planner-win32-x64` folder
2. Share the ZIP file
3. Users extract and run `Forgeon Game Planner.exe`

---

## Quick Test

After building:

```powershell
# Test the built application
cd "build\Forgeon Game Planner-win32-x64"
.\Forgeon` Game` Planner.exe
```

Or just double-click the .exe file in Windows Explorer.

---

## Common Issues

**Build is slow**: First build downloads Electron binaries (~200MB). Subsequent builds are faster.

**Icons not showing**: The app needs `.ico` format for Windows. Follow the icon creation steps above.

**"Cannot find module"**: Run `npm install` first to install all dependencies.

---

## Need Help?

1. Make sure Node.js is installed: `node --version`
2. Make sure npm works: `npm --version`
3. Make sure you're in the project directory
4. Try running `npm install` to reinstall dependencies
5. Check the terminal output for specific error messages
