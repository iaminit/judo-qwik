# 🥋 SCHEDA TECNICA COMPLETA - APPLICAZIONE JudoOK

## 1. 📌 Panoramica del Progetto
**JudoOK** è una piattaforma digitale progressiva web (PWA) e nativa Android (Capacitor) progettata per l'insegnamento, la consultazione e la gestione del Judo tradizionale, delle tecniche Gokyo, dei Kata, del Dizionario di terminologia giapponese e dei programmi d'esame FIJLKAM.

L'applicazione combina un'architettura **SSR (Server-Side Rendering)** ultra-veloce basata su **Qwik City** con un backend integrato **PocketBase (SQLite)** in esecuzione nello stesso container cloud, offrendo tempi di risposta sub-millisecondo ed un pannello di gestione completo.

---

## 2. 🌐 Link Ufficiali & Endpoints

### Online (Produzione Google Cloud)
- **Dominio Principale**: [https://judo.1ms.it](https://judo.1ms.it)
- **Direct Cloud Run URL**: [https://judo-app-4hhblbuynq-ew.a.run.app](https://judo-app-4hhblbuynq-ew.a.run.app)
- **Google Cloud Project ID**: `judo-qwik-app`
- **Regione Cloud Run**: `europe-west1` (Genoa / Frankfurt)
- **Servizio Cloud Run**: `judo-app`

### Pagine del Pannello di Gestione Online / Locale
- **Dashboard Gestione**: `/gestione`
- **Gestione Bacheca**: `/gestione/bacheca`
- **Gestione Tecniche (Gokyo)**: `/gestione/tecniche`
- **Gestione Kata**: `/gestione/kata`
- **Gestione Dizionario**: `/gestione/dizionario`
- **Gestione Programma Esami**: `/gestione/programma`
- **Gestione Storia**: `/gestione/storia`
- **Gestione Galleria**: `/gestione/gallery`

### Ambiente Locale (Sviluppo)
- **Dev Server Qwik**: `http://localhost:5174` (o `http://localhost:5173`)
- **PocketBase Admin Dashboard Locale**: `http://127.0.0.1:8090/_/`
- **PocketBase REST API Locale**: `http://127.0.0.1:8090/api/`

---

## 3. 🛠️ Stack Tecnologico & Dipendenze

### Core Framework & Runtime
- **Qwik**: `v1.18.0` - Framework reattivo a idratazione zero (Resumability) per massima velocità ed SEO.
- **Qwik City**: `v1.18.0` - Routing basato su file system, `routeLoader$`, `action$` e gestione middleware.
- **Node.js**: `v20+` / `v22+` (Alpine Linux in container).
- **Express.js**: `v5.2.1` - Entry point server per servire la build SSR ed intercettare le richieste.

### Database & Backend Engine
- **PocketBase Engine**: `v0.35.0` (Linux amd64) in esecuzione integrata via SQLite in container.
- **PocketBase JS SDK**: `v0.26.5` - Client SDK con autenticazione Superuser/Admin ed helpers di query.
- **SQL.js / SQLite3**: `v5.1.7` - Driver SQLite integrati.

### Interfaccia Utente & Styling
- **CSS**: Vanilla CSS con Custom Properties (CSS Variables) HSL Tailored per Dark/Light Mode.
- **TailwindCSS**: `v4.1.18` (PostCSS container utilities & layout styling).
- **Rich Text Editor**: **Quill v2.0.3** con modulo personalizzato Dual-Mode:
  - `👁️ Visuale WYSIWYG` (Editing formattato)
  - `💻 Codice HTML` (Editing HTML grezzo a tolleranza zero senza sanitizzazione tag).
- **Typography**: Google Fonts (Inter, Roboto, Outfit).

### Mobile App & Native Capabilities
- **Capacitor Core**: `v8.0.1` (`@capacitor/core`, `@capacitor/cli`).
- **Capacitor Android**: `v8.0.1` - Target compilazione Android APK nativo.
- **Capacitor Status Bar**: `v8.0.0` - Controllo nativo status bar mobile.
- **PWA Plugin**: `@qwikdev/pwa v0.0.4` - Service Worker, manifest offline ed installazione PWA.

### Comunicazione & Utility
- **Nodemailer**: `v7.0.12` - Invio notifiche email automatiche per nuovi post/notizie.
- **Form-Data**: `v4.0.5` - Gestione form multipart e upload file.

---

## 4. 🗄️ Struttura Database PocketBase (`pb_data`)

Il database si articola nelle seguenti collezioni principali:

| Collezione | Descrizione | Campi Chiave |
| :--- | :--- | :--- |
| **`tecniche`** | 112 Tecniche Gokyo (Dai Ikkyo ... Shinmeisho No Waza) | `titolo`, `titolo_secondario`, `slug`, `categoria_secondaria` (es. Ashi-waza), `livello`, `ordine`, `immagine_principale` (file), `audio` (file MP3), `video_link`, `contenuto` |
| **`kata`** | 10 Kata Tradizionali del Judo Kodokan | `titolo`, `titolo_secondario`, `slug`, `categoria_secondaria`, `livello`, `immagine_principale`, `tecniche_singole` (JSON ordinato), `video_link`, `contenuto` |
| **`dizionario`** | 429 Termini Tecnico-Giapponesi | `titolo` (Giapponese), `titolo_secondario` (Kanji), `slug`, `descrizione_breve`, `categoria_secondaria`, `immagine_principale`, `contenuto`, `pubblicato`, `in_evidenza` |
| **`livelli_dan`** / **`programma`** | Requisiti e Programma Esami Kyu & Dan | `nome_completo`, `cintura_colore`, `grado_numero`, `requisiti`, `tecniche_richieste`, `ordine` |
| **`bacheca`** | Notizie, Comunicati e News del Dojo | `titolo`, `slug`, `descrizione_breve`, `contenuto` (HTML), `categoria_secondaria`, `data_riferimento`, `immagine_principale`, `pubblicato`, `in_evidenza` |
| **`storia`** | Articoli Storici & Cronologia Jigoro Kano | `titolo`, `titolo_secondario`, `anno`, `tags` (`articolo` / `timeline`), `immagine_principale`, `contenuto` |
| **`galleria`** | Foto e Video Multimediali | `titolo`, `slug`, `type` (`photo` / `video`), `immagine_principale`, `video_link`, `data_riferimento` |
| **`fijlkam`** | Regolamenti ed Iter Federali FIJLKAM | `titolo`, `slug`, `contenuto`, `anno` |
| **`community`** | Domande, Risposte e Discussioni | `titolo`, `contenuto`, `autore_id`, `created` |

---

## 5. 📂 Organizzazione File & Risorse Media

```
judo-qwik/
├── public/
│   ├── media/                   # Risorse visuali statiche (.webp, .jpg, .svg)
│   │   ├── audio/               # Tracce Audio Pronuncia (.mp3) per 100+ tecniche
│   │   ├── kata_thumbs/         # Miniature delle tecniche singole dei Kata
│   │   ├── icons/               # Icone PWA e Apple Touch
│   │   └── kano_via.webp        # Illustrazioni maestre
│   └── downloads/
│       └── judo-app.apk         # APK Android nativo scaricabile
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── media-browser-modal.tsx   # Modale selezione media con tab filtri (TUTTI, IMMAGINI, VIDEO, AUDIO, PDF)
│   │   │   ├── rich-text-editor.tsx      # Editor Quill dual-mode (WYSIWYG + HTML Grezzo)
│   │   │   ├── technique-form.tsx        # Modulo gestione tecniche
│   │   │   └── program-form.tsx          # Modulo gestione programma esami
│   │   ├── theme-toggle/                 # Selector tema chiaro/scuro
│   │   └── bottom-nav/                   # Bottom bar di navigazione mobile
│   ├── routes/
│   │   ├── layout.tsx                    # Header con Breadcrumb dinamico unificato
│   │   ├── tecniche/                     # Viste pubbliche Gokyo
│   │   ├── kata/                         # Viste pubbliche Kata
│   │   ├── dizionario/                   # Dizionario interattivo
│   │   ├── quiz/                         # Quiz d'esame
│   │   ├── gokyo-game/                   # Gioco interattivo Gokyo
│   │   ├── gokyo-tris/                   # Gioco Tris Judo
│   │   └── gestione/                     # Rotte protette del Pannello di Controllo
│   │       ├── bacheca/
│   │       ├── tecniche/
│   │       ├── kata/
│   │       ├── dizionario/
│   │       └── programma/
│   └── lib/
│       ├── pocketbase.ts                 # Client SDK pubblico
│       └── pocketbase-admin.ts           # Client SDK autenticato superuser
├── pb_data/                              # Database SQLite PocketBase locale & master
├── deploy-gcloude.sh                     # Script automatizzato build & deploy Cloud Run
├── Dockerfile                            # Multi-stage Docker container build
├── cloudbuild.yaml                       # GCP Cloud Build pipeline
└── start.sh                              # Script di avvio duale (PocketBase + Express Server)
```

---

## 6. 🚀 Workflow di Deployment (Google Cloud Run)

Il deployment è completamente automatizzato tramite il comando `./deploy-gcloude.sh`:

1. **Rsync Database & Media (`gsutil rsync`)**:
   Sincronizza lo stato del database locale `pb_data` con il bucket Google Cloud Storage `gs://judofeltre`.
2. **Cloud Build Container Image (`gcloud builds submit`)**:
   - Scarica PocketBase Linux x64 v0.35.0.
   - Esegue la build client/server di Qwik City.
   - Crea l'immagine Docker container `gcr.io/judo-qwik-app/judo-app`.
3. **Cloud Run Service Deployment (`gcloud run deploy`)**:
   - Distribuisce il container sulla region `europe-west1`.
   - `start.sh` avvia PocketBase in background su `127.0.0.1:8090` e l'applicazione Node Express su `PORT 8080`.
   - Instrada il 100% del traffico web pubblico sul nuovo container con SSL automatico su `https://judo.1ms.it`.

---

## 7. 📱 Compilazione Nativa Android (APK)

Per generare l'applicazione Android nativa sincronizzata:
```bash
npm run build:apk
```
Questo comando:
1. Imposta `VITE_PB_PUBLIC_URL=https://judo.1ms.it`.
2. Compila le risorse statiche di Qwik.
3. Copia tutti i media in `android/app/src/main/assets/public`.
4. Sincronizza i plugin ed il progetto nativo Android tramite Capacitor (`npx cap sync`).
