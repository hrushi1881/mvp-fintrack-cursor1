import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.finspire.app',
  appName: 'Finspire',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#14b8a6",
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a"
    }
  }
};

export default config;