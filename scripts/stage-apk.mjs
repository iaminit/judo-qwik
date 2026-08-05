import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('android/app/build/outputs/apk/debug/app-debug.apk');
const destinations = [
  resolve('public/downloads/judo-app.apk'),
  resolve('dist/downloads/judo-app.apk'),
];

if (!existsSync(source)) {
  throw new Error(`APK non trovato: ${source}`);
}

for (const destination of destinations) {
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

const sizeMb = (statSync(source).size / 1024 / 1024).toFixed(1);
console.log(`APK pronto per il download (${sizeMb} MB): public/downloads/judo-app.apk`);
