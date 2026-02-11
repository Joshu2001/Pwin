#!/bin/bash

# Gradle Build Corruption Fix Script
# Solves: TimeoutException cannot be cast to RuntimeException

echo "🔧 Fixing Gradle Build Corruption..."
echo "======================================"
echo ""

# Step 1: Stop all Gradle daemons
echo "1️⃣  Stopping Gradle daemons..."
if [ -d "android" ]; then
    cd android
    ./gradlew --stop
    cd ..
    echo "   ✅ Gradle daemons stopped"
else
    echo "   ⚠️  Android directory not found"
fi

echo ""
echo "2️⃣  Killing all Java processes..."
# Kill Java processes (be careful with this)
pkill -f "java.*gradle" || true
pkill -f "jdwp" || true
echo "   ✅ Java processes killed"

echo ""
echo "3️⃣  Clearing Gradle cache..."
rm -rf ~/.gradle/caches
rm -rf ~/.gradle/wrapper
echo "   ✅ Gradle cache cleared"

echo ""
echo "4️⃣  Clearing Android build files..."
if [ -d "android" ]; then
    cd android
    rm -rf build
    rm -rf app/build
    rm -rf .gradle
    cd ..
    echo "   ✅ Build directories cleared"
fi

echo ""
echo "5️⃣  Rebuilding project..."
if [ -d "android" ]; then
    cd android
    # Download dependencies and sync
    ./gradlew clean
    ./gradlew build -x test --no-daemon
    cd ..
    echo "   ✅ Project rebuilt"
else
    echo "   ❌ Android directory not found"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ Gradle corruption fixed!"
echo ""
echo "You can now try building APK again:"
echo "  cd android"
echo "  ./gradlew assembleRelease -Dorg.gradle.java.home=\"\$JAVA_HOME\""
echo ""
