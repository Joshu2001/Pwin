#!/usr/bin/env node

import sharp from 'sharp';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Android icon sizes (in pixels)
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const iconUrl = 'https://i.postimg.cc/xYnfH4k6/regaarder-logos-14.jpg';
const androidResPath = path.join(__dirname, 'android/app/src/main/res');
const tempIconPath = path.join(__dirname, 'temp-icon-source.jpg');

console.log('📱 Generating Professional Android App Icons...\n');

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

// Create a proper rounded square icon with padding
async function createProperIcon(inputPath, outputPath, size) {
  try {
    // Create a white background with the icon centered and padded
    const padding = Math.floor(size * 0.1); // 10% padding
    const iconSize = size - (padding * 2);

    // Read the source image, resize it, and place it on a white background with rounded corners
    let image = sharp(inputPath)
      .resize(iconSize, iconSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      });

    // Create a rounded square background
    const roundedRadius = Math.floor(size * 0.2); // 20% corner radius for rounded square look
    
    const svgBackground = Buffer.from(`
      <svg width="${size}" height="${size}">
        <rect x="0" y="0" width="${size}" height="${size}" rx="${roundedRadius}" fill="white" />
      </svg>
    `);

    // Composite the icon on the background
    image = await image.toBuffer();
    
    // Create with padding and rounded corners
    const iconWithPadding = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        {
          input: image,
          top: padding,
          left: padding
        }
      ])
      .png()
      .toFile(outputPath);

    return iconWithPadding;
  } catch (err) {
    console.error(`Error creating icon of size ${size}x${size}:`, err.message);
    throw err;
  }
}

// Generate icons for all densities
async function generateIcons() {
  console.log('Generating icons for different screen densities:\n');

  for (const [density, size] of Object.entries(iconSizes)) {
    const iconDir = path.join(androidResPath, density);

    // Ensure directory exists
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }

    try {
      // Main launcher icon
      await createProperIcon(
        tempIconPath,
        path.join(iconDir, 'ic_launcher.png'),
        size
      );

      // Foreground (same as main for simplicity)
      await createProperIcon(
        tempIconPath,
        path.join(iconDir, 'ic_launcher_foreground.png'),
        size
      );

      // Rounded version
      await createProperIcon(
        tempIconPath,
        path.join(iconDir, 'ic_launcher_round.png'),
        size
      );

      console.log(`✓ ${density} (${size}x${size}px) - Created with proper scaling`);
    } catch (err) {
      console.error(`✗ Error generating ${density}:`, err.message);
    }
  }

  console.log('\n✓ All icon variants created\n');
}

// Cleanup
function cleanup() {
  if (fs.existsSync(tempIconPath)) {
    fs.unlinkSync(tempIconPath);
  }
  console.log('✓ Cleanup complete');
}

// Main execution
try {
  await downloadIcon();
  await generateIcons();
  cleanup();
  console.log('\n✅ Professional icon generation complete!\n');
  console.log('Next steps:');
  console.log('1. Run: npx cap sync android');
  console.log('2. Build APK: ./build-android.cmd\n');
} catch (err) {
  console.error('Error:', err);
  cleanup();
  process.exit(1);
}
