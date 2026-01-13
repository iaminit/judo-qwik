# Guida alla Creazione di un APK Superperformante per Qwik

Questa guida ti accompagnerà passo dopo passo nella trasformazione della tua applicazione Qwik in un'app Android (APK) ad alte prestazioni utilizzando **Capacitor**.

## Prerequisiti

Assicurati di avere installato:
1.  **Node.js** (versione corrente LTS raccomandata).
2.  **Android Studio** (per compilare l'APK e gestire l'emulatore/dispositivo fisico).

## 1. Preparazione del Progetto Qwik

Qwik è nativamente molto veloce grazie al suo approccio di "Resumability". Per ottenere le massime prestazioni su mobile, utilizzeremo l'adapter statico (`static adapter`) che genera file HTML/JS/CSS pre-renderizzati, ideali per essere serviti localmente dal device.

### Verifica dell'Adapter Statico
Il progetto sembra già avere l'adapter statico configurato in `adapters/static/vite.config.ts`.
Assicurati che il comando `build.static` in `package.json` sia corretto:

```json
"build.static": "qwik check-client src dist && vite build -c adapters/static/vite.config.ts"
```

## 2. Installazione e Configurazione di Capacitor

Capacitor è il bridge che permette di eseguire la tua web app come un'app nativa.

1.  **Installa le dipendenze di Capacitor:**
    ```bash
    npm install @capacitor/core @capacitor/cli @capacitor/android
    ```

2.  **Inizializza Capacitor:**
    ```bash
    npx cap init
    ```
    -   **App name:** Il nome della tua app (es. "Judo App").
    -   **App Package ID:** Un identificativo univoco (es. `it.1ms.judo`).
    -   **Web asset directory:** Imposta questo valore su `dist` (è la cartella dove Qwik genera i file statici).

    *Nota: Se hai già inizializzato Capacitor, puoi modificare `capacitor.config.ts` o `capacitor.config.json` per assicurarti che `webDir` sia impostato su `dist`.*

## 3. Generazione della Build Statica

Prima di sincronizzare il codice con Android, dobbiamo generare la versione statica del sito.

1.  Esegui il comando di build statica:
    ```bash
    npm run build.static
    ```
    Questo creerà una cartella `dist` contenente i file HTML, JS e CSS ottimizzati.

## 4. Integrazione con Android

1.  **Aggiungi la piattaforma Android:**
    ```bash
    npx cap add android
    ```

2.  **Sincronizza i file:**
    Ogni volta che modifichi il codice Qwik e rigeneri la build (`npm run build.static`), devi eseguire questo comando per copiare i file nella cartella del progetto Android:
    ```bash
    npx cap sync
    ```

## 5. Creazione dell'APK (Build)

1.  **Apri il progetto in Android Studio:**
    ```bash
    npx cap open android
    ```

2.  **Configura le prestazioni in Android Studio:**
    -   Assicurati di compilare in modalità **Release** (non Debug) per le massime prestazioni.
    -   Vai su `Build` > `Select Build Variant...` e seleziona `release`.

3.  **Genera l'APK o il Bundle:**
    -   Vai su `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
    -   L'APK verrà generato nella cartella `android/app/build/outputs/apk/release/`.

## 6. Ottimizzazioni per Prestazioni Estreme ("Superperformante")

Per garantire che l'APK sia il più veloce possibile:

### A. Qwik Service Worker
Qwik gestisce il prefetching in modo intelligente. Assicurati che il Service Worker sia abilitato per il caching degli asset statici, riducendo i tempi di caricamento successivi.

### B. Minimizza le Risorse
Il processo di build di Qwik/Vite (`npm run build.static`) già minifica CSS e JS. Tuttavia, controlla:
-   **Immagini:** Usa formati moderni come WebP. Assicurati che le immagini nella cartella `public` siano ottimizzate.
-   **Font:** Includi solo i pesi dei font necessari.

### C. Configurazione Capacitor (capacitor.config.ts)
Puoi ottimizzare l'esperienza nativa nascondendo la splash screen automaticamente non appena l'app è pronta:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.1ms.judo',
  appName: 'Judo App',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0
    }
  }
};

export default config;
```

### D. Debugging delle Prestazioni
Se noti rallentamenti:
1.  Collega il dispositivo Android al PC.
2.  Apri Chrome sul PC e vai a `chrome://inspect`.
3.  Ispeziona la WebView dell'app per vedere console log e performance profile come se fosse un sito web.

---

## Riassunto del Workflow di Sviluppo

1.  Modifica il codice Qwik.
2.  `npm run build.static`
3.  `npx cap sync`
4.  Esegui su Android Studio o aggiorna l'APK.
