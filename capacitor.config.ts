import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.incubadora.app',
  appName: 'Incubadora de Soluções',
  webDir: 'out',
  server: {
    url: 'https://incubadora-ckp5.onrender.com',
    cleartext: true
  }
};

export default config;
