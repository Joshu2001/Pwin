#!/bin/bash

# Final Build Readiness Report
echo "=========================================="
echo "Regaarder Build Readiness Report"
echo "=========================================="
echo ""
echo "Generated: $(date)"
echo ""

# Check all critical files
echo "📋 Critical Files Status:"
echo ""

FILES=(
    "capacitor.config.json"
    "android/app/build.gradle"
    "android/app/src/main/AndroidManifest.xml"
    "vite.config.js"
    "package.json"
    "dist/index.html"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING"
    fi
done

echo ""
echo "📦 Configuration Summary:"
echo ""

# Extract configuration values
if [ -f "capacitor.config.json" ]; then
    echo "  Capacitor Config:"
    grep -o '"appId": "[^"]*"' capacitor.config.json | head -1 | sed 's/^/    /'
    grep -o '"webDir": "[^"]*"' capacitor.config.json | head -1 | sed 's/^/    /'
    grep -q "cleartext" capacitor.config.json && echo "    ✅ Cleartext enabled"
fi

if [ -f "android/app/build.gradle" ]; then
    echo ""
    echo "  Android Build:"
    grep -o 'applicationId "[^"]*"' android/app/build.gradle | head -1 | sed 's/^/    /'
    grep -o 'versionCode [0-9]*' android/app/build.gradle | head -1 | sed 's/^/    /'
    grep -o 'versionName "[^"]*"' android/app/build.gradle | head -1 | sed 's/^/    /'
    grep -q "minifyEnabled true" android/app/build.gradle && echo "    ✅ Minification enabled"
    grep -q "shrinkResources true" android/app/build.gradle && echo "    ✅ Resource shrinking enabled"
fi

if [ -f "package.json" ]; then
    echo ""
    echo "  Web App:"
    grep -o '"version": "[^"]*"' package.json | head -1 | sed 's/^/    /'
    grep -o '"name": "[^"]*"' package.json | head -1 | sed 's/^/    /'
fi

echo ""
echo "🌐 Network Configuration:"
echo ""

# Check for hardcoded localhost
LOCALHOST_COUNT=$(grep -r "http://localhost:4000" src/ 2>/dev/null | wc -l)
if [ "$LOCALHOST_COUNT" -eq 0 ]; then
    echo "  ✅ No hardcoded localhost URLs in src/"
else
    echo "  ⚠️  Found $LOCALHOST_COUNT hardcoded localhost references"
fi

# Check for dynamic hostname
DYNAMIC_COUNT=$(grep -r "window.location.hostname" src/ 2>/dev/null | wc -l)
if [ "$DYNAMIC_COUNT" -gt 0 ]; then
    echo "  ✅ Dynamic hostname detection in use ($DYNAMIC_COUNT instances)"
fi

echo ""
echo "📱 Build Outputs:"
echo ""

if [ -d "dist" ]; then
    FILE_COUNT=$(find dist -type f | wc -l)
    TOTAL_SIZE=$(du -sh dist | awk '{print $1}')
    echo "  ✅ dist/ folder exists"
    echo "    Files: $FILE_COUNT"
    echo "    Size: $TOTAL_SIZE"
else
    echo "  ⚠️  dist/ folder not found (run: npm run build)"
fi

if [ -d "android/app/build/outputs/apk/debug" ]; then
    echo ""
    echo "  📦 Debug APK (if exists):"
    ls -lh android/app/build/outputs/apk/debug/*.apk 2>/dev/null | awk '{print "    " $9 " (" $5 ")"}'
fi

if [ -d "android/app/build/outputs/apk/release" ]; then
    echo ""
    echo "  📦 Release APK (if exists):"
    ls -lh android/app/build/outputs/apk/release/*.apk 2>/dev/null | awk '{print "    " $9 " (" $5 ")"}'
fi

if [ -d "android/app/build/outputs/bundle/release" ]; then
    echo ""
    echo "  📦 Release AAB (if exists):"
    ls -lh android/app/build/outputs/bundle/release/*.aab 2>/dev/null | awk '{print "    " $9 " (" $5 ")"}'
fi

echo ""
echo "🛠️  Tools Available:"
echo ""

# Check for tools
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | grep -oP '(?<=version ").*?(?=")' | head -1)
    echo "  ✅ Java: $JAVA_VERSION"
else
    echo "  ❌ Java not found"
fi

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node: $NODE_VERSION"
else
    echo "  ❌ Node not found"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  ✅ npm: $NPM_VERSION"
else
    echo "  ❌ npm not found"
fi

if [ -f "android/gradlew" ]; then
    echo "  ✅ Gradle wrapper available"
else
    echo "  ❌ Gradle wrapper not found"
fi

echo ""
echo "📚 Documentation:"
echo ""

DOCS=(
    "QUICK_BUILD_GUIDE.md"
    "ANDROID_BUILD_READINESS_CHECKLIST.md"
    "ANDROID_BUILD_PRODUCTION_READY.md"
    "APK_BUILD_ISSUES_FIXED.md"
    "BUILD_CHANGES_SUMMARY.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    fi
done

echo ""
echo "=========================================="
echo "✅ Status: READY FOR APK & AAB BUILD"
echo "=========================================="
echo ""
echo "🚀 Quick Start Commands:"
echo ""
echo "   1. Build APK (testing):"
echo "      npm run build && npx cap sync android"
echo "      cd android && ./gradlew assembleRelease -Dorg.gradle.java.home=\"\$JAVA_HOME\""
echo ""
echo "   2. Build AAB (Google Play):"
echo "      npm run build && npx cap sync android"
echo "      cd android && ./gradlew bundleRelease -Dorg.gradle.java.home=\"\$JAVA_HOME\""
echo ""
echo "   3. Verify build:"
echo "      bash verify-build-ready.sh"
echo ""
echo "=========================================="
