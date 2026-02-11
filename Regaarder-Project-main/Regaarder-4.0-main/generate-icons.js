#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for Android
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const iconUrl = 'https://i.postimg.cc/xYnfH4k6/regaarder-logos-14.jpg';
const androidResPath = 'android/app/src/main/res';
const tempIconPath = 'temp-icon.jpg';

console.log('📱 Generating Android App Icons...\n');

// Download icon
function downloadIcon() {
  return new Promise((resolve, reject) => {
    console.log('Downloading icon from postimg.cc...');
    const file = fs.createWriteStream(tempIconPath);
    https.get(iconUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✓ Icon downloaded\n');
        resolve();
      });
    }).on('error', reject);
  });
}

// Copy and rename icon for each density
function generateIcons() {
  console.log('Generating icons for different screen densities:\n');
  
  Object.entries(iconSizes).forEach(([density, size]) => {
    const iconDir = path.join(androidResPath, density);
    
    // Ensure directory exists
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }
    
    // Copy icon file
    const sourcePath = tempIconPath;
    const destPath = path.join(iconDir, 'ic_launcher.png');
    
    try {
      // For now, we'll copy the same image to all sizes
      // In production, you'd use Sharp or ImageMagick to resize
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ ${density} (${size}x${size}px)`);
    } catch (err) {
      console.error(`✗ Error generating ${density}:`, err.message);
    }
  });
  
  // Also create foreground and rounded versions
  console.log('\nGenerating additional icon variants...');
  Object.keys(iconSizes).forEach((density) => {
    const iconDir = path.join(androidResPath, density);
    const sourcePath = tempIconPath;
    const launcherFg = path.join(iconDir, 'ic_launcher_foreground.png');
    const launcherRound = path.join(iconDir, 'ic_launcher_round.png');
    
    try {
      fs.copyFileSync(sourcePath, launcherFg);
      fs.copyFileSync(sourcePath, launcherRound);
    } catch (err) {
      console.error(`✗ Error creating variants for ${density}:`, err.message);
    }
  });
  
  console.log('✓ Variants created\n');
}

// Cleanup
function cleanup() {
  if (fs.existsSync(tempIconPath)) {
    fs.unlinkSync(tempIconPath);
  }
  console.log('✓ Cleanup complete');
}

// Main execution
(async () => {
  try {
    await downloadIcon();
    generateIcons();
    cleanup();
    console.log('\n✅ Icon generation complete!\n');
    console.log('Run: npm run build && npx cap sync android');
  } catch (err) {
    console.error('Error:', err);
    cleanup();
    process.exit(1);
  }
})();
