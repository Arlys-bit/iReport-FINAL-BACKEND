# Mobile App Building Guide

This guide provides detailed instructions for building the iReport Expo app for iOS and Android.

## Prerequisites

### Common Prerequisites
- **Node.js** 16+ installed
- **npm** or **yarn** package manager
- **Expo CLI** installed: `npm install -g expo-cli`
- **Git** (for version control)

### For iOS (macOS only)
- **Xcode** 14 or higher
- **macOS** 12 or higher
- **iOS SDK** 13.4 or higher
- **Apple Developer Account** (for app signing & distribution)
- **Cocoapods** (usually installed with Xcode)

### For Android
- **Android Studio** 2021.1 or higher
- **Android SDK** 30+
- **Java Development Kit** (JDK) 11 or higher
- **Android NDK** (optional, for native modules)
- **Google Play Developer Account** (for publishing)

---

## Project Setup

### 1. Install Dependencies

```bash
cd iReport
npm install
```

### 2. Configure Environment Variables

Create `.env` file in the iReport directory:

```env
# Expo configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

# For production
# EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

### 3. Update app.json (Important for Building)

Open `app.json` and update these fields:

```json
{
  "expo": {
    "name": "iReport",
    "slug": "ireport",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.yourdomain.ireport"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourdomain.ireport"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

## Development Testing

### Test on Web
```bash
npm run web
# or
expo start --web
```

### Test on iOS Simulator (macOS only)
```bash
npm run ios
# or
expo start --ios
```

### Test on Android Emulator
```bash
npm run android
# or
expo start --android
```

### Test on Physical Device

1. **Install Expo Go app** on your device
2. **Start dev server**:
   ```bash
   expo start --no-dev-client
   ```
3. **Scan QR code** with your device's camera
4. **Open in Expo Go** app

---

## Building Android APK/AAB

### Option 1: Build with EAS (Recommended)

#### Prerequisites
- Install EAS CLI: `npm install -g eas-cli`
- Login to Expo: `eas login`
- Configure `eas.json` in project root

#### Create eas.json
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "production": {
      "channel": "production"
    }
  }
}
```

#### Build APK
```bash
eas build --platform android --type apk
```

#### Build AAB (Recommended for Play Store)
```bash
eas build --platform android --type app-bundle
```

Build will be processed on Expo servers. Check status with:
```bash
eas build:list
```

Download completed build:
```bash
eas build:download --platform android
```

### Option 2: Local Android Build

#### Setup Android Environment

1. **Install Android Studio** from google.com
2. **Set Environment Variables**:

   **Windows (PowerShell)**:
   ```powershell
   $env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
   $env:Path += ";$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:ANDROID_HOME\platform-tools"
   ```

   **macOS/Linux**:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Create Release Key** (only once):
   ```bash
   keytool -genkey -v -keystore ~/ireport-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias ireport
   ```

4. **Generate Unsigned APK**:
   ```bash
   expo prebuild --clean --platform android
   cd android
   ./gradlew assembleRelease
   ```

5. **Sign APK**:
   ```bash
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
     -keystore ~/ireport-release-key.keystore \
     app/build/outputs/apk/release/app-release-unsigned.apk ireport
   ```

6. **Optimize APK** (optional):
   ```bash
   /Android/sdk/build-tools/VERSION/zipalign -v 4 \
     app/build/outputs/apk/release/app-release-unsigned.apk \
     app/build/outputs/apk/release/app-release.apk
   ```

---

## Building iOS App

### Option 1: Build with EAS (Recommended)

```bash
eas build --platform ios
```

### Option 2: Local iOS Build (macOS only)

#### Prerequisites
- Xcode 14+ installed
- iOS Deployment Target 13+

#### Build Steps

1. **Prebuild Project**:
   ```bash
   expo prebuild --clean --platform ios
   ```

2. **Open Xcode Project**:
   ```bash
   open ios/iReport.xcworkspace
   ```

3. **Configure Signing**:
   - Select project in Xcode
   - Go to Signing & Capabilities
   - Select your team
   - Update Bundle Identifier

4. **Build Archive**:
   ```bash
   xcodebuild -workspace ios/iReport.xcworkspace \
     -scheme iReport \
     -configuration Release \
     -archivePath iReport.xcarchive archive
   ```

5. **Export Archive**:
   ```bash
   xcodebuild -exportArchive \
     -archivePath iReport.xcarchive \
     -exportOptionsPlist ExportOptions.plist \
     -exportPath ./build
   ```

---

## App Store Deployment

### Google Play Store (Android)

#### Prerequisites
- Signed APK or AAB
- Google Play Developer Account ($25 one-time fee)
- Screenshots, description, privacy policy

#### Steps

1. **Go to Google Play Console**: https://play.google.com/console/
2. **Create new app**
3. **Fill app details**:
   - Title: "iReport"
   - Category: "Education"
   - Content rating
4. **Upload APK or AAB**
5. **Add store listing**:
   - Screenshots (min 2)
   - Description
   - Privacy Policy URL
6. **Set price** (free or paid)
7. **Submit for review**

Review typically takes 2-4 hours.

### Apple App Store (iOS)

#### Prerequisites
- Built IPA
- Apple Developer Account ($99/year)
- Screenshots, description, privacy policy

#### Steps

1. **Go to App Store Connect**: https://appstoreconnect.apple.com/
2. **Create new app**
3. **Upload with Xcode**:
   ```bash
   xcodebuild -exportArchive \
     -archivePath iReport.xcarchive \
     -exportOptionsPlist ExportOptions.plist \
     -exportPath ~/Desktop/myIPA \
     && xcrun altool --upload-app -f ~/Desktop/myIPA/iReport.ipa \
     -t ios -u APPLE_ID -p APP_SPECIFIC_PASSWORD
   ```
4. **Add app information**:
   - Screenshots
   - Description
   - Keywords
   - Privacy Policy
5. **Configure pricing and availability**
6. **Submit for review**

Review typically takes 24-48 hours.

---

## Web Deployment

### Build for Web
```bash
expo export --platform web
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

