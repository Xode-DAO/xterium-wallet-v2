import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xterium.wallet',
  appName: 'Xterium Wallet',
  webDir: 'www',
  plugins: {
    BackgroundRunner: {
      label: "com.smoldot.background.task",
      src: "runners/smoldot.js",
      event: "smoldotEvent",
      repeat: true,
      interval: 15,
      autoStart: true,
    },
    CustomURLScheme: {
      URL_SCHEME: 'xterium',
      HOST: 'app'
    },
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#1B1B1B",
    },
    SocialLogin: {
      googleAndroidClientId: '286376865428-i60dhiqac2o6s2njvarhistc74fq1097.apps.googleusercontent.com',
      googleWebClientId: '286376865428-s6lkp8q0c6vk68i5pq17d0skrvl3mhkg.apps.googleusercontent.com',
    }
  },
};

export default config;
