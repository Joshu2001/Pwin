# Quick Build Guide - Regaarder APK & AAB

## ⚡ Fast Track to Production Build

### Prerequisites
```bash
# Verify Java is installed and set
echo $JAVA_HOME

# If not set, export it:
export JAVA_HOME="C:\Program Files\Java\jdk-17"  # Windows
# OR
export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home"  # Mac
# OR
export JAVA_HOME="/usr/lib/jvm/jdk-17"  # Linux
```

---

## 🚀 Build APK (for Testing)

```bash
# 1. Build web app
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Build APK
cd android
./gradlew assembleRelease -Dorg.gradle.java.home="$JAVA_HOME"

# ✅ Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**Time:** ~5-10 minutes

---

## 📦 Build AAB (for Google Play)

```bash
# 1. Build web app
npm run build

# 2. Sync with Android
npx cap sync android

# 3. Build AAB
cd android
./gradlew bundleRelease -Dorg.gradle.java.home="$JAVA_HOME"

# ✅ Output: android/app/build/outputs/bundle/release/app-release.aab
```

**Time:** ~5-10 minutes

---

## 🔐 Sign for Production (AAB)

```bash
# 1. Generate keystore (first time only)
keytool -genkey -v -keystore regaarder-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias regaarder_key

# 2. Move to keystores folder
mkdir -p android/keystores
mv regaarder-release-key.jks android/keystores/

# 3. Export environment variables
export KEYSTORE_PASSWORD="your_password"
export KEY_ALIAS="regaarder_key"
export KEY_PASSWORD="your_key_password"

# 4. Build with signing
cd android
./gradlew bundleRelease \
  -Dorg.gradle.java.home="$JAVA_HOME" \
  -Pandroid.injected.signing.store.file="keystores/regaarder-release-key.jks" \
  -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$KEY_PASSWORD"

# ✅ Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## ☑️ Before First Build

- [ ] Backend running on port 4000
- [ ] `npm install` completed
- [ ] `npm run build` successful
- [ ] `dist/` folder has files
- [ ] Java JDK 17 installed
- [ ] Android SDK installed
- [ ] Device/emulator connected (for testing)

---

## 📲 Install on Device (Testing)

```bash
# Connect device via USB with debugging enabled

# Install APK
adb install android/app/build/outputs/apk/release/app-release-unsigned.apk

# Or use Android Studio: Run > Run 'app'
```

---

## 🏪 Upload to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Select Regaarder app
3. Left menu: **Release** → **Production**
4. Click **Create new release**
5. Upload the AAB file
6. Add release notes
7. Review and publish

---

## 🔍 Build Status Check

```bash
# Check build outputs
ls -lah android/app/build/outputs/apk/release/
ls -lah android/app/build/outputs/bundle/release/

# Verify APK size
du -h android/app/build/outputs/apk/release/app-release-unsigned.apk

# Verify AAB size
du -h android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| `JAVA_HOME not found` | Set it: `export JAVA_HOME="path/to/jdk-17"` |
| `Gradle build fails` | Run: `./gradlew clean` then rebuild |
| `API calls fail in APK` | ✅ Already fixed! Uses dynamic hostname |
| `App crashes on launch` | Check: `adb logcat \| grep regaarder` |
| `Signing fails` | Verify keystore: `keytool -list -keystore keystores/regaarder-release-key.jks` |

---

## 📊 File Locations

| File | Location | Size |
|------|----------|------|
| Built Web App | `dist/` | ~1-3 MB |
| APK (unsigned) | `android/app/build/outputs/apk/release/` | ~30-50 MB |
| AAB (bundle) | `android/app/build/outputs/bundle/release/` | ~20-30 MB |

---

## 🎯 Configuration Summary

| Setting | Value |
|---------|-------|
| Package ID | `com.regaarder.app` |
| Version | 1.0 (code: 1) |
| Min SDK | 26 (Android 8.0) |
| Target SDK | 34 (Android 14) |
| Java Version | 17 |
| Backend URL | Dynamic (device IP):4000 |

---

## ✨ Already Configured For You

✅ Web app minification  
✅ Code obfuscation  
✅ Resource optimization  
✅ Dynamic API endpoints  
✅ Android manifest  
✅ Capacitor config  
✅ Build gradle  
✅ Vite production build  

**Everything is ready to go!** 🚀
