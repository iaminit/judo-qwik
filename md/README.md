# 🥋 JudoOK - Portale Completo del Judo

**Versione**: 2.0  
**Ultimo aggiornamento**: 2 Gennaio 2026  
**Framework**: Qwik + PocketBase  
**Autore**: Roberto

---

## 📋 Indice

- [Panoramica](#-panoramica)
- [Tecnologie](#-tecnologie)
- [Struttura del Progetto](#-struttura-del-progetto)
- [Database](#-database)
- [Installazione](#-installazione)
- [Sviluppo](#-sviluppo)
- [Deployment](#-deployment)
- [Documentazione](#-documentazione)

---

## 🎯 Panoramica

**JudoOK** è un Content Management System (CMS) completo dedicato al Judo, che offre:

- 📚 **Database Gokyo no Waza** - Catalogo completo delle tecniche (113 tecniche)
- 🗣️ **Dizionario Terminologia** - Glossario giapponese-italiano con audio (429 termini)
- 🎴 **Sistema Kata** - Forme tradizionali del Judo con dettagli
- 📰 **Bacheca & News** - Sistema di gestione notizie ed eventi
- 🎮 **Strumenti Interattivi** - Quiz, Flash Cards, Gokyo Game, Gokyo-Tris
- 📖 **Storia del Judo** - Timeline storica con eventi chiave
- ⚙️ **Area Admin Completa** - Gestione contenuti, task, media

---

## 🛠️ Tecnologie

### Frontend
- **[Qwik](https://qwik.builder.io/)** v1.18.0 - Framework web ultra-performante con resumability
- **[Tailwind CSS](https://tailwindcss.com/)** v4.1.18 - Framework CSS utility-first
- **TypeScript** 5.4.5 - Type safety e autocompletamento
- **Vite** 7.2.6 - Build tool e dev server velocissimo

### Backend
- **[PocketBase](https://pocketbase.io/)** v0.26.5 - Backend as a Service con SQLite
- **SQLite** - Database embedded ad alte prestazioni
- **Mailgun** - Servizio email per notifiche task

### Librerie Principali
- **[Quill](https://quilljs.com/)** v2.0.3 - Rich text editor WYSIWYG
- **[@qwikdev/pwa](https://github.com/QwikDev/pwa)** - Progressive Web App support
- **sql.js** - SQLite compilato in WebAssembly

---

## 📁 Struttura del Progetto

```
judo-qwik/
│
├── 📂 src/                           # Codice sorgente frontend
│   ├── 📂 components/                # Componenti riutilizzabili
│   │   ├── admin/                    # Componenti area admin
│   │   │   ├── admin-task-list.tsx   # Lista task amministrativi
│   │   │   └── task-modal.tsx        # Modal gestione task
│   │   ├── blog-card/                # Card visualizzazione post
│   │   ├── blog-modal/               # Modal dettaglio post
│   │   ├── router-head/              # Meta tags e SEO
│   │   ├── search-modal/             # Modal ricerca globale (Cmd+K)
│   │   ├── technique-card/           # Card tecnica judo
│   │   └── term-card/                # Card termine dizionario
│   │
│   ├── 📂 routes/                    # Route dell'applicazione (file-based routing)
│   │   ├── index.tsx                 # Homepage
│   │   ├── layout.tsx                # Layout globale (header/sidebar/footer)
│   │   │
│   │   ├── 📂 api/                   # API endpoints
│   │   │   ├── email/                # Endpoints email (Mailgun)
│   │   │   └── send-task-reminder/   # Invio reminder task
│   │   │
│   │   ├── 📂 tecniche/              # Database tecniche Gokyo
│   │   ├── 📂 kata/                  # Catalogo Kata
│   │   ├── 📂 dizionario/            # Glossario terminologia
│   │   ├── 📂 bacheca/               # News & Eventi
│   │   ├── 📂 storia/                # Timeline storia Judo
│   │   ├── 📂 fijlkam/               # Info Federazione Italiana
│   │   ├── 📂 gallery/               # Galleria foto/video
│   │   ├── 📂 community/             # Archivio community
│   │   │
│   │   ├── 📂 quiz/                  # Quiz esami grado
│   │   ├── 📂 gokyo-game/            # Gioco Gokyo
│   │   ├── 📂 gokyo-tris/            # Tris Gokyo
│   │   ├── 📂 flash/                 # Flash Cards
│   │   │
│   │   └── 📂 gestione/              # Area amministrazione
│   │       ├── index.tsx             # Dashboard admin
│   │       ├── tecniche/             # CRUD tecniche
│   │       ├── kata/                 # CRUD kata
│   │       ├── dizionario/           # CRUD dizionario
│   │       ├── bacheca/              # CRUD bacheca
│   │       ├── storia/               # CRUD storia
│   │       ├── media/                # Media center
│   │       └── impostazioni/         # Settings
│   │
│   ├── 📂 context/                   # Context providers
│   │   └── app-context.ts            # Global state (dark mode, menu, etc.)
│   │
│   ├── 📂 lib/                       # Utility libraries
│   │   ├── pocketbase-admin.ts       # Client PocketBase con auth
│   │   └── error-parser.ts           # Parser errori PB in italiano
│   │
│   ├── 📂 hooks/                     # Custom React hooks
│   └── 📂 utils/                     # Funzioni utility
│
├── 📂 public/                        # Asset statici
│   ├── favicon.svg                   # Favicon principale
│   ├── manifest.json                 # PWA manifest
│   │
│   └── 📂 media/                     # Media organizzati
│       ├── 📂 audio/                 # 483 file MP3 (pronunce giapponesi)
│       ├── 📂 home/                  # 21 icone homepage
│       ├── 📂 icons/                 # 17 icone app/PWA
│       ├── 📂 bacheca/               # Immagini bacheca
│       └── [156 immagini tecniche]   # WebP, SVG, JPG
│
├── 📂 pb_data/                       # Database PocketBase
│   ├── data.db                       # DB principale (892 KB)
│   ├── auxiliary.db                  # DB ausiliario (30 MB)
│   ├── 📂 storage/                   # File caricati (304 KB)
│   └── 📂 backups/                   # Backup automatici (6.3 MB)
│
├── 📂 pb_migrations/                 # Migrazioni database (34 file)
│   └── [timestamp]_*.js              # Script migrazione collection
│
├── 📂 md/                            # Documentazione tecnica
│   ├── MAILGUN_INTEGRATION.md        # Setup Mailgun
│   ├── MAILGUN_SETUP.md              # Configurazione email
│   └── progetto_todo.md              # Piano progetto e roadmap
│
├── 📄 pb-server                      # Eseguibile PocketBase (34 MB)
├── 📄 package.json                   # Dipendenze e scripts
├── 📄 tsconfig.json                  # Configurazione TypeScript
├── 📄 vite.config.ts                 # Configurazione Vite
├── 📄 tailwind.config.js             # Configurazione Tailwind
├── 📄 .env                           # Variabili ambiente (gitignored)
└── 📄 README.md                      # Questo file
```

---

## 🗄️ Database

### Architettura

PocketBase utilizza **SQLite** con due database separati:

#### 1. `data.db` (892 KB)
Database principale contenente:
- Utenti e autenticazione
- Configurazioni sistema
- Metadata collection
- Superuser admin

#### 2. `auxiliary.db` (30 MB)
Database ausiliario con i dati delle collection:
- `tecniche` (113 record) - Tecniche Gokyo no Waza
- `dizionario` (429 record) - Terminologia giapponese
- `kata_v2` (10 record) - Forme tradizionali
- `bacheca` (4 record) - News ed eventi
- `storia` (33 record) - Timeline storica
- `galleria` (2 record) - Foto e video
- `fijlkam` - Programmi esami
- `domande_quiz` - Domande quiz
- `task_admin` - Task amministrativi
- `livelli_dan` (9 record) - Gradi Kyu/Dan
- `categorie` (8 record) - Categorie universali

### Schema Base Unificato v2.0

Tutte le collection principali condividono **35 campi comuni**:

**Campi Core**:
- `titolo`, `titolo_secondario`, `slug`, `contenuto`
- `descrizione_breve`, `tags`
- `categoria_principale`, `categoria_secondaria`
- `ordine`, `livello`, `anno`

**Media**:
- `immagine_principale`, `audio`, `video_id`, `file_allegato`

**Metadata**:
- `data_riferimento`, `data_inizio`, `data_fine`
- `pubblicato`, `in_evidenza`
- `autore_id`, `created`, `updated`

---

## ⚙️ Installazione

### Prerequisiti

- **Node.js** ≥ 18.17.0 o ≥ 20.3.0 o ≥ 21.0.0
- **npm** o **pnpm**

### Setup

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd judo-qwik
   ```

2. **Installa dipendenze**
   ```bash
   npm install
   ```

3. **Configura variabili ambiente**

   Crea file `.env` dalla copia di esempio:
   ```bash
   cp .env.example .env
   ```

   Modifica `.env` con le tue credenziali:
   ```env
   VITE_PB_URL=http://127.0.0.1:8090
   MAILGUN_API_KEY=your_mailgun_api_key_here
   MAILGUN_DOMAIN=your_mailgun_domain_here
   MAILGUN_FROM_EMAIL=your_email@example.com
   MAILGUN_FROM_NAME=JudoOK Admin
   ADMIN_EMAIL=admin@example.com
   ```

4. **Scarica e avvia PocketBase**

   **Opzione A - Usando lo script (consigliato)**:
   ```bash
   # Lo script scarica PocketBase automaticamente se non presente
   ./start-pocketbase.sh
   ```

   **Opzione B - Docker** (se hai Docker installato):
   ```bash
   docker compose up -d pocketbase
   ```

   **Opzione C - Manuale**:
   ```bash
   # Scarica PocketBase per il tuo OS da: https://pocketbase.io/docs/
   # Estrai l'eseguibile nella root del progetto
   chmod +x pocketbase
   ./pocketbase serve --http=127.0.0.1:8090
   ```

   Al primo avvio, crea un admin su: `http://127.0.0.1:8090/_/`

5. **Avvia dev server** (in un'altra finestra del terminale)
   ```bash
   npm run dev
   ```

   App disponibile su: `http://localhost:5173/`

---

## 🚀 Sviluppo

### Scripts Disponibili

```bash
npm run dev          # Avvia dev server (SSR mode)
npm run build        # Build produzione
npm run preview      # Preview build produzione
npm run lint         # Linting ESLint
npm run fmt          # Formatta codice (Prettier)
npm run fmt.check    # Verifica formattazione
```

### Workflow di Sviluppo

1. **Modifiche Frontend**: Edita file in `src/routes/` o `src/components/`
2. **Hot Reload**: Vite rileva automaticamente le modifiche
3. **Modifiche Database**: Usa PocketBase Admin UI su `http://127.0.0.1:8090/_/`
4. **Nuove Collection**: Crea migration con PocketBase SDK

### Aggiungere una Nuova Route

Qwik usa **file-based routing**:

```tsx
// src/routes/nuova-pagina/index.tsx
import { component$ } from '@builder.io/qwik';

export default component$(() => {
  return <div>Nuova Pagina</div>;
});
```

La route sarà automaticamente disponibile su `/nuova-pagina/`.

---

## 📦 Deployment

### Build Produzione

```bash
npm run build
```

### PocketBase in Produzione

1. **Copia file necessari**:
   - `pb-server` (eseguibile)
   - `pb_data/` (database)
   - `pb_migrations/` (migrazioni)

2. **Avvia su server**:
   ```bash
   ./pb-server serve --http="0.0.0.0:8090"
   ```

3. **Reverse Proxy** (Nginx/Caddy)
   ```nginx
   location /api/ {
       proxy_pass http://127.0.0.1:8090;
   }
   ```

### Hosting Suggerito

- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Backend (PocketBase)**: VPS (DigitalOcean, Hetzner), Railway, Fly.io
- **Database**: Incluso in PocketBase (SQLite)

---

## 🎨 Features Principali

### 🌓 Dark Mode
- Persistente con localStorage
- Rispetta preferenza sistema
- Toggle in header

### 🔍 Ricerca Globale
- Shortcut: `Cmd/Ctrl + K`
- Ricerca cross-collection
- Risultati in tempo reale

### 📱 Responsive
- Mobile-first design
- Bottom navigation su mobile
- Hamburger menu con sidebar

### ⚡ Performance
- SSR (Server-Side Rendering)
- Lazy loading componenti
- Prefetching Qwik
- Immagini WebP ottimizzate

### 🔐 Autenticazione
- Login admin con email/password
- OAuth2 support (opzionale)
- Session management PocketBase

---

## 📊 Statistiche Progetto

- **Linee di Codice Frontend**: ~8000 righe TSX
- **Componenti**: 25+ componenti riutilizzabili
- **Routes**: 18 pubbliche + 10 admin
- **Collection Database**: 12 attive
- **Immagini**: 156 file WebP/SVG
- **Audio**: 483 file MP3 (pronunce)
- **Video**: 3 file MP4
- **PDF**: 2 regolamenti
- **Totale Assets**: ~104 MB

---

## 🧪 Testing

**TODO**: Implementare testing suite

- [ ] Unit tests (Vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Lighthouse audit >90

---

## 📚 Documentazione

### File Documentazione

- **`README.md`** - Questo file (overview generale)
- **`md/progetto_todo.md`** - Roadmap e piano sviluppo
- **`md/MAILGUN_INTEGRATION.md`** - Setup sistema email
- **`md/MAILGUN_SETUP.md`** - Configurazione Mailgun

### Risorse Esterne

- [Qwik Documentation](https://qwik.builder.io/docs/)
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🤝 Contribuire

**Workflow**:
1. Fork del progetto
2. Crea branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri Pull Request

---

## 📝 License

Questo progetto è proprietario. Tutti i diritti riservati.

---

## 🙏 Ringraziamenti

- **Jigoro Kano** - Fondatore del Judo
- **FIJLKAM** - Federazione Italiana Judo
- **Qwik Team** - Framework incredibile
- **PocketBase** - Backend semplice e potente

---

## 📧 Contatti

**Progetto**: JudoOK - Il Judo in Tasca  
**Versione Database**: v2.0 (Schema Unificato Italiano)  
**Ultima Migrazione**: 1 Gennaio 2026

---

**Made with ❤️ and 🥋 by Roberto**
