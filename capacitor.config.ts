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
    }
  },
};

export default config;
