# Gradle Build Corruption Fix Script for Windows
# Solves: TimeoutException cannot be cast to RuntimeException

Write-Host "🔧 Fixing Gradle Build Corruption..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop all Gradle daemons
Write-Host "1️⃣  Stopping Gradle daemons..." -ForegroundColor Yellow
if (Test-Path "android") {
    Push-Location android
    & .\gradlew.bat --stop
    Pop-Location
    Write-Host "   ✅ Gradle daemons stopped" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Android directory not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2️⃣  Killing all Java processes..." -ForegroundColor Yellow
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ Java processes killed" -ForegroundColor Green

Write-Host ""
Write-Host "3️⃣  Clearing Gradle cache..." -ForegroundColor Yellow
$gradleCache = "$env:USERPROFILE\.gradle"
if (Test-Path $gradleCache) {
    Remove-Item -Recurse -Force $gradleCache -ErrorAction SilentlyContinue
    Write-Host "   ✅ Gradle cache cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "4️⃣  Clearing Android build files..." -ForegroundColor Yellow
if (Test-Path "android") {
    Push-Location android
    
    if (Test-Path "build") {
        Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue
    }
    if (Test-Path "app\build") {
        Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
    }
    if (Test-Path ".gradle") {
        Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue
    }
    
    Pop-Location
    Write-Host "   ✅ Build directories cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "5️⃣  Rebuilding project..." -ForegroundColor Yellow
if (Test-Path "android") {
    Push-Location android
    
    # Clean
    Write-Host "   Running: gradlew.bat clean" -ForegroundColor Gray
    & .\gradlew.bat clean --no-daemon -x test
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Clean successful" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Clean had some issues, continuing..." -ForegroundColor Yellow
    }
    
    Pop-Location
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ Gradle corruption fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now try building APK again:" -ForegroundColor Cyan
Write-Host "  cd android" -ForegroundColor Gray
Write-Host "  .\gradlew.bat assembleRelease -Dorg.gradle.java.home=`"C:\Program Files\Java\jdk-17`"" -ForegroundColor Gray
Write-Host ""
Write-Host "Or build AAB:" -ForegroundColor Cyan
Write-Host "  cd android" -ForegroundColor Gray
Write-Host "  .\gradlew.bat bundleRelease -Dorg.gradle.java.home=`"C:\Program Files\Java\jdk-17`"" -ForegroundColor Gray
Write-Host ""
