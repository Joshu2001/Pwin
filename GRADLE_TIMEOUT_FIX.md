# Gradle TimeoutException Fix - Complete Solution

## Problem Summary
```
class java.util.concurrent.TimeoutException cannot be cast to class java.lang.RuntimeException
```

This happens when:
- Gradle daemon times out during build
- Network connection is slow/interrupted
- Gradle cache is corrupted
- Memory allocation is insufficient
- Too many parallel build processes

---

## ✅ Solution (Choose One)

### Option 1: Quick Fix (Recommended) - Run This Now

**For Windows PowerShell:**
```powershell
# Navigate to your project
cd c:\Users\user\Desktop\Regaarder-Pwin\Regaarder-Project-main\Regaarder-4.0-main

# Run the fix script
.\fix-gradle-corruption.ps1

# Then try building again
cd android
.\gradlew.bat bundleRelease -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" --no-daemon
```

### Option 2: Manual Fix (If script doesn't work)

**Step 1: Kill Java processes**
```powershell
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
```

**Step 2: Clear caches**
```powershell
# Remove Gradle cache
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle" -ErrorAction SilentlyContinue

# Remove local build directories
cd android
Remove-Item -Recurse -Force "build", "app\build", ".gradle" -ErrorAction SilentlyContinue
cd ..
```

**Step 3: Stop Gradle daemon**
```powershell
cd android
.\gradlew.bat --stop
cd ..
```

**Step 4: Clean build**
```powershell
cd android
.\gradlew.bat clean --no-daemon
cd ..
```

**Step 5: Build with no-daemon flag**
```powershell
cd android
.\gradlew.bat bundleRelease -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" --no-daemon
cd ..
```

---

## 🔧 Configuration Improvements Made

Updated `android/gradle.properties` with:

### Memory Settings
```properties
# Increased from 1536m to 4096m
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+UseG1GC
```

### Timeout Settings
```properties
# 120 second timeout (default is 30-60s)
org.gradle.daemon.idletimeout=120000
org.gradle.internal.http.connectionTimeout=120000
org.gradle.internal.http.socketTimeout=120000
```

### Performance Settings
```properties
# Enable parallel builds
org.gradle.parallel=true
org.gradle.workers.max=8
org.gradle.caching=true
```

These settings are already applied. Now rebuild.

---

## 🚀 Build Commands to Use

### Build APK (No Daemon - Recommended)
```powershell
cd android
.\gradlew.bat assembleRelease `
  -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" `
  --no-daemon
cd ..
```

### Build AAB (No Daemon - Recommended)
```powershell
cd android
.\gradlew.bat bundleRelease `
  -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" `
  --no-daemon
cd ..
```

### With Increased Timeout
```powershell
$env:GRADLE_OPTS = "-Xmx4096m"
cd android
.\gradlew.bat bundleRelease `
  -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" `
  --no-daemon `
  --max-workers=4
cd ..
```

---

## ✨ Why This Works

| Issue | Solution |
|-------|----------|
| **Timeout errors** | `--no-daemon` flag + increased timeout |
| **Memory issues** | Increased from 1536m to 4096m |
| **Corrupted daemon** | Kill Java + clear cache + new daemon |
| **Network timeouts** | Increased HTTP timeout to 120s |
| **Parallel build issues** | Set max workers to 4-8 |

---

## 📋 Complete Step-by-Step Guide

### Step 1: Stop Everything
```powershell
# Kill all Java processes
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait
Start-Sleep -Seconds 3

# Stop Gradle
cd android
.\gradlew.bat --stop
cd ..
```

### Step 2: Clean Everything
```powershell
# Navigate to project root
cd c:\Users\user\Desktop\Regaarder-Pwin\Regaarder-Project-main\Regaarder-4.0-main

# Remove caches
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle" -ErrorAction SilentlyContinue

# Remove local builds
cd android
Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue
cd ..

Write-Host "✅ All caches cleared"
```

### Step 3: Build with Optimized Settings
```powershell
# Set environment
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:GRADLE_OPTS = "-Xmx4096m"

# Build web first
Write-Host "Building web app..."
npm run build

# Sync Capacitor
Write-Host "Syncing Capacitor..."
npx cap sync android

# Build bundle
Write-Host "Building AAB..."
cd android
.\gradlew.bat clean --no-daemon
.\gradlew.bat bundleRelease `
  -Dorg.gradle.java.home="$env:JAVA_HOME" `
  --no-daemon `
  --max-workers=4

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "AAB Location: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Cyan
} else {
    Write-Host "❌ Build failed. Check output above." -ForegroundColor Red
}

cd ..
```

---

## 🆘 If It Still Fails

### Check Java Version
```powershell
java -version
# Should be Java 17
```

### Verify Gradle Home
```powershell
cd android
.\gradlew.bat -v
# Should show gradle version and java version
```

### Check Disk Space
```powershell
# You need at least 2GB free space
Get-Volume
```

### Force Gradle Wrapper Update
```powershell
cd android
Remove-Item -Recurse -Force "gradle\wrapper" -ErrorAction SilentlyContinue
.\gradlew.bat wrapper --gradle-version=8.14.3
cd ..
```

### Maximum Nuclear Option
```powershell
# Kill EVERYTHING
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process javaw -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove ALL gradle
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "android\.gradle" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "android\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "android\gradle\wrapper" -ErrorAction SilentlyContinue

# Start fresh
cd android
.\gradlew.bat wrapper --gradle-version=8.14.3
.\gradlew.bat clean
cd ..
```

---

## 📊 Success Indicators

Build should complete with:
```
BUILD SUCCESSFUL in Xs
```

Output files appear:
```
android/app/build/outputs/bundle/release/app-release.aab
```

Size should be 15-30 MB

---

## 🔄 Prevention Going Forward

### Always use --no-daemon for releases
```powershell
.\gradlew.bat bundleRelease --no-daemon
```

### Keep Gradle updated
```powershell
cd android
.\gradlew.bat wrapper --gradle-version=8.14.3
cd ..
```

### Monitor disk space
Keep at least 2GB free

### Increase timeouts in gradle.properties
Already done for you! ✅

---

## Summary

**What to do RIGHT NOW:**

1. ✅ Updated `android/gradle.properties` with better settings
2. ✅ Created `fix-gradle-corruption.ps1` script
3. ✅ Increased memory from 1536m to 4096m
4. ✅ Increased timeouts to 120 seconds

**Run this command:**
```powershell
cd android
.\gradlew.bat bundleRelease -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" --no-daemon
cd ..
```

If it still fails, run the fix script:
```powershell
.\fix-gradle-corruption.ps1
```

Then try building again.
