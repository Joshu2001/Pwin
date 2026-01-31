#!/bin/bash

# Production Build Script for Regaarder APK & AAB
# This script prepares the app for both APK and AAB (Google Play) releases

set -e

echo "🚀 Starting production build process..."

# Step 1: Clean and build the web app
echo "📦 Step 1: Building React app..."
npm run build
if [ ! -d "dist" ]; then
  echo "❌ Build failed: dist folder not found"
  exit 1
fi
echo "✅ React build complete"

# Step 2: Sync Capacitor
echo "📱 Step 2: Syncing Capacitor..."
npx cap sync android
echo "✅ Capacitor sync complete"

# Step 3: Check Android project
echo "🔍 Step 3: Checking Android project..."
if [ ! -f "android/build.gradle" ]; then
  echo "❌ Android project not found"
  exit 1
fi
echo "✅ Android project verified"

# Step 4: Build APK (optional, for testing)
echo "📦 Step 4: Building APK for testing..."
cd android
./gradlew assembleRelease -Dorg.gradle.java.home="$JAVA_HOME"
cd ..

if [ -f "android/app/build/outputs/apk/release/app-release-unsigned.apk" ]; then
  echo "✅ APK build complete"
  echo "   Location: android/app/build/outputs/apk/release/app-release-unsigned.apk"
else
  echo "⚠️  APK build may have issues, continuing..."
fi

# Step 5: Build AAB for Google Play
echo "📦 Step 5: Building AAB for Google Play Store..."
cd android
./gradlew bundleRelease -Dorg.gradle.java.home="$JAVA_HOME"
cd ..

if [ -f "android/app/build/outputs/bundle/release/app-release.aab" ]; then
  echo "✅ AAB build complete!"
  echo "   Location: android/app/build/outputs/bundle/release/app-release.aab"
  echo ""
  echo "📋 Next Steps:"
  echo "   1. Sign the AAB with your release key"
  echo "   2. Upload to Google Play Console"
  echo "   3. For APK: Sign with jarsigner or apksigner"
else
  echo "❌ AAB build failed"
  exit 1
fi

echo ""
echo "✅ Production build process complete!"
