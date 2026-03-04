@echo off
setlocal
set JAVA_HOME=C:\Program Files\Java\jdk-17
cd /d C:\Users\user\Desktop\Regaarder-Pwin\Regaarder-Project-main\Regaarder-4.0-main\android
call gradlew.bat assembleProdRelease -Pandroid.injected.signing.store.file=C:\Users\user\Desktop\Regaarder-Pwin\Regaarder-Project-main\Regaarder-4.0-main\upload-keystore.jks -Pandroid.injected.signing.store.password=regaarder123 -Pandroid.injected.signing.key.alias=upload-key -Pandroid.injected.signing.key.password=regaarder123 --stacktrace > C:\Users\user\Desktop\Regaarder-Pwin\build-apk-blackfix.log 2>&1
exit /b %ERRORLEVEL%