### Deploy to GitHub Pages
```bash
npm run web:export
# Push dist folder to gh-pages branch
```

---

## Release Notes & Version Management

### Update Version
Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1"
  }
}
```

And in `package.json`:
```json
{
  "version": "1.0.1"
}
```

### Create Release Notes File
Create `RELEASE_NOTES.md`:
```markdown
## Version 1.0.1

### Features
- Improved report submission UI
- Added offline support

### Bug Fixes
- Fixed authentication timeout
- Improved performance

### Breaking Changes
- None
```

---

## Troubleshooting

### Android Build Issues

**Gradle sync failed**:
```bash
cd android
./gradlew clean
./gradlew build
```

**Out of memory during build**:
```bash
export _JAVA_OPTIONS=-Xmx4096m
./gradlew build
```

**Build takes too long**:
- Increase Java heap: `-Xmx4096m`
- Disable instant run in Android Studio
- Clean build: `./gradlew clean`

### iOS Build Issues

**Cocoapods error**:
```bash
cd ios
pod repo update
pod install
cd ..
```

**Signing error**:
- Check Apple Developer Account is valid
- Verify provisioning profiles in Xcode
- Ensure correct Bundle ID

**Build archive failed**:
- Clean build: `xcodebuild clean`
```bash
xcodebuild clean -workspace ios/iReport.xcworkspace -scheme iReport
```

### Common Issues

**API Connection Failed**:
- Verify `EXPO_PUBLIC_API_URL` in `.env`
- Ensure backend server is running
- Check network connectivity

**Blank Screen on Launch**:
- Check console logs
- Verify fonts/assets are loaded
- Check AuthContext initialization

**Performance Issues**:
- Use React.memo for heavy components
- Implement lazy loading
- Use FlatList instead of ScrollView for lists

---

## Performance Optimization Best Practices

### Before Publishing

1. **Bundle Size**:
   ```bash
   npx expo-size-check
   ```

2. **Performance**:
   - Use React Profiler
   - Check animation FPS
   - Monitor memory usage

3. **Testing**:
   - Test on real devices
   - Test on slow network (Network Link Conditioner)
   - Test with poor GPS signal

4. **Screenshots**:
   - Capture on different device sizes
   - Use real photos, not mocks

---

## Publishing Checklist

### Before Submission
- [ ] Update version number
- [ ] Write release notes
- [ ] Test on real device
- [ ] Test offline functionality
- [ ] Verify API configuration
- [ ] Update app icon (192x192)
- [ ] Add splash screen
- [ ] Create store screenshots
- [ ] Write app description
- [ ] Setup privacy policy
- [ ] Verify permissions

### After Publishing
- [ ] Monitor crash reports
- [ ] Respond to reviews
- [ ] Track user feedback
- [ ] Monitor performance metrics
- [ ] Plan next update

---

## Support & Resources

- [Expo Build Documentation](https://docs.expo.dev/build/)
- [Expo Publishing Guide](https://docs.expo.dev/distribute/publishing-to-app-stores/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Android Studio Docs](https://developer.android.com/studio/docs)
- [Xcode Documentation](https://developer.apple.com/xcode/)

---

## Version History

- **v1.0.0** (Current) - Initial release with all features

---

**Last Updated**: March 2026
