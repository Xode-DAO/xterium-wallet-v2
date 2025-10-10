import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'xterium-mobile-v2',
  webDir: 'www',
  plugins: {
    CustomURLScheme: {
      URL_SCHEME: 'xterium',
      HOST: 'app'
    }
  }
};

export default config;
