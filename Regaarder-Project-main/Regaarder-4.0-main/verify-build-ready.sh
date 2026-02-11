#!/bin/bash

# Verification script to ensure the app is ready for APK/AAB builds

echo "🔍 Regaarder Build Readiness Verification"
echo "=========================================="
echo ""

ISSUES=0
WARNINGS=0

# Check 1: dist folder exists
echo "1️⃣  Checking build output directory..."
if [ -d "dist" ]; then
    echo "   ✅ dist/ folder exists"
    FILE_COUNT=$(find dist -type f | wc -l)
    echo "   📊 Contains $FILE_COUNT files"
else
    echo "   ⚠️  dist/ folder not found - Need to run: npm run build"
    ((WARNINGS++))
fi
echo ""

# Check 2: Capacitor config
echo "2️⃣  Checking capacitor.config.json..."
if grep -q "cleartext.*true" capacitor.config.json; then
    echo "   ✅ cleartext mode enabled for HTTP"
else
    echo "   ⚠️  cleartext not configured (may need update)"
    ((WARNINGS++))
fi

if grep -q "\"webDir\".*\"dist\"" capacitor.config.json; then
    echo "   ✅ Web directory set to dist/"
else
    echo "   ❌ Web directory not configured correctly"
    ((ISSUES++))
fi
echo ""

# Check 3: Android configuration
echo "3️⃣  Checking android/app/build.gradle..."
if [ -f "android/app/build.gradle" ]; then
    echo "   ✅ build.gradle exists"
    
    if grep -q "minifyEnabled true" android/app/build.gradle; then
        echo "   ✅ Code minification enabled"
    else
        echo "   ⚠️  Code minification may be disabled"
        ((WARNINGS++))
    fi
    
    if grep -q "compileSdk\|targetSdk" android/app/build.gradle; then
        echo "   ✅ SDK versions configured"
    fi
else
    echo "   ❌ build.gradle not found"
    ((ISSUES++))
fi
echo ""

# Check 4: AndroidManifest
echo "4️⃣  Checking AndroidManifest.xml..."
if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
    echo "   ✅ AndroidManifest.xml exists"
    
    if grep -q "android.permission.INTERNET" android/app/src/main/AndroidManifest.xml; then
        echo "   ✅ INTERNET permission declared"
    else
        echo "   ⚠️  INTERNET permission may be missing"
        ((WARNINGS++))
    fi
else
    echo "   ❌ AndroidManifest.xml not found"
    ((ISSUES++))
fi
echo ""

# Check 5: Vite configuration
echo "5️⃣  Checking vite.config.js..."
if [ -f "vite.config.js" ]; then
    echo "   ✅ vite.config.js exists"
    
    if grep -q "sourcemap.*false\|build.*sourcemap" vite.config.js; then
        echo "   ✅ Source maps disabled for production"
    else
        echo "   ⚠️  Source maps configuration unclear"
        ((WARNINGS++))
    fi
else
    echo "   ❌ vite.config.js not found"
    ((ISSUES++))
fi
echo ""

# Check 6: API Endpoints
echo "6️⃣  Checking for hardcoded localhost URLs..."
HARDCODED=$(grep -r "localhost:4000" src/ 2>/dev/null | wc -l)
if [ "$HARDCODED" -eq 0 ]; then
    echo "   ✅ No hardcoded localhost URLs in src/"
else
    echo "   ⚠️  Found $HARDCODED hardcoded localhost references"
    ((WARNINGS++))
fi
echo ""

# Check 7: Package configuration
echo "7️⃣  Checking package.json..."
if grep -q "\"name\": \"regaarder\"" package.json; then
    echo "   ✅ Package name configured"
fi

if grep -q "\"build\": \"vite build\"" package.json; then
    echo "   ✅ Build script configured"
else
    echo "   ⚠️  Build script may be misconfigured"
    ((WARNINGS++))
fi
echo ""

# Check 8: Java availability
echo "8️⃣  Checking Java installation..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | grep -oP '(?<=version ").*?(?=")')
    echo "   ✅ Java installed: $JAVA_VERSION"
else
    echo "   ❌ Java not found in PATH"
    ((ISSUES++))
fi
echo ""

# Check 9: Gradle wrapper
echo "9️⃣  Checking Gradle wrapper..."
if [ -f "android/gradlew" ]; then
    echo "   ✅ gradlew (Gradle wrapper) exists"
    if [ -f "android/gradle/wrapper/gradle-wrapper.jar" ]; then
        echo "   ✅ Gradle wrapper JAR exists"
    else
        echo "   ⚠️  Gradle wrapper JAR not found"
        ((WARNINGS++))
    fi
else
    echo "   ❌ Gradle wrapper not found"
    ((ISSUES++))
fi
echo ""

# Summary
echo "=========================================="
echo "📋 Summary:"
echo "   Issues: $ISSUES"
echo "   Warnings: $WARNINGS"
echo ""

if [ $ISSUES -eq 0 ]; then
    echo "✅ App is ready for APK/AAB builds!"
    echo ""
    echo "Next steps:"
    echo "1. npm run build          # Build the web app"
    echo "2. npx cap sync android   # Sync with Android"
    echo "3. cd android && ./gradlew bundleRelease  # Build AAB"
    echo ""
    exit 0
else
    echo "❌ Please fix the issues above before building"
    exit 1
fi
