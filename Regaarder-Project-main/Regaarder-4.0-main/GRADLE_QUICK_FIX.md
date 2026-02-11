# 🚀 Quick Fix - Gradle TimeoutException

## The Problem
```
TimeoutException cannot be cast to RuntimeException
```

## The Instant Fix
```powershell
# Run this ONE command:
cd android
.\gradlew.bat bundleRelease -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" --no-daemon
cd ..
```

## If That Doesn't Work
```powershell
# Run the automated fix script:
.\fix-gradle-corruption.ps1

# Then try building again
cd android
.\gradlew.bat bundleRelease -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17" --no-daemon
cd ..
```

## What Was Fixed For You
✅ Updated `gradle.properties` with:
- Increased memory: 1536m → 4096m
- Increased timeout: 30s → 120s
- Enabled parallel builds
- Better garbage collection

✅ Created `fix-gradle-corruption.ps1` script to:
- Stop Gradle daemons
- Kill Java processes
- Clear caches
- Clean build directories
- Rebuild from scratch

## Expected Success Message
```
BUILD SUCCESSFUL in Xs
```

## Output File Location
```
android\app\build\outputs\bundle\release\app-release.aab
```

---

## Still Not Working? Do This:

**Option 1:** Kill Java and try again
```powershell
Get-Process java | Stop-Process -Force
Start-Sleep -Seconds 3
cd android
.\gradlew.bat bundleRelease --no-daemon -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17"
cd ..
```

**Option 2:** Complete reset
```powershell
# Remove everything Gradle
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle"
cd android
Remove-Item -Recurse -Force "build", "app\build", ".gradle"
.\gradlew.bat clean
cd ..
```

**Option 3:** Maximum clean
```powershell
# Kill everything, delete everything, start fresh
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle"
cd android
Remove-Item -Recurse -Force "build", "app\build", ".gradle", "gradle\wrapper"
.\gradlew.bat wrapper --gradle-version=8.14.3
.\gradlew.bat clean
cd ..
```

---

**Status:** ✅ All fixes configured and scripts ready  
**Next Step:** Run the build command above  
**Time to Build:** 5-10 minutes
