@echo off
setlocal enabledelayedexpansion

set ROOT=C:\Users\user\Desktop\Regaarder-Pwin\Regaarder-Project-main\Regaarder-4.0-main
set ANDROID=%ROOT%\android
set KEYSTORE=%ROOT%\upload-keystore.jks
set SRC_APK=%ANDROID%\app\build\outputs\apk\prod\release\app-prod-release.apk
set DST_APK=%USERPROFILE%\Downloads\app-prod-release-latest.apk
set DST_HASH=%USERPROFILE%\Downloads\app-prod-release-latest.sha256.txt

echo [1/4] Building latest web assets...
cd /d "%ROOT%"
call npm run build
if errorlevel 1 goto :fail

echo [2/4] Copying web assets to Android...
call npx cap copy android
if errorlevel 1 goto :fail

echo [3/4] Building signed prod release APK...
cd /d "%ANDROID%"
call gradlew.bat assembleProdRelease -Pandroid.injected.signing.store.file=%KEYSTORE% -Pandroid.injected.signing.store.password=regaarder123 -Pandroid.injected.signing.key.alias=upload-key -Pandroid.injected.signing.key.password=regaarder123 --stacktrace
if errorlevel 1 goto :fail

echo [4/4] Copying APK to Downloads and writing SHA256...
if not exist "%SRC_APK%" (
  echo ERROR: Source APK not found: %SRC_APK%
  exit /b 1
)
copy /Y "%SRC_APK%" "%DST_APK%" >nul
if errorlevel 1 goto :fail

certutil -hashfile "%DST_APK%" SHA256 > "%DST_HASH%"
for %%I in ("%SRC_APK%") do (
  echo SRC_APK=%%~fI
  echo SRC_SIZE=%%~zI
  echo SRC_MTIME=%%~tI
)
for %%I in ("%DST_APK%") do (
  echo DST_APK=%%~fI
  echo DST_SIZE=%%~zI
  echo DST_MTIME=%%~tI
)
echo HASH_FILE=%DST_HASH%
echo SUCCESS
exit /b 0

:fail
echo FAILED with errorlevel %ERRORLEVEL%
exit /b %ERRORLEVEL%
