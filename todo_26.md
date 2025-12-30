# TODO_26 - Combined Project Markdown Files
Data di creazione: 30 Dicembre 2025

Questo file è un assemblaggio di tutti i file Markdown presenti nella root del progetto.

---

# README.md

# Qwik City App ⚡️

- [Qwik Docs](https://qwik.dev/)
- [Discord](https://qwik.dev/chat)
- [Qwik GitHub](https://github.com/QwikDev/qwik)
- [@QwikDev](https://twitter.com/QwikDev)
- [Vite](https://vitejs.dev/)

---

## Project Structure

This project is using Qwik with [QwikCity](https://qwik.dev/qwikcity/overview/). QwikCity is just an extra set of tools on top of Qwik to make it easier to build a full site, including directory-based routing, layouts, and more.

Inside your project, you'll see the following directory structure:

```
├── public/
│   └── ...
└── src/
    ├── components/
    │   └── ...
    └── routes/
        └── ...
```

- `src/routes`: Provides the directory-based routing, which can include a hierarchy of `layout.tsx` layout files, and an `index.tsx` file as the page. Additionally, `index.ts` files are endpoints. Please see the [routing docs](https://qwik.dev/qwikcity/routing/overview/) for more info.

- `src/components`: Recommended directory for components.

- `public`: Any static assets, like images, can be placed in the public directory. Please see the [Vite public directory](https://vitejs.dev/guide/assets.html#the-public-directory) for more info.

## Add Integrations and deployment

Use the `npm run qwik add` command to add additional integrations. Some examples of integrations includes: Cloudflare, Netlify or Express Server, and the [Static Site Generator (SSG)](https://qwik.dev/qwikcity/guides/static-site-generation/).

```shell
npm run qwik add # or `yarn qwik add`
```

## Development

Development mode uses [Vite's development server](https://vitejs.dev/). The `dev` command will server-side render (SSR) the output during development.

```shell
npm start # or `yarn start`
```

> Note: during dev mode, Vite may request a significant number of `.js` files. This does not represent a Qwik production build.

## Preview

The preview command will create a production build of the client modules, a production build of `src/entry.preview.tsx`, and run a local server. The preview server is only for convenience to preview a production build locally and should not be used as a production server.

```shell
npm run preview # or `yarn preview`
```

## Production

The production build will generate client and server modules by running both client and server build commands. The build command will use Typescript to run a type check on the source code.

```shell
npm run build # or `yarn build`
```

---

# TODO.md

# Piano di Migrazione: Judook React → Judo Qwik

## 📋 Stato della Migrazione

**Data inizio**: 29 Dicembre 2025
**Progetto sorgente**: `/judook-next` (React + Vite + Tailwind)
**Progetto destinazione**: `/judo-qwik` (Qwik City)

---

## ✅ FASE 1: Setup Iniziale (COMPLETATO)

### 1.1 Assets Statici ✓
- [x] Copiato 40 icone da `/public/icons/`
- [x] Copiato 149 immagini tecniche da `/public/media/`
- [x] Copiato 489 file audio MP3 (pronunce giapponesi)
- [x] Copiato 3 video MP4
- [x] Copiato 2 file PDF (regolamenti)
- [x] Copiato database SQLite locale (`judo.sqlite`, `sql-wasm.wasm`)
- **Totale**: ~104MB di assets

### 1.2 Configurazioni ✓
- [x] Installato e configurato Tailwind CSS 3.4.3
- [x] Creato `postcss.config.js`
- [x] Aggiornato `src/global.css` con stili custom (dark mode, animazioni)
- [x] Installato PocketBase 0.26.5 + sql.js 1.10.0
- [x] Creato file `.env` con `VITE_PB_URL`
- [x] Creato `src/lib/pocketbase.ts`

### 1.3 Struttura Routing ✓
- [x] Creata struttura file-based routing in `src/routes/`
- [x] 16 routes totali create con template base:
  - `/` - Home
  - `/dizionario` - Dictionary
  - `/tecniche` - Techniques
  - `/quiz` - Quiz
  - `/kata` - Kata List
  - `/kata/[slug]` - Kata Detail (dynamic route)
  - `/storia` - History
  - `/fijlkam` - FIJLKAM/Arbitraggio
  - `/bacheca` - Bulletin Board
  - `/gallery` - Gallery
  - `/gokyo-game` - Gokyo Game
  - `/gokyo-tris` - Gokyo Tris
  - `/flash` - Flash Cards
  - `/kaeshi-renraku` - Kaeshi Renraku
  - `/gestione` - Admin Panel
  - `/community` - Community Archive

### 1.4 Utilities e Hooks ✓
- [x] Creato `src/hooks/useJudoDB.ts` (SQLite hook per Qwik)
- [x] Creato `src/utils/database.ts` (funzioni query database)

---

## ✅ FASE 2: Componenti Core (100% COMPLETATO)

### 2.1 Layout e Navigation ✓
- [x] Creare `src/routes/layout.tsx` (root layout)
- [x] Migrare `Layout.jsx` → componente Qwik
  - [x] Header sticky con logo
  - [x] Menu hamburger laterale (drawer)
  - [x] Bottom navigation mobile
  - [x] Integrazione SearchModal
  - [x] Menu a tendina per sottosezioni
- [x] Convertire gestione dark mode:
  - [x] Theme toggle con localStorage
  - [x] Dark mode class switcher
  - [x] System preference detection

### 2.2 Search e Modal ✓
- [x] Migrare `SearchModal.jsx` → componente Qwik
  - [x] Ricerca cross-collection in PocketBase
  - [x] Filtraggio con variazioni termini (es. "ogoshi" → "o-goshi")
  - [x] Risultati espandibili con preview
  - [x] Keyboard shortcuts (Cmd+K)
  - [x] Navigazione diretta alle sezioni

### 2.3 Card Components ✓
- [x] Migrare `TechniqueCard.jsx`
- [x] Migrare `TermCard.jsx`
- [x] Migrare `BlogCard.jsx`
- [x] Migrare `BlogModal.jsx`

### 2.4 Stato Globale ✓
- [x] Creare `src/context/app-context.tsx`
  - [x] Definire `createContextId` per store globale
  - [x] Implementare `AppState` con:
    - [x] Dark mode state
    - [x] Search modal state
    - [x] User preferences
- [x] Integrare provider in `layout.tsx`

---

## 📄 FASE 3: Migrazione Pagine (PRIORITÀ ALTA)

### 3.1 Home Page
**File**: `src/routes/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Home.jsx` (138 righe)
- [ ] Implementare route loader per dati iniziali
- [ ] Convertire layout homepage
- [ ] Aggiungere navigation cards
- [ ] Meta tags SEO

### 3.2 Dizionario (Dictionary)
**File**: `src/routes/dizionario/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Dictionary.jsx` (385 righe)
- [ ] Route loader: fetch termini da PocketBase collection `dictionary`
- [ ] Filtri alfabetici (A-Z)
- [ ] Barra di ricerca con debounce
- [ ] Modal dettaglio termine
- [ ] Audio player per pronunce (491 file MP3)
- [ ] Rendering kanji se presente
- [ ] Highlight risultati ricerca (animazione `highlight-pulse`)

**PocketBase Collection**: `dictionary`
- Campi: `term`, `pronunciation`, `description`, `kanji`, `audio`

### 3.3 Tecniche (Techniques)
**File**: `src/routes/tecniche/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Techniques.jsx` (408 righe)
- [ ] Route loader: fetch da collection `techniques`
- [ ] Filtri avanzati:
  - [ ] Grouping: Gokyo (Dai Ikkyo, Dai Nikyo...) vs Category (Te-waza, Koshi-waza...)
  - [ ] Dan level filter
- [ ] Grid/List view toggle
- [ ] Modal dettaglio tecnica:
  - [ ] Video YouTube embed
  - [ ] Audio pronuncia
  - [ ] Immagine tecnica
  - [ ] Descrizione completa
- [ ] Sort by: order, name, dan_level

**PocketBase Collection**: `techniques`
- Campi: `name`, `description`, `group`, `category`, `video_youtube`, `audio`, `image`, `dan_level`, `order`

### 3.4 Quiz
**File**: `src/routes/quiz/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Quiz.jsx` (389 righe)
- [ ] Setup fase:
  - [ ] Select Dan level (1-5, Musashi, Mifune, Kano)
  - [ ] Select category (Generale, Tecnica, Storia, Regolamento, Mista)
  - [ ] Slider numero domande (1-100)
- [ ] Gameplay fase:
  - [ ] Randomizzazione domande
  - [ ] Timer (opzionale)
  - [ ] Selezione risposta
  - [ ] Feedback immediato corretto/sbagliato
  - [ ] Immagini nelle domande (se presenti)
- [ ] Risultati fase:
  - [ ] Score con logica "Hansoku-make" (3 errori = eliminato)
  - [ ] Riepilogo risposte
  - [ ] Spiegazioni errori
  - [ ] Restart/Retry

**PocketBase Collection**: `quiz_questions`
- Campi: `question`, `option_a/b/c/d`, `correct_answer`, `explanation`, `image_path`, `category`, `dan_level`
- Sort: `@random`

### 3.5 Kata
**File**: `src/routes/kata/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Kata.jsx` (149 righe)
- [ ] Route loader: fetch lista kata da collection `kata`
- [ ] Grid di card kata
- [ ] Link a dettaglio `/kata/[slug]`

**File**: `src/routes/kata/[slug]/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/KataDetail.jsx` (335 righe)
- [ ] Route loader: fetch kata specifico by slug
- [ ] Video YouTube embed
- [ ] Descrizione completa
- [ ] Nome giapponese
- [ ] Breadcrumb navigation

**PocketBase Collection**: `kata`
- Campi: `name`, `japanese_name`, `description`, `video_url`

### 3.6 Storia (History)
**File**: `src/routes/storia/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/History.jsx` (258 righe)
- [ ] Route loader: fetch da collection `history`
- [ ] Timeline o accordion layout
- [ ] Immagini storiche (kano.webp, mifune.webp, musashi.webp)
- [ ] Sezioni: title, subtitle, content

**PocketBase Collection**: `history`
- Campi: `title`, `subtitle`, `content`

### 3.7 FIJLKAM (Arbitraggio)
**File**: `src/routes/fijlkam/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Fijlkam.jsx` (326 righe)
- [ ] Route loader: fetch da collections `fijlkam` e `regulations`
- [ ] Tabs/Sections per argomenti
- [ ] PDF viewer integrato per regolamenti
- [ ] Link esterni a documenti ufficiali

**PocketBase Collections**: `fijlkam`, `regulations`
- Campi: `title`, `content`, `subtitle`

### 3.8 Bacheca (Bulletin Board)
**File**: `src/routes/bacheca/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/BulletinBoard.jsx` (133 righe)
- [ ] Route loader: fetch da collection `post`
  - [ ] Filter: `expiration_date = "" || expiration_date > @now`
  - [ ] Sort: `-date` (più recente prima)
- [ ] Grid/List view
- [ ] Card con:
  - [ ] Titolo
  - [ ] Descrizione breve
  - [ ] Data pubblicazione
  - [ ] Immagine (opzionale)
- [ ] Modal full content (editor HTML)

**PocketBase Collection**: `post`
- Campi: `title`, `description`, `content` (editor), `date`, `expiration_date`, `image`

### 3.9 Gallery
**File**: `src/routes/gallery/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Gallery.jsx` (323 righe)
- [ ] Route loader: fetch da collection `gallery`
- [ ] Filter by type: photo/video
- [ ] Masonry grid layout
- [ ] Modal lightbox per immagini
- [ ] Video YouTube embed
- [ ] Date sorting
- [ ] External links

**PocketBase Collection**: `gallery`
- Campi: `title`, `description`, `type` (photo/video), `image`, `video_url`, `date`, `link`

---

## 🎮 FASE 4: Giochi Interattivi (PRIORITÀ MEDIA)

### 4.1 Gokyo Tris
**File**: `src/routes/gokyo-tris/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/GokyoTris.jsx` (670 righe - COMPLESSO!)
- [ ] Logica di gioco tris interattivo
- [ ] Canvas rendering (se necessario)
- [ ] State management gioco (turni, vittorie, punteggi)
- [ ] AI opponent (se presente)
- [ ] Animazioni e transizioni
- **NOTA**: Questo è il componente più complesso, richiede attenzione particolare

### 4.2 Gokyo Game
**File**: `src/routes/gokyo-game/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/GokyoGame.jsx` (151 righe)
- [ ] Meccanica di gioco
- [ ] Score tracking
- [ ] Livelli/Difficoltà

### 4.3 Flash Cards
**File**: `src/routes/flash/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/FlashCard.jsx` (124 righe)
- [ ] Flip card animation
- [ ] Swipe gestures (mobile)
- [ ] Progress tracking
- [ ] Modalità studio (random, sequenziale)

### 4.4 Kaeshi Renraku
**File**: `src/routes/kaeshi-renraku/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/KaeshiRenraku.jsx` (426 righe)
- [ ] Route loader: fetch da collection `kaeshi_renraku`
- [ ] Visualizzazione contrattacchi
- [ ] Linking tra tecniche
- [ ] Diagrammi/Flow (se presenti)

**PocketBase Collection**: `kaeshi_renraku`
- Campi: `name`, `description`, `from_technique`, `to_technique`

---

## 🔧 FASE 5: Features Avanzate (PRIORITÀ BASSA)

### 5.1 Admin Panel (Gestione)
**File**: `src/routes/gestione/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Gestione.jsx` (300 righe)
- [ ] PocketBase authentication
- [ ] CRUD operations per collections
- [ ] Upload media files
- [ ] Backup/Restore database
- [ ] Stats e analytics

### 5.2 Community Archive
**File**: `src/routes/community/index.tsx`
**Riferimento**: `judook-next/frontend/src/pages/Community.jsx` (222 righe)
- [ ] Archivio storico community
- [ ] Timeline view
- [ ] Filtering by year/topic

### 5.3 PWA (Progressive Web App)
- [ ] Aggiornare `public/manifest.json`
- [ ] Service Worker per offline caching
- [ ] Install prompt
- [ ] Push notifications (opzionale)
- [ ] Icone maskable (già presenti)

### 5.4 Dark Mode Persistente
- [ ] Implementare context globale
- [ ] LocalStorage sync
- [ ] System preference detection
- [ ] Smooth transitions
- **NOTA**: Stili già pronti in `global.css`

---

## 🧪 FASE 6: Testing e Ottimizzazione

### 6.1 Testing
- [ ] Test navigazione tra tutte le route
- [ ] Test route loaders (SSR)
- [ ] Test responsiveness mobile
- [ ] Test dark mode switching
- [ ] Test search functionality
- [ ] Test audio/video playback
- [ ] Test quiz logic e scoring
- [ ] Test games functionality

### 6.2 Performance
- [ ] Lighthouse audit
- [ ] Ottimizzare bundle size
- [ ] Lazy loading immagini
- [ ] Preloading critical assets
- [ ] Route prefetching

### 6.3 SEO
- [ ] Meta tags per ogni pagina
- [ ] Open Graph tags
- [ ] Sitemap.xml
- [ ] robots.txt (già presente)
- [ ] Structured data (JSON-LD)

### 6.4 Accessibilità
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader compatibility
- [ ] Color contrast (WCAG AA)

---

## 📊 Metriche di Migrazione

### Completamento per Categoria
- **Setup Iniziale**: 100% ✅
- **Componenti Core**: 100% ✅
- **Pagine Priorità Alta**: 0%
- **Giochi Interattivi**: 0%
- **Features Avanzate**: 0%
- **Testing**: 0%

### Linee di Codice
- **Progetto React**: ~5500 righe JSX (solo pagine)
- **Progetto Qwik**: ~500 righe TSX (skeleton routes)
- **Da migrare**: ~5000 righe

### Collections PocketBase (10 totali)
- [x] `dictionary` - Configurato
- [x] `techniques` - Configurato
- [x] `quiz_questions` - Configurato
- [x] `kata` - Configurato
- [x] `history` - Configurato
- [x] `fijlkam` - Configurato
- [x] `regulations` - Configurato
- [x] `post` - Configurato
- [x] `gallery` - Configurato
- [x] `kaeshi_renraku` - Configurato

---

## 🎯 Prossimi Passi Immediati

1. **Creare Layout Root** (`src/routes/layout.tsx`)
2. **Implementare Dark Mode Context**
3. **Migrare Header + Navigation**
4. **Migrare SearchModal**
5. **Implementare route loader per `/dizionario`**
6. **Testare prima pagina funzionante end-to-end**

---

## 📝 Note Tecniche

### Differenze React → Qwik
- `useState` → `useSignal` (primitivi) / `useStore` (oggetti)
- `useEffect` → `useVisibleTask$` (client) / `useTask$` (server)
- `onClick` → `onClick$`
- Data fetching: `useEffect` → `routeLoader$` (SSR)
- Zustand non necessario → `useContext` + `useStore`

### Vantaggi della Migrazione
✅ SSR nativo con route loaders
✅ Resumability (carica solo il necessario)
✅ Prestazioni migliorate (lazy execution)
✅ Routing file-based più intuitivo
✅ TypeScript strict mode
✅ SEO-friendly by default

### Sfide Previste
⚠️ GokyoTris (670 righe, logica complessa)
⚠️ Quiz state management
⚠️ Audio/Video integration
⚠️ Modal management senza Zustand
⚠️ LocalStorage SSR compatibility

---

**Ultimo aggiornamento**: 29 Dicembre 2025, ore 10:20

---

# gestione_poc.md

# Gestione - Proof of Concept

## Panoramica

**Gestione** è l'interfaccia di amministrazione per JudoOK, progettata per la gestione completa dei contenuti attraverso PocketBase. L'obiettivo è creare un'interfaccia leggera, intuitiva ed efficace che permetta agli amministratori di gestire tutti i contenuti dell'applicazione senza dover accedere direttamente al pannello admin di PocketBase.

## Architettura

### Stack Tecnologico

- **Frontend**: Qwik (integrato nel progetto esistente)
- **Backend**: PocketBase Admin API
- **Autenticazione**: PocketBase Auth (email/password + OAuth2: Google, Microsoft, Facebook)
- **File Upload**: PocketBase File API
- **Real-time**: PocketBase Realtime Subscriptions (opzionale)

### Approccio Architetturale

```
┌─────────────────────────────────────────────────┐
│           Gestione (Qwik Frontend)              │
│  ┌───────────┬───────────┬───────────┐         │
│  │Dashboard  │ List View │ Edit Form │         │
│  └───────────┴───────────┴───────────┘         │
└─────────────────┬───────────────────────────────┘
                  │
                  │ PocketBase SDK
                  │
┌─────────────────▼───────────────────────────────┐
│            PocketBase Server                    │
│  ┌──────────────────────────────────────┐      │
│  │ Collections:                         │      │
│  │ • techniques     • gallery           │      │
│  │ • dictionary     • bacheca           │      │
│  │ • kata           • community         │      │
│  │ • exam_program   • kaeshi_renraku    │      │
│  │ • fijlkam        • regulations       │      │
│  │ • timeline_*     • users             │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

## Funzionalità Principali

### 1. Dashboard Centrale

**Obiettivo**: Visione d'insieme dell'applicazione

- Statistiche rapide (totale tecniche, gallery items, news, etc.)
- Attività recenti (ultimi contenuti modificati)
- Quick actions (aggiungi tecnica, carica foto, etc.)
- Stato del sistema (storage utilizzato, numero utenti, etc.)

### 2. Gestione Contenuti per Collection

#### 2.1 Tecniche (`techniques`)
- Lista filtrata per gruppo Gokyo
- Ricerca per nome/kanji
- Form di editing con:
  - Nome, kanji, romaji, group
  - Descrizione, key_points (rich text)
  - Upload immagine (.webp)
  - Video URL (YouTube)
  - Tags multipli
- Anteprima card come appare nell'app
- Bulk actions (elimina, cambia gruppo)

#### 2.2 Dizionario (`dictionary`)
- Lista paginata con ricerca
- Form con editor HTML per descrizione
- Import/export CSV per modifiche massive

#### 2.3 Galleria (`gallery`)
- Grid view con thumbnail
- Upload multiplo immagini
- Form con:
  - Titolo, descrizione
  - Tipo (photo/video)
  - Upload immagine o YouTube URL
  - Data, link esterno
- Drag & drop per upload
- Anteprima in-line

#### 2.4 Bacheca/News (`bacheca`)
- Lista cronologica
- Editor WYSIWYG per contenuto
- Gestione allegati
- Stato pubblicazione (draft/published)
- Scheduling (data pubblicazione)

#### 2.5 Community/Eventi (`community`)
- Calendario view per eventi
- Form con date inizio/fine
- Upload locandina evento
- Gestione iscrizioni (opzionale)

#### 2.6 Kata (`kata`)
- Lista gerarchica (gruppi)
- Form con video embed
- Gestione sequenze tecniche

#### 2.7 FIJLKAM & Storia
- Timeline editor visuale
- Gestione items ordinati
- Upload documenti/regolamenti
- Rich text editor per contenuti lunghi

#### 2.8 Programmi d'Esame (`exam_program`)
- Organizzati per DAN level
- Editor strutturato per sezioni
- Preview formattata

#### 2.9 Kaeshi Renraku (`kaeshi_renraku`)
- Lista filtrata per tipo/categoria/difficoltà
- Form con campi tecnica "da" e "a"
- Editor per key points

### 3. Gestione Media

**Obiettivo**: Centralizzare la gestione di immagini e file

- Media library with preview
- Upload multiplo con progress
- Ottimizzazione automatica immagini (resize, compress)
- Organizzazione in cartelle/tags
- Search e filtri per tipo/data
- Eliminazione batch con conferma

### 4. Sistema di Autenticazione e Permessi

**Obiettivo**: Sicurezza e controllo accessi

#### Metodi di Autenticazione

1. **Email/Password**: Login tradizionale con credenziali
2. **OAuth2 Providers**: Autenticazione federata con:
   - **Google** (Gmail/Google Workspace)
   - **Microsoft** (Outlook/Azure AD)
   - **Facebook**
3. **Fallback Admin**: Account admin locale per emergenze

#### Autorizzazioni e Ruoli

- Ruoli: Admin, Editor, Viewer
- Permissions granulari per collection
- Audit log (chi ha modificato cosa e quando)
- Session management con timeout
- 2FA opzionale per account critici

### 5. Utilità e Tools

- **Import/Export**: CSV/JSON per backup e migrazione dati
- **Bulk Operations**: Modifica multipla record
- **Search Globale**: Ricerca full-text attraverso tutte le collections
- **Preview Mode**: Visualizza come appare nell'app prima di salvare
- **Backup Manager**: Snapshot del database su richiesta

## Implementazione Tecnica

### Struttura delle Route

```
/gestione
  /
    → Dashboard
  /login
    → Login form
  /techniques
    → Lista tecniche
    /[id]
      → Edit tecnica
    /new
      → Nuova tecnica
  /gallery
    → Media library grid
    /[id]
      → Edit gallery item
    /upload
      → Upload multiplo
  /dictionary
    → Lista termini
  /bacheca
    → Lista news
  /community
    → Calendario eventi
  /kata
    → Lista kata
  /fijlkam
    → Gestione FIJLKAM content
  /exam-program
    → Programmi per DAN
  /kaeshi-renraku
    → Lista contri/combinazioni
  /settings
    → Configurazioni app
  /users
    → Gestione utenti admin
```

### Componenti Riusabili

#### `DataTable.tsx`
Tabella generica con:
- Sorting
- Filtering
- Pagination
- Bulk select
- Actions column

#### `RichTextEditor.tsx`
Editor WYSIWYG con:
- Formatting tools
- Image embed
- Link insertion
- HTML preview

#### `MediaUploader.tsx`
Upload component con:
- Drag & drop zone
- Progress bar
- Preview thumbnails
- Validation

#### `FormBuilder.tsx`
Form generator dinamico da schema:
- Text, textarea, select, date inputs
- Image upload field
- Rich text field
- Relational picker

#### `PreviewModal.tsx`
Modale per anteprima contenuto come appare nell'app

### Integrazione con PocketBase

#### Autenticazione

```typescript
// ~/lib/pocketbase-admin.ts
import PocketBase from 'pocketbase';

export const pbAdmin = new PocketBase('http://127.0.0.1:8090');

// Traditional Email/Password Login
export const loginAdmin = async (email: string, password: string) => {
  try {
    const authData = await pbAdmin.admins.authWithPassword(email, password);
    return { success: true, admin: authData.admin };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// OAuth2 Login
export const loginWithOAuth2 = async (provider: 'google' | 'microsoft' | 'facebook') => {
  try {
    // Get available OAuth2 providers
    const authMethods = await pbAdmin.collection('users').listAuthMethods();

    // Find the provider config
    const providerConfig = authMethods.authProviders.find(p => p.name === provider);

    if (!providerConfig) {
      return { success: false, error: `Provider ${provider} non configurato` };
    }

    // Redirect to OAuth2 provider
    const redirectUrl = `${window.location.origin}/gestione/auth/callback`;
    const authUrl = `${providerConfig.authUrl}${redirectUrl}`;

    // Store provider for callback
    localStorage.setItem('oauth_provider', provider);

    // Redirect to provider
    window.location.href = authUrl;

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// OAuth2 Callback Handler
export const handleOAuth2Callback = async (code: string, state: string) => {
  try {
    const provider = localStorage.getItem('oauth_provider');

    if (!provider) {
      throw new Error('Provider non trovato');
    }

    // Exchange code for token
    const authData = await pbAdmin.collection('users').authWithOAuth2Code(
      provider,
      code,
      '',  // codeVerifier (not needed for server-side flow)
      `${window.location.origin}/gestione/auth/callback`
    );

    // Check if user has admin role
    if (!authData.record.role || authData.record.role !== 'admin') {
      pbAdmin.authStore.clear();
      throw new Error('Accesso negato: permessi insufficienti');
    }

    localStorage.removeItem('oauth_provider');

    return { success: true, user: authData.record };
  } catch (err) {
    localStorage.removeItem('oauth_provider');
    return { success: false, error: err.message };
  }
};

export const isAdminAuthenticated = () => {
  return pbAdmin.authStore.isValid;
};

export const logoutAdmin = () => {
  pbAdmin.authStore.clear();
  localStorage.removeItem('oauth_provider');
};

// Get current admin user
export const getCurrentAdmin = () => {
  return pbAdmin.authStore.model;
};

// Get auth method used
export const getAuthMethod = () => {
  const user = pbAdmin.authStore.model;
  if (!user) return null;

  // Check if user has OAuth data
  if (user.provider) {
    return `oauth_${user.provider}`;
  }

  return 'email_password';
};
```

#### CRUD Operations

```typescript
// ~/lib/collections-api.ts
import { pbAdmin } from '~/lib/pocketbase-admin';

export const getRecords = async (collection: string, options = {}) => {
  return await pbAdmin.collection(collection).getFullList({
    sort: '-created',
    ...options,
  });
};

export const getRecord = async (collection: string, id: string) => {
  return await pbAdmin.collection(collection).getOne(id);
};

export const createRecord = async (collection: string, data: any) => {
  return await pbAdmin.collection(collection).create(data);
};

export const updateRecord = async (collection: string, id: string, data: any) => {
  return await pbAdmin.collection(collection).update(id, data);
};

export const deleteRecord = async (collection: string, id: string) => {
  return await pbAdmin.collection(collection).delete(id);
};

export const uploadFile = async (collection: string, id: string, field: string, file: File) => {
  const formData = new FormData();
  formData.append(field, file);
  return await pbAdmin.collection(collection).update(id, formData);
};
```

#### Real-time Updates (Opzionale)

```typescript
// Subscribe to changes for live updates
export const subscribeToCollection = (
  collection: string,
  callback: (data: any) => void
) => {
  pbAdmin.collection(collection).subscribe('*', callback);
};

export const unsubscribeFromCollection = (collection: string) => {
  pbAdmin.collection(collection).unsubscribe('*');
};
```

### Middleware di Protezione

```typescript
// ~/middleware/admin-auth.ts
import { type RequestHandler } from '@builder.io/qwik-city';
import { isAdminAuthenticated } from '~/lib/pocketbase-admin';

export const onRequest: RequestHandler = async ({ redirect, url }) => {
  const isAuthRoute = url.pathname === '/gestione/login';
  const isAuthenticated = isAdminAuthenticated();

  if (!isAuthenticated && !isAuthRoute) {
    throw redirect(302, '/gestione/login');
  }

  if (isAuthenticated && isAuthRoute) {
    throw redirect(302, '/gestione');
  }
};
```

## UI/UX Design

### Principi di Design

1. **Semplicità**: Interfaccia pulita senza elementi superflui
2. **Efficienza**: Azioni comuni accessibili in 1-2 click
3. **Feedback Visivo**: Conferme, errori e successi chiari
4. **Responsività**: Funziona su desktop e tablet
5. **Dark Mode**: Supporto tema scuro per comfort visivo

### Layout

```
┌─────────────────────────────────────────────────┐
│ Header: JudoOK Gestione | User Menu            │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │         Main Content Area           │
│          │                                      │
│ • Home   │  ┌────────────────────────────┐     │
│ • Tech   │  │                            │     │
│ • Dict   │  │  Page Content              │     │
│ • Kata   │  │  (Dashboard, List, Form)   │     │
│ • Gall   │  │                            │     │
│ • Bach   │  └────────────────────────────┘     │
│ • Comm   │                                      │
│ • FIJL   │                                      │
│ • Exam   │                                      │
│ • K-R    │                                      │
│ ───────  │                                      │
│ • Media  │                                      │
│ • Users  │                                      │
│ • Settings                                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Color Scheme

- **Primary**: Blue #3b82f6 (azioni principali)
- **Success**: Green #10b981 (conferme, salvataggio)
- **Warning**: Yellow #f59e0b (attenzione)
- **Danger**: Red #ef4444 (eliminazione, errori)
- **Neutral**: Gray scale per background e testo

## Security Considerations

### 1. Autenticazione e Autorizzazione

- **Admin-only Access**: Solo utenti con ruolo admin possono accedere
- **OAuth2 Security**: Token exchange sicuro, no credential exposure
- **Session Timeout**: 2 ore di inattività → logout automatico
- **CSRF Protection**: Token per form submissions
- **Password Policy**: Minimo 10 caratteri, complessità richiesta (solo per auth tradizionale)
- **Rate Limiting**: Limitazione tentativi login (email/password e OAuth)

### 2. Validazione Input

- **Client-side**: Validazione immediata per UX
- **Server-side**: Validazione obbligatoria in PocketBase rules
- **Sanitizzazione**: HTML sanitizer per rich text
- **File Upload**: Whitelist di estensioni, size limit (10MB)

### 3. Audit e Logging

- **Action Log**: Chi ha fatto cosa e quando
- **Change History**: Versionamento modifiche importanti
- **Failed Login Attempts**: Rate limiting e notifiche

### 4. Data Protection

- **Backup Automatici**: Snapshot giornalieri database
- **Soft Delete**: Cestino per recovery accidentali
- **Data Encryption**: Dati sensibili cifrati at rest

## Configurazione OAuth2 Providers

Per abilitare l'autenticazione con Google, Microsoft e Facebook, è necessario configurare i provider OAuth2 in PocketBase e nelle console developer dei rispettivi servizi.

### Setup PocketBase

1. Accedi al **PocketBase Admin UI** (`http://127.0.0.1:8090/_/`)
2. Vai su **Settings** → **Auth providers**
3. Abilita i provider desiderati

### 1. Google OAuth2

#### Step 1: Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita **Google+ API** e **People API**
4. Vai su **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configura il consenso screen:
   - **App name**: JudoOK Gestione
   - **User support email**: tua email
   - **Scopes**: `.../auth/userinfo.email`, `.../auth/userinfo.profile`
6. Crea OAuth client:
   - **Application type**: Web application
   - **Name**: JudoOK Admin
   - **Authorized JavaScript origins**: `http://localhost:3000`, `https://tuodominio.com`
   - **Authorized redirect URIs**:
     - `http://127.0.0.1:8090/api/oauth2-redirect`
     - `http://localhost:3000/gestione/auth/callback`
     - `https://tuodominio.com/gestione/auth/callback`
7. Copia **Client ID** e **Client Secret**

#### Step 2: PocketBase Configuration

1. Vai su PocketBase Admin → **Settings** → **Auth providers** → **Google**
2. Abilita il provider
3. Inserisci **Client ID** e **Client Secret** da Google Cloud Console
4. Salva

### 2. Microsoft OAuth2 (Azure AD)

#### Step 1: Azure Portal

1. Vai su [Azure Portal](https://portal.azure.com/)
2. Vai su **Azure Active Directory** → **App registrations** → **New registration**
3. Configura:
   - **Name**: JudoOK Gestione
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**:
     - Platform: Web
     - URI: `http://127.0.0.1:8090/api/oauth2-redirect`
4. Registra l'applicazione
5. Copia **Application (client) ID**
6. Vai su **Certificates & secrets** → **New client secret**
   - **Description**: PocketBase Auth
   - **Expires**: 24 months (o Custom)
7. Copia il **Value** del secret (sarà visibile solo ora!)
8. Vai su **API permissions** → **Add a permission** → **Microsoft Graph**
   - Aggiungi: `User.Read`, `email`, `profile`, `openid`
9. Vai su **Authentication** → **Add a platform** → **Web**
   - Aggiungi redirect URIs per produzione

#### Step 2: PocketBase Configuration

1. Vai su PocketBase Admin → **Settings** → **Auth providers** → **Microsoft**
2. Abilita il provider
3. Inserisci:
   - **Client ID**: Application (client) ID da Azure
   - **Client Secret**: Secret value da Azure
   - **Tenant**: `common` (per personal + organizational accounts)
4. Salva

### 3. Facebook OAuth2

#### Step 1: Facebook Developers

1. Vai su [Facebook Developers](https://developers.facebook.com/)
2. Crea una nuova app o seleziona esistente
3. Vai su **Settings** → **Basic**
4. Aggiungi **Facebook Login** come product
5. Vai su **Facebook Login** → **Settings**
6. Configura **Valid OAuth Redirect URIs**:
   - `http://127.0.0.1:8090/api/oauth2-redirect`
   - `http://localhost:3000/gestione/auth/callback`
   - `https://tuodominio.com/gestione/auth/callback`
7. Salva le modifiche
8. Torna su **Settings** → **Basic**
9. Copia **App ID** e **App Secret**

#### Step 2: PocketBase Configuration

1. Vai su PocketBase Admin → **Settings** → **Auth providers** → **Facebook**
2. Abilita il provider
3. Inserisci:
   - **Client ID**: App ID da Facebook
   - **Client Secret**: App Secret da Facebook
4. Salva

### Implementazione UI - Login Page

```typescript
// ~/routes/gestione/login/index.tsx
import { component$, $ } from '@builder.io/qwik';
import { loginAdmin, loginWithOAuth2 } from '~/lib/pocketbase-admin';

export default component$(() => {
  const handleEmailLogin = $(async (email: string, password: string) => {
    const result = await loginAdmin(email, password);
    if (result.success) {
      // Redirect to dashboard
      window.location.href = '/gestione';
    } else {
      // Show error
      alert(result.error);
    }
  });

  const handleOAuthLogin = $(async (provider: 'google' | 'microsoft' | 'facebook') => {
    await loginWithOAuth2(provider);
  });

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            JudoOK Gestione
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Accedi al pannello di amministrazione
          </p>
        </div>

        {/* OAuth Buttons */}
        <div class="space-y-3">
          <button
            onClick$={() => handleOAuthLogin('google')}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              {/* Google Icon SVG */}
            </svg>
            <span class="font-medium text-gray-700 dark:text-gray-200">
              Continua con Google
            </span>
          </button>

          <button
            onClick$={() => handleOAuthLogin('microsoft')}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              {/* Microsoft Icon SVG */}
            </svg>
            <span class="font-medium text-gray-700 dark:text-gray-200">
              Continua con Microsoft
            </span>
          </button>

          <button
            onClick$={() => handleOAuthLogin('facebook')}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              {/* Facebook Icon SVG */}
            </svg>
            <span class="font-medium text-gray-700 dark:text-gray-200">
              Continua con Facebook
            </span>
          </button>
        </div>

        {/* Divider */}
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">oppure</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form
          preventdefault:submit
          onSubmit$={(e) => {
            const formData = new FormData(e.target as HTMLFormElement);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            handleEmailLogin(email, password);
          }}
          class="space-y-4"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
});
```

### OAuth Callback Route

```typescript
// ~/routes/gestione/auth/callback/index.tsx
import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { handleOAuth2Callback } from '~/lib/pocketbase-admin';

export default component$(() => {
  const loc = useLocation();

  useVisibleTask$(async () => {
    const code = loc.url.searchParams.get('code');
    const state = loc.url.searchParams.get('state');

    if (code && state) {
      const result = await handleOAuth2Callback(code, state);

      if (result.success) {
        // Redirect to dashboard
        window.location.href = '/gestione';
      } else {
        // Redirect to login with error
        window.location.href = `/gestione/login?error=${encodeURIComponent(result.error)}`;
      }
    } else {
      // Invalid callback
      window.location.href = '/gestione/login?error=invalid_callback';
    }
  });

  return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Autenticazione in corso...</p>
      </div>
    </div>
  );
});
```

### Best Practices

1. **Ambiente di Sviluppo**: Usa redirect URIs localhost per testing
2. **Produzione**: Configura redirect URIs con HTTPS obbligatorio
3. **Scopes Minimi**: Richiedi solo permessi necessari (email, profile)
4. **Error Handling**: Gestisci errori di autenticazione con messaggi chiari
5. **Fallback**: Mantieni sempre autenticazione email/password come fallback
6. **User Mapping**: Assicurati che gli utenti OAuth abbiano il campo `role` impostato a `admin`
7. **Testing**: Testa tutti i provider in ambiente staging prima del deploy

### Troubleshooting Comuni

**Google**:
- Errore "redirect_uri_mismatch" → Verifica che URI in Google Cloud Console corrisponda esattamente
- Errore "access_denied" → Utente ha rifiutato permessi

**Microsoft**:
- Errore "AADSTS50011" → Redirect URI non configurato in Azure
- Errore "invalid_client" → Client Secret scaduto o errato

**Facebook**:
- Errore "Can't Load URL" → Redirect URI non in whitelist
- App in "Development Mode" → Solo admin/developer/tester possono autenticarsi

## Roadmap di Implementazione

### Fase 1: MVP (2-3 settimane)
- [ ] Setup route `/gestione` con middleware auth
- [ ] Login page con email/password
- [ ] Configurazione OAuth2 providers (Google, Microsoft, Facebook)
- [ ] OAuth callback handler e redirect logic
- [ ] Dashboard basilare con statistiche
- [ ] CRUD completo per Techniques
- [ ] Media uploader per immagini

### Fase 2: Core Features (2 settimane)
- [ ] CRUD per Dictionary, Kata, Gallery
- [ ] Rich text editor integrato
- [ ] Search globale
- [ ] Bulk operations

### Fase 3: Advanced Features (1-2 settimane)
- [ ] CRUD per tutte le collections rimanenti
- [ ] Media library completa
- [ ] Import/Export CSV/JSON
- [ ] Preview mode

### Fase 4: Polish & Optimization (1 settimana)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Mobile responsive
- [ ] Documentazione utente

## Testing Strategy

### Unit Tests
- Utility functions
- Form validation logic
- API call wrappers

### Integration Tests
- PocketBase API integration
- File upload flow
- Authentication flow (email/password)
- OAuth2 flow (Google, Microsoft, Facebook)
- Token refresh e session management

### E2E Tests
- Login tradizionale → Dashboard → CRUD operations → Logout
- OAuth login (per ogni provider) → Dashboard → Logout
- File upload → Media library → Delete
- Bulk operations
- Error handling OAuth (denied permissions, invalid state)

## Metriche di Successo

- **Performance**: Caricamento pagine < 1s
- **Usabilità**: Task completion rate > 95%
- **Affidabilità**: Uptime > 99.9%
- **Sicurezza**: Zero vulnerabilità critiche
- **Autenticazione OAuth**: Tasso di successo login > 98%, tempo medio login < 5s
- **Adozione OAuth**: Preferenza utenti OAuth vs tradizionale (target: > 60%)

## Alternative Considerate

### 1. Usare PocketBase Admin UI direttamente
**Pro**: Zero sviluppo necessario
**Contro**: Non personalizzabile, UX non ottimizzata per il caso d'uso specifico

### 2. CMS Headless esterno (Strapi, Directus)
**Pro**: Feature-rich out of the box
**Contro**: Complessità aggiuntiva, costi hosting separati

### 3. Custom Backend + Admin Panel
**Pro**: Controllo totale
**Contro**: Overhead di sviluppo e manutenzione eccessivo

**Scelta: Gestione personalizzata su PocketBase** offre il miglior bilanciamento tra semplicità, flessibilità e integrazione.

## Conclusioni

Gestione sarà un'interfaccia admin leggera ma potente che:
- Semplifica la gestione dei contenuti per gli amministratori
- Si integra nativamente con PocketBase
- Fornisce un'esperienza d'uso ottimizzata per il dominio Judo
- Offre autenticazione moderna e sicura (email/password + OAuth2)
- Mantiene un'architettura semplice e manutenibile
- Garantisce sicurezza e affidabilità

L'implementazione incrementale (MVP → Full Features) permette di validare l'approccio e iterare basandosi sul feedback reale degli utilizzatori.

---

**Next Steps**:
1. Review e approvazione del POC
2. Setup iniziale `/gestione/login` e middleware
3. Implementazione Dashboard MVP
4. Iterazione su feedback

---

# migrazione.md

1. Inizializzazione del Progetto Qwik
Poiché la struttura è sostanzialmente diversa, ti consiglio di creare un nuovo progetto Qwik e copiare progressivamente il codice.

Esegui npm create qwik@latest in una nuova cartella.
Scegli "Basic App (Qwik City)".
Copia le cartelle src/assets e la configurazione di Tailwind (se personalizzata) nel nuovo progetto.
Installa le dipendenze necessarie: npm install pocketbase sql.js.
2. Migrazione del Routing (Qwik City)
React Router (src/App.jsx) usa una definizione dichiarativa delle rotte. Qwik City usa il routing basato sui file (come Next.js). Dovrai creare la struttura delle cartelle dentro src/routes:

Rotta React (App.jsx)	Nuovo File Qwik (src/routes/...)
/ (Home)	src/routes/index.tsx
/dizionario	src/routes/dizionario/index.tsx
/kata/:slug	src/routes/kata/[slug]/index.tsx
/fijlkam	src/routes/fijlkam/index.tsx
... e così via per tutte le altre pagine.	
3. Migrazione dei Componenti
I componenti React devono essere convertiti in componenti Qwik (.tsx).

Sintassi: Avvolgi il componente con component$.
// React
export default function MyComp() { ... }

// Qwik
import { component$ } from '@builder.io/qwik';
export default component$(() => { ... });
Gestione Eventi: Usa il suffisso $ per gli eventi.
onClick={handleClick} diventa onClick$={handleClick}.
Stato Locale:
useState diventa useSignal (per valori primitivi) o useStore (per oggetti).
Nota: Con useSignal, accedi al valore con .value (es. count.value).
Effetti:
useEffect diventa useVisibleTask$ (se deve girare sul client) o useTask$ (se può girare anche sul server/prima del rendering).
4. Migrazione dello Stato (Zustand)
Zustand non è strettamente necessario in Qwik poiché useContext + useStore offrono una gestione dello stato globale molto performante e nativa.

Crea un file (es. src/state/global-store.ts) che esporta un contesto (createContextId).
Nel componente radice (src/routes/layout.tsx), inizializza lo store con useStore e forniscilo con useContextProvider.
Nei componenti figli, usa useContext per leggere e modificare lo stato.
5. Integrazione PocketBase e Data Fetching
In Qwik, il data fetching avviene preferibilmente lato server tramite i Route Loaders per sfruttare l'SSR (Server Side Rendering).

Invece di chiamare PocketBase dentro un useEffect nel componente:
// src/routes/dizionario/index.tsx
import { routeLoader$ } from '@builder.io/qwik-city';

export const useDictionaryData = routeLoader$(async () => {
  const pb = new PocketBase('...');
  const records = await pb.collection('dictionary').getFullList();
  return records;
});

export default component$(() => {
  const data = useDictionaryData();
  return <div>{data.value.map(...)}</div>
});
6. Tailwind CSS
Qwik supporta Tailwind nativamente. Se hai classi personalizzate in index.css o configurazioni in tailwind.config.js, copiale semplicemente nel nuovo progetto.

Vuoi che inizi a predisporre qualcosa?
Se vuoi, posso provare a convertire uno dei componenti o creare una struttura base per mostrarti come appare il codice convertito. Dimmi tu come preferisci procedere!
