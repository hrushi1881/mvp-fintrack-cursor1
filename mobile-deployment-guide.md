# Mobile Deployment Guide for Finspire

This guide provides step-by-step instructions for deploying the Finspire app to both the Apple App Store and Google Play Store.

## Prerequisites

- Apple Developer Account ($99/year) for iOS deployment
- Google Play Developer Account ($25 one-time fee) for Android deployment
- Xcode installed (for iOS)
- Android Studio installed (for Android)
- Node.js and npm installed

## Building the App

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Web App

```bash
npm run build
```

### 3. Initialize Capacitor (if not already done)

```bash
npm run cap:init
```

### 4. Add Platforms

```bash
# For iOS
npm run cap:add ios

# For Android
npm run cap:add android
```

### 5. Sync Web Code with Native Projects

```bash
npm run cap:sync
```

## iOS Deployment

### 1. Open the iOS Project

```bash
npm run cap:open:ios
```

### 2. Configure App in Xcode

1. Select the project in the Project Navigator
2. Select the app target
3. Update the Bundle Identifier to match your App ID (e.g., com.yourcompany.finspire)
4. Set the Version and Build numbers
5. Configure Signing & Capabilities with your Apple Developer account

### 3. Create App Icons and Splash Screens

1. Copy the provided app icons to the appropriate folders in Xcode
2. Configure the splash screen in the LaunchScreen.storyboard

### 4. Test on Simulator and Real Devices

1. Select a simulator or connected device
2. Click the Run button to build and test

### 5. Archive for App Store

1. Select "Generic iOS Device" as the build target
2. From the menu, select Product > Archive
3. Once archiving is complete, click "Distribute App"
4. Select "App Store Connect" and follow the prompts

### 6. Submit in App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Create a new app entry if you haven't already
3. Complete all required metadata, screenshots, and app information
4. Once your build is processed, add it to your submission
5. Submit for review

## Android Deployment

### 1. Open the Android Project

```bash
npm run cap:open:android
```

### 2. Configure App in Android Studio

1. Open the app/build.gradle file
2. Update the applicationId to match your package name (e.g., com.yourcompany.finspire)
3. Set the versionCode and versionName
4. Configure signing with your keystore

### 3. Create App Icons and Splash Screens

1. Copy the provided app icons to the appropriate drawable folders
2. Configure the splash screen in the appropriate XML files

### 4. Test on Emulator and Real Devices

1. Select an emulator or connected device
2. Click the Run button to build and test

### 5. Generate Signed Bundle/APK

1. From the menu, select Build > Generate Signed Bundle/APK
2. Select Android App Bundle (recommended) or APK
3. Configure with your keystore information
4. Select release build variant
5. Complete the build process

### 6. Submit to Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console/)
2. Create a new app if you haven't already
3. Complete all required metadata, screenshots, and app information
4. Upload your AAB or APK file
5. Create a release and submit for review

## App Store Optimization

### App Name and Keywords

- Use a descriptive name: "Finspire - Finance Tracker"
- Include relevant keywords: finance, budget, expense, savings, goals

### Description

Write a compelling description that:
- Highlights key features
- Explains benefits to users
- Includes relevant keywords naturally
- Has a strong call-to-action

### Screenshots and Videos

- Create high-quality screenshots showing key features
- Consider adding a preview video
- Use device frames for a professional look
- Add captions to highlight features

### Icon Design

- Use a simple, recognizable design
- Ensure it looks good at small sizes
- Follow platform design guidelines

## Maintenance and Updates

### Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Increment build numbers with each submission
- Keep track of changes in a changelog

### Testing Before Submission

- Test on multiple devices and OS versions
- Perform usability testing
- Check for performance issues
- Verify all features work as expected

### Responding to Reviews

- Monitor app reviews regularly
- Respond promptly and professionally
- Address issues mentioned in negative reviews
- Thank users for positive feedback

## Helpful Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Capacitor Documentation](https://capacitorjs.com/docs)