@echo off
setlocal enabledelayedexpansion

set JAVA_HOME=C:\Program Files\Java\jdk-17
set PATH=%JAVA_HOME%\bin;%PATH%

echo.
echo ============================================
echo Building Regaarder Android APK
echo ============================================
echo.

cd /d "c:\Users\user\Desktop\Regaarder-Pwin\Regaarder-Project-main\Regaarder-4.0-main"

echo [1/3] Building web assets (Vite)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WEB BUILD FAILED!
    goto :end
)

echo.
echo [2/3] Syncing web assets to Android (Capacitor)...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo CAP SYNC FAILED!
    goto :end
)

echo.
echo [3/3] Running Gradle build...
cd /d "c:\Users\user\Desktop\Regaarder-Pwin\Regaarder-Project-main\Regaarder-4.0-main\android"
call gradlew.bat assembleDebug --no-daemon --console=plain

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo BUILD SUCCESSFUL!
    echo ============================================
    echo APK location:
    dir /b "app\build\outputs\apk\debug\*.apk"
    echo.
    echo Full path: app\build\outputs\apk\debug\
) else (
    echo.
    echo ============================================
    echo BUILD FAILED with error code %ERRORLEVEL%
    echo ============================================
)

endlocal
