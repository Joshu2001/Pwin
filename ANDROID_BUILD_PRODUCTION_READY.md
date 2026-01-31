# Regaarder Android Build Readiness Checklist

## ✅ Production Build Configuration

### Build System Configuration
- [x] **vite.config.js** - Production build settings configured
  - ✅ Source maps disabled (`sourcemap: false`)
  - ✅ Minification enabled (`minify: 'terser'`)
  - ✅ Target set to es2020
  - ✅ Vendor chunk splitting configured

- [x] **capacitor.config.json** - Updated with production settings
  - ✅ `cleartext: true` for HTTP support on Android
  - ✅ SplashScreen plugin configured
  - ✅ Web directory set to `dist`

- [x] **android/app/build.gradle** - Release build optimized
  - ✅ `minifyEnabled: true` - Code obfuscation enabled
  - ✅ `shrinkResources: true` - Unused resources removed
  - ✅ ProGuard optimization enabled
  - ✅ Debug symbols removed from release

### Network Configuration
- [x] **API Endpoints** - Fixed for mobile deployment
  - ✅ No hardcoded `localhost` URLs
  - ✅ Dynamic hostname detection: `${window.location.hostname}:4000`
  - ✅ Works on both development and APK builds

### Android Manifest
- [x] **AndroidManifest.xml**
  - ✅ INTERNET permission declared
  - ✅ FileProvider configured for file access
  - ✅ Activity exported flag set correctly
  - ✅ Proper theme configuration

### Pre-Build Checklist

#### 1. Code Quality
- [x] No console.log in production code (optional, for debugging)
- [x] No hardcoded secrets or API keys
- [x] No development-only features enabled
- [x] Language context properly implemented for all pages

#### 2. Asset Optimization
- [x] Images optimized and compressed
- [x] Unused CSS removed (Tailwind PurgeCSS)
- [x] JavaScript minified and tree-shaken
- [x] Chunk splitting configured

#### 3. Version Configuration
- [x] App version code: 1 (can be incremented for updates)
- [x] App version name: "1.0"
- [x] Package name: `com.regaarder.app`
- [x] App ID consistent across config

---

## 🔧 Build Instructions

### For APK Build (Testing on Devices)
```bash
# 1. Build the web app
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build APK
cd android
./gradlew assembleRelease -Dorg.gradle.java.home="$JAVA_HOME"

# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### For AAB Build (Google Play Store)
```bash
# 1. Build the web app
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build AAB
cd android
./gradlew bundleRelease -Dorg.gradle.java.home="$JAVA_HOME"

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### For Debug Build (Testing)
```bash
cd android
./gradlew assembleDebug -Dorg.gradle.java.home="$JAVA_HOME"

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔐 Signing Configuration

### Required for Release Builds

#### Generate Release Key (if not already created)
```bash
keytool -genkey -v -keystore regaarder-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias regaarder_key
```

#### Store the keystore
1. Copy `regaarder-release-key.jks` to `android/keystores/`
2. Set environment variables:
   ```bash
   export KEYSTORE_PASSWORD="your_password"
   export KEY_ALIAS="regaarder_key"
   export KEY_PASSWORD="your_key_password"
   ```

#### Build with Signing
```bash
cd android
./gradlew bundleRelease \
  -Dorg.gradle.java.home="$JAVA_HOME" \
  -Pandroid.injected.signing.store.file="keystores/regaarder-release-key.jks" \
  -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$KEY_PASSWORD"
