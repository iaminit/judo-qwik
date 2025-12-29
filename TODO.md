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
