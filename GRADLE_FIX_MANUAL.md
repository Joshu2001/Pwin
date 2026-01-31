# Manual Gradle Corruption Fix - Step by Step

## For Windows (Using PowerShell)

### Option 1: Automatic Fix (Recommended)
```powershell
# Run the automated fix script
.\fix-gradle-corruption.ps1
```

### Option 2: Manual Steps

#### Step 1: Stop Gradle Daemons
```powershell
cd android
.\gradlew.bat --stop
cd ..
```

#### Step 2: Kill Java Processes
```powershell
# Kill all Java processes
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait a moment
Start-Sleep -Seconds 2
```

#### Step 3: Clear Gradle Cache
```powershell
# Remove Gradle cache
$gradleCache = "$env:USERPROFILE\.gradle"
Remove-Item -Recurse -Force $gradleCache -ErrorAction SilentlyContinue
```

#### Step 4: Clear Build Directories
```powershell
# Navigate to android directory
cd android

# Remove build directories
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "app\build") { Remove-Item -Recurse -Force "app\build" }
if (Test-Path ".gradle") { Remove-Item -Recurse -Force ".gradle" }

cd ..
```

#### Step 5: Clean Build
```powershell
cd android
.\gradlew.bat clean --no-daemon
cd ..
```

#### Step 6: Rebuild APK
```powershell
# Set Java home
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"

# Build APK
cd android
.\gradlew.bat assembleRelease -Dorg.gradle.java.home="$env:JAVA_HOME"
cd ..
```

Or for AAB:
```powershell
cd android
.\gradlew.bat bundleRelease -Dorg.gradle.java.home="$env:JAVA_HOME"
cd ..
```

---

## Troubleshooting

### If you still get timeout errors:

#### Increase Gradle Timeout
Create or modify `gradle.properties` in the `android` folder:

```properties
org.gradle.daemon.idletimeout=120000
org.gradle.parallel=true
org.gradle.workers.max=8
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

#### If gradle wrapper is corrupted:
```powershell
cd android
# Delete wrapper
Remove-Item -Recurse -Force "gradle/wrapper"

# Regenerate wrapper
.\gradlew.bat wrapper --gradle-version=8.14.3
cd ..
```

#### If still not working - Complete reset:
```powershell
# Kill ALL Java processes
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process javaw -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait
Start-Sleep -Seconds 3

# Remove everything Gradle related
$gradleHome = "$env:USERPROFILE\.gradle"
$localGradle = "$(Get-Location)\android\.gradle"

Remove-Item -Recurse -Force $gradleHome -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $localGradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$(Get-Location)\android\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$(Get-Location)\android\app\build" -ErrorAction SilentlyContinue

# Download fresh gradle
cd android
.\gradlew.bat clean
cd ..
```

---

## Prevention for Future Builds

### Use no-daemon flag
```powershell
cd android
.\gradlew.bat assembleRelease --no-daemon -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17"
cd ..
```

### Increase memory allocation
Set environment variable before building:
```powershell
$env:GRADLE_OPTS = "-Xmx4096m"
```

### Use offline mode after first download
```powershell
cd android
.\gradlew.bat assembleRelease --offline -Dorg.gradle.java.home="C:\Program Files\Java\jdk-17"
cd ..
```

---

## Quick Checklist

- [ ] Run `fix-gradle-corruption.ps1` script
- [ ] Confirm all Java processes are killed
- [ ] Confirm `.gradle` folder is deleted
- [ ] Confirm `android/build` and `android/app/build` are deleted
- [ ] Try building again with `--no-daemon` flag
- [ ] If still failing, check `gradle.properties`
- [ ] Increase Java memory in `GRADLE_OPTS`

---

## Expected Output After Fix

When the build works, you should see:
```
BUILD SUCCESSFUL in Xs
```

Then check output location:
- **APK:** `android\app\build\outputs\apk\release\app-release-unsigned.apk`
- **AAB:** `android\app\build\outputs\bundle\release\app-release.aab`