```

---

## 📱 Testing Before Release

### Device Testing Checklist
- [ ] Test on physical Android device (API 26+)
- [ ] Test on Android emulator (multiple API levels)
- [ ] Test video playback in home page
- [ ] Test requests page loading
- [ ] Test user login/registration
- [ ] Test language switching
- [ ] Test offline mode (if applicable)
- [ ] Test network connectivity
- [ ] Test all navigation flows
- [ ] Test file uploads
- [ ] Test payment flows
- [ ] Test share functionality

### Performance Testing
- [ ] App starts in <3 seconds
- [ ] Videos load within 5 seconds
- [ ] No memory leaks
- [ ] Smooth scrolling and animations
- [ ] Battery drain is minimal

### Security Testing
- [ ] No hardcoded passwords/tokens
- [ ] API calls use HTTPS (in production)
- [ ] User data encrypted in transit
- [ ] Local data stored securely
- [ ] No sensitive data in logs

---

## 📊 Build Output Locations

| File | Location | Purpose |
|------|----------|---------|
| APK (Debug) | `android/app/build/outputs/apk/debug/app-debug.apk` | Testing on devices |
| APK (Release) | `android/app/build/outputs/apk/release/app-release-unsigned.apk` | Manual signing |
| AAB (Release) | `android/app/build/outputs/bundle/release/app-release.aab` | Google Play Store |

---

## 🚀 Release Workflow

### Step 1: Prepare Code
```bash
npm run build  # Ensure no build warnings
npm run lint   # Check for linting errors
```

### Step 2: Build Release Bundle
```bash
cd android
./gradlew bundleRelease -Dorg.gradle.java.home="$JAVA_HOME"
```

### Step 3: Sign the Bundle
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore keystores/regaarder-release-key.jks \
  -signedjar app-release-signed.aab \
  app-release.aab regaarder_key
```

### Step 4: Verify the AAB
```bash
jarsigner -verify -verbose app-release-signed.aab
```

### Step 5: Upload to Google Play Console
1. Go to Google Play Console
2. Select Regaarder app
3. Go to "Release" → "Production"
4. Click "Create new release"
5. Upload the signed AAB
6. Add release notes
7. Review and publish

---

## ⚠️ Common Issues & Solutions

### Issue: Build fails with "SDK not found"
**Solution:** Set `$JAVA_HOME` to JDK 17:
```bash
export JAVA_HOME="C:\Program Files\Java\jdk-17"
```

### Issue: "app-release.aab not found"
**Solution:** Check build.gradle has `bundle` task enabled (should be default in Capacitor)

### Issue: Signing fails
**Solution:** Ensure keystore path and credentials are correct:
```bash
keytool -list -v -keystore regaarder-release-key.jks
```

### Issue: Videos not loading in APK
**Solution:** Already fixed! API endpoints now use dynamic hostname detection

### Issue: App crashes on startup
**Solution:** Check AndroidManifest.xml has proper permissions and theme

---

## ✨ What's Already Configured

✅ **Build Optimization**
- Minification enabled
- Code obfuscation with ProGuard
- Resource shrinking enabled
- Tree-shaking of unused imports

✅ **Network Issues Fixed**
- Removed all hardcoded `localhost` URLs
- Dynamic API endpoint detection
- Works on both development and production

✅ **App Configuration**
- Proper package name: `com.regaarder.app`
- Correct SDK versions (min: 26, target: 34)
- Java compatibility: JDK 17

✅ **Performance**
- Lazy loading of routes
- Code splitting with chunks
- Source maps disabled in production
- Assets minified

---

## Next Steps

1. **Create Keystore** (if not done):
   ```bash
   keytool -genkey -v -keystore regaarder-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias regaarder_key
   ```

2. **Copy to Android Keystores**:
   ```bash
   mkdir -p android/keystores
   cp regaarder-release-key.jks android/keystores/
   ```

3. **Build and Test**:
   ```bash
   npm run build
   npx cap sync android
   cd android && ./gradlew bundleRelease
   ```

4. **Sign and Upload**:
   - Follow Google Play Console instructions
   - Upload the signed AAB
   - Complete store listing
   - Publish!

---

## Version History
- **v1.0** - Initial release
  - Basic video streaming
  - User authentication
  - Request system
  - Payment integration
  - Support ticketing
  - Multi-language support

Next version should increment versionCode and versionName in build.gradle.
