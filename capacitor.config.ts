import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'it.judo1ms.app',
    appName: 'Judo App',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        StatusBar: {
            overlaysWebView: true
        }
    }
};

export default config;
