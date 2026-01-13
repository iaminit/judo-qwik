import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'it.judo1ms.app',
    appName: 'Judo App',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        allowNavigation: ['judo.1ms.it']
    },
    android: {
        allowMixedContent: true
    },
    plugins: {
        StatusBar: {
            overlaysWebView: true
        }
    }
};

export default config;
