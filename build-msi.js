// Build MSI Installer using electron-wix-msi
// This creates a Windows MSI installer without requiring admin privileges

const { MSICreator } = require('electron-wix-msi');
const path = require('path');

async function buildMSI() {
    console.log('Building MSI installer...');
    
    // Step 1: Create the MSI installer
    const msiCreator = new MSICreator({
        appDirectory: path.join(__dirname, 'build', 'Forgeon Game Planner-win32-x64'),
        outputDirectory: path.join(__dirname, 'build'),
        
        // Configure your app's metadata
        description: 'Forgeon Game Planner - Game Development Planning Tool',
        exe: 'Forgeon Game Planner.exe',
        name: 'Forgeon Game Planner',
        manufacturer: 'Forgeon',
        version: '1.0.0',
        
        // Icon configuration
        icon: path.join(__dirname, 'icons', 'application', 'icon.ico'),
        
        // UI configuration
        ui: {
            enabled: true,
            chooseDirectory: true,
            images: {
                background: null, // Optional: path to 493x312 background image
                banner: null,     // Optional: path to 493x58 banner image
            }
        },
        
        // Installation configuration
        arch: 'x64',
        language: 1033, // English
        
        // Program Files folder
        programFilesFolderName: 'Forgeon Game Planner',
        
        // Upgrade configuration
        upgradeCode: 'F0F1E230-9CB0-4F4E-A5D1-E3B2C7D6F8A9' // Keep this same for all versions
    });

    console.log('Creating MSI...');
    await msiCreator.create();
    
    console.log('Compiling MSI...');
    await msiCreator.compile();
    
    console.log('✓ MSI installer created successfully!');
    console.log(`  Output: build\\Forgeon Game Planner.msi`);
}

buildMSI().catch(err => {
    console.error('Error building MSI:', err);
    process.exit(1);
});
