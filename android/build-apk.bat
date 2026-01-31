@echo off
set JAVA_HOME=C:\Program Files\Java\jdk-17
cd /d "%~dp0"
call gradlew.bat assembleDebug
echo.
echo Build complete. Check app\build\outputs\apk\debug for APK
pause
