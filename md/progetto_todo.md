# 📋 Judo Qwik - Piano Progetto Completo

**Progetto**: CMS Judo con Qwik + PocketBase
**Data ultimo aggiornamento**: 31 Dicembre 2025
**Versione**: 2.0 (Schema Base Unificato)

---

## 📊 STATO ATTUALE PROGETTO

### ✅ Completato al 100%

#### 1. Architettura Frontend
- [x] Setup Qwik City + Tailwind CSS
- [x] Routing file-based (16+ routes)
- [x] Layout globale con Header/Sidebar/Footer
- [x] Dark mode persistente (localStorage + system preference)
- [x] SearchModal globale con keyboard shortcuts (Cmd+K)
- [x] Responsive mobile (Bottom nav + Drawer menu)

#### 2. Componenti Core
- [x] TechniqueCard, TermCard, BlogCard, BlogModal
- [x] RichTextEditor con preview toggle
- [x] AdminTaskList con gestione task italiana
- [x] Media uploader (immagini, audio, PDF)

#### 3. Backend & Database
- [x] PocketBase 0.26+ configurato (http://127.0.0.1:8090)
- [x] 10+ collection operative (techniques, dictionary, kata, post, gallery, history, quiz_questions, etc.)
- [x] Sistema autenticazione admin (email + OAuth2)
- [x] Upload file media (immagini WebP, audio MP3, PDF)
- [x] Error parser italiano per messaggi chiari

#### 4. Area Gestione (Admin)
- [x] Dashboard con statistiche real-time
- [x] CRUD completo per:
  - [x] Tecniche (techniques)
  - [x] Kata
  - [x] Dizionario (dictionary)
  - [x] Bacheca (post)
  - [x] Galleria (gallery)
  - [x] Storia (history + timeline)
  - [x] Programmi FIJLKAM
  - [x] Community/Utenti
  - [x] Impostazioni sistema
- [x] **Task amministrativi** con sollecito email (mailto:) ✅ (AGGIORNATO A SCHEMA ITALIANO)
- [x] Media center centralizzato
- [x] Bulk actions (selezione multipla + eliminazione massa)

#### 5. Pagine Pubbliche
- [x] Homepage con sezioni navigabili
- [x] `/tecniche` - Database Gokyo no Waza (filtri per gruppo/categoria)
- [x] `/kata` - Catalogo kata con dettaglio
- [x] `/dizionario` - Glossario terminologia giapponese (con audio)
- [x] `/storia` - Timeline storica del Judo
- [x] `/fijlkam` - Info federazione + regolamenti
- [x] `/bacheca` - News ed eventi
- [x] `/gallery` - Galleria foto/video
- [x] `/community` - Archivio community

#### 6. Giochi & Tools
- [x] `/quiz` - Quiz esami con scoring "Hansoku-make"
- [x] `/gokyo-game` - Gioco interattivo tecniche
- [x] `/gokyo-tris` - Tris Gokyo
- [x] `/flash` - Flash cards studio
- [x] `/kaeshi-renraku` - Contrattacchi e combinazioni

#### 7. Assets & Media
- [x] 149 immagini tecniche (WebP)
- [x] 489 file audio MP3 (pronunce giapponesi)
- [x] 40 icone custom
- [x] 3 video MP4
- [x] 2 PDF regolamenti
- **Totale**: ~104MB assets

---

## 🔄 MIGRAZIONE SCHEMA DATABASE v2.0 (IN CORSO ⏳)

### Stato Fasi Migrazione

**Data inizio**: 31 Dicembre 2025

| Fase | Descrizione | Stato | Record |
|------|-------------|-------|--------|
| Phase 1 | Tabelle Lookup (livelli_dan, categorie) | ✅ Completata | 17 record |
| Phase 2 | Collection Schema Unificato | ✅ Completata | 7 collection |
| Phase 3 | Migrazione Dati | ✅ Completata | 591 record |
| Phase 4 | Frontend Adaptation | ✅ Completata | 6 routes aggiornate |
| Phase 5 | Cleanup Old Collections | ⏳ Da fare | - |

### Dettaglio Phase 3 - Dati Migrati

| Collection Origine | Collection Destinazione | Record |
|-------------------|------------------------|--------|
| techniques | tecniche | 113 |
| dictionary | dizionario | 429 |
| post | bacheca | 4 |
| gallery | galleria | 2 |
| history + timeline_history | storia | 33 |
| kata | kata_v2 | 10 |

**Totale record migrati**: 591

### Nuove Collection Create

1. `livelli_dan` - Gradi Kyu/Dan (9 record)
2. `categorie` - Categorie universali (8 record)
3. `tecniche` - Schema unificato italiano
4. `kata_v2` - Schema unificato italiano
5. `dizionario` - Schema unificato italiano
6. `bacheca` - Schema unificato italiano
7. `galleria` - Schema unificato italiano
8. `storia` - Unifica history + timeline
9. `programmi_fijlkam` - Schema unificato italiano

**Riferimento completo**: Vedi `reorg.md`

---

## 📐 PIANO RIORGANIZZAZIONE COMPLETA DATABASE

### Strategia: Schema Base Unificato v2.0

**Documento**: `reorg.md`
**Stato**: Pianificato (da approvare)

#### Concetto
Tutte le collection principali condividono **35 campi comuni** (BaseRecord):

**Campi base**:
- `titolo`, `titolo_secondario`, `slug`, `contenuto`, `descrizione_breve`, `tags`
- `immagine_principale`, `audio`, `video_id`, `file_allegato`
- `categoria_principale`, `ordine`, `livello`, `anno`
- `data_riferimento`, `data_inizio`, `data_fine`
- `pubblicato`, `in_evidenza`, `autore_id`, `created`, `updated`

**Vantaggi**:
1. **Ricerca unificata** su tutti i contenuti (tecniche + kata + bacheca + dizionario)
2. **BaseForm component riutilizzabile** (1 form vs 9)
3. **Consistenza totale** (auditing, pubblicazione, metadati)
4. **Scalabilità** (nuove collection = solo aggiungere config)

#### Struttura Proposta (16-17 Collection)

**Collection Principali** (schema base):
1. `tecniche` (ex techniques)
2. `kata`
3. `dizionario` (ex dictionary)
4. `bacheca` (ex post)
5. `galleria` (ex gallery)
6. `storia` (unifica history + timeline_history)
7. `programmi_fijlkam` (ex program)
8. `regolamenti_fijlkam` (NUOVO)
9. `info_fijlkam` (NUOVO)

**Sistema**:
10. `utenti` (ex users)
11. `impostazioni` (ex settings)
12. `task_admin` ✅ (FATTO!)

**Lookup Tables**:
13. `categorie` (universale con tipo_categoria discriminante)
14. `livelli_dan` (gradi judo)

**Join Tables**:
15. `tecniche_kata` (N:M)
16. `immagini_tecniche` (1:N)

**Opzionale**:
17. `indice_ricerca` (denormalizzato per performance)

#### Timeline Migrazione Completa

**Sprint 1 (8-10 ore)**: Schema + Migrazione Dati
- Definire BaseRecord in PocketBase
- Creare collection con campi base
- Script migrazione (techniques → tecniche, post → bacheca, etc.)
- Popolare lookup tables (categorie, livelli_dan)

**Sprint 2 (10-12 ore)**: Frontend Unificato
- BaseForm component
- Collection configs (src/lib/collection-configs.ts)
- Aggiornare routes gestione (usano BaseForm)
- Ricerca globale cross-collection

**Sprint 3 (6-8 ore)**: Ottimizzazioni + Testing
- Indice ricerca denormalizzato
- Performance tuning (query < 100ms)
- Test completi
- Deploy

**Totale stimato: 25-30 ore**

**Decisione necessaria**: Approvare strategia v2.0 o mantenere schema attuale?

---

## 🎯 PROSSIMI PASSI (Priorità)

### ⚡ Priorità ALTA (1-2 settimane)

#### 1. Decidere Strategia Database
- [ ] **Opzione A (Conservativo)**: Mantenere schema misto attuale
  - Pro: Nessun lavoro extra
  - Contro: Inconsistenza linguistica (techniques, post, dictionary)
- [ ] **Opzione B (Unificato - RACCOMANDATO)**: Migrare a schema base italiano
  - Pro: 100% coerente, ricerca globale, manutenibilità
  - Contro: 25-30 ore lavoro

#### 2. Asset Cleanup Tool
- [ ] Creare script identificazione file orfani in `/media`
- [ ] Comparare file sistema vs record PocketBase
- [ ] Report file non referenziati (da eliminare manualmente)
- [ ] Opzionale: integrazione in `/gestione/media`

#### 3. SEO & Meta Tags
- [ ] Aggiungere meta tags personalizzati per ogni route
- [ ] Open Graph tags (condivisione social)
- [ ] Sitemap.xml automatico
- [ ] Structured data JSON-LD (tecniche, kata, eventi)

#### 4. Testing Completo
- [ ] Test navigazione tutte le routes
- [ ] Test CRUD admin (create, update, delete)
- [ ] Test upload media (immagini, audio, PDF)
- [x] Test email task reminder (mailto: workflow)
- [ ] Test dark mode switching
- [ ] Test ricerca globale
- [ ] Test audio/video playback
- [ ] Test quiz scoring logic
- [ ] Lighthouse audit (Performance, SEO, Accessibility)

---

### 🔧 Priorità MEDIA (2-4 settimane)

#### 5. Form Creazione Task in Dashboard
- [ ] Modal/drawer per aggiungere task direttamente da `/gestione`
- [ ] Select utente assegnato (dropdown da collection users)
- [ ] Date picker per data_riferimento
- [ ] Toggle priorità e stato
- [ ] Checkbox in_evidenza

#### 6. Filtri Avanzati Admin
- [ ] Dashboard: filtri task per priorità/stato/utente/categoria
- [ ] Tecniche: filtri per gruppo + categoria + dan
- [ ] Bacheca: filtri per categoria + attività + data
- [ ] Galleria: filtri per tipo media + data

#### 7. Statistiche Dashboard
- [ ] Widget "Task in corso" vs "Completati"
- [ ] Grafico distribuzione priorità task
- [ ] Statistiche tecniche per categoria (già presente SVG chart)
- [ ] Ultimi post pubblicati
- [ ] Utenti attivi

#### 8. Categorie Task (Opzionale)
- [ ] Popolare tabella `categorie` con `tipo_categoria="task_admin"`
  - Didattica, Amministrativo, Manutenzione, FIJLKAM, Agonismo
- [ ] Aggiungere select categoria in form task
- [ ] Filtri dashboard per categoria

---

### 🚀 Priorità BASSA (Future)

#### 9. Notifiche Automatiche
- [ ] Cron job controllo `data_riferimento`
- [ ] Email automatica X giorni prima scadenza task
- [ ] Digest settimanale task aperti
- [ ] Notifiche push PWA (opzionale)

#### 10. Ricerca Avanzata
- [ ] Ricerca alfabetica A-Z (navigator con conteggi)
- [ ] Filtri combinati (es: tecniche I Kyo + Te Waza + 1° Dan)
- [ ] Ricerca vocale (Speech Recognition API)
- [ ] Cronologia ricerche recenti

#### 11. Export & Backup
- [ ] Export task completati in CSV/PDF
- [ ] Backup automatico database (cron settimanale)
- [ ] Export contenuti per stampa (programmi, kata, tecniche)
- [ ] Importazione bulk (CSV → PocketBase)

#### 12. Multi-tenancy (SE necessario)
- [ ] Sistema "palestre" con collection `palestre`
- [ ] Utenti appartengono a palestra
- [ ] Dati isolati per palestra
- [ ] Dashboard multi-palestra per federazione

#### 13. API Pubblica (SE richiesto)
- [ ] API REST per tecniche, kata, dizionario
- [ ] Rate limiting
- [ ] API key authentication
- [ ] Documentazione OpenAPI/Swagger

---

## 📝 TODO Tecnico (Debito Tecnico)

### Code Quality
- [ ] Aggiungere commenti JSDoc ai componenti principali
- [ ] Rimuovere console.log di debug in produzione
- [ ] Standardizzare error handling (try-catch uniforme)
- [ ] Aggiungere TypeScript interfaces per tutte le collection PocketBase

### Performance
- [ ] Lazy loading immagini con `loading="lazy"`
- [ ] Prefetch routes critiche (Qwik prefetchServiceWorker)
- [ ] Compressione immagini WebP (già fatto)
- [ ] Minimizzare bundle JavaScript (code splitting)

### Security
- [ ] Validazione input server-side (PocketBase rules)
- [ ] Rate limiting API endpoints
- [ ] CORS configurato correttamente
- [ ] CSP headers (Content Security Policy)
- [ ] Sanitizzazione HTML editor (evitare XSS)

### Accessibilità (a11y)
- [ ] ARIA labels su tutti gli interactive elements
- [ ] Focus management nei modal
- [ ] Keyboard navigation (Tab, Esc, Enter)
- [ ] Screen reader compatibility test
- [ ] Color contrast WCAG AA (verificare con tool)

---

## 🐛 Bug Conosciuti & Fix

### Da Verificare
- [ ] Audio player pronuncia dizionario: verificare fallback se file mancante
- [ ] Video YouTube embed: gestire video privati/rimossi
- [ ] Modal scroll lock su iOS Safari
- [ ] Dark mode flash durante SSR (FOUC)
- [ ] Upload file >5MB: mostrare errore prima di submit

### Risolti Recentemente ✅
- ✅ Task admin migrati a schema italiano
- ✅ Error parser PocketBase messaggi in italiano
- ✅ Bulk delete checkbox select all funzionante
- ✅ Preview rich text toggle sincronizzato

---

## 📚 Documentazione Progetto

### File Documentazione Mantenuti
- ✅ `README.md` - Introduzione progetto
- ✅ `reorg.md` - Piano riorganizzazione database v2.0 (PRIMARIO)
- ✅ `progetto_todo.md` - Questo file (stato e roadmap)

### Script Utili
Nessuno script temporaneo presente. Utilizzare i comandi npm standard e la dashboard PocketBase.

### Guide Riferimento
- PocketBase docs: https://pocketbase.io/docs/
- Qwik docs: https://qwik.builder.io/docs/
- Mailgun API: https://documentation.mailgun.com/

---

## 🎨 Design System

### Colori Principali
- **Primario**: `#ef4444` (Rosso judo)
- **Secondario**: `#1f2937` (Grigio scuro)
- **Accento**: `#10b981` (Verde successo)
- **Sfondo light**: `#ffffff`
- **Sfondo dark**: `#0f172a`

### Typography
- **Font primario**: System font stack (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Font heading**: Font-weight 900 (Black)
- **Font body**: Font-weight 400-600

### Spacing
- Padding cards: `p-4` → `p-6` (base → large)
- Gap grid: `gap-4` → `gap-8`
- Border radius: `rounded-2xl` (standard), `rounded-3xl` (large)

---

## 🔐 Credenziali & Setup

### Variabili Ambiente (.env)
```bash
VITE_PB_URL=http://127.0.0.1:8090
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.tuodominio.com
MAILGUN_FROM_EMAIL=noreply@judook.com
MAILGUN_FROM_NAME=JudoOK Admin
```

### PocketBase
- **Admin URL**: http://127.0.0.1:8090/_/
- **API Base**: http://127.0.0.1:8090/api/
- **Auth**: Email + password (admin creato al primo avvio)

### Deploy
- **Hosting suggerito**: Vercel/Netlify (frontend) + VPS (PocketBase backend)
- **Database**: SQLite (pb_data/data.db)
- **Media storage**: Locale (pb_data/storage) o S3-compatible

---

## 📊 Metriche Progetto

### Linee Codice
- **Frontend TSX**: ~8000 righe
- **Componenti**: 25+ componenti
- **Routes**: 18 routes pubbliche + 10 admin
- **Collection PocketBase**: 12 attive

### Assets
- **Immagini**: 149 WebP
- **Audio**: 489 MP3
- **Video**: 3 MP4
- **PDF**: 2 file
- **Icone**: 40 custom

### Performance (Target)
- **Lighthouse Score**: >90 (tutte categorie)
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Bundle Size**: <200KB (JS gzipped)

---

## 🚦 Decisioni da Prendere

### Critiche (Blockers)
1. **Schema database**: Unificato (v2.0) o Misto attuale?
   - Impatto: 25-30 ore lavoro vs 0 ore
   - Beneficio: Coerenza totale vs Status quo

### Importanti
2. **Multi-tenancy**: Necessario per gestire più palestre?
3. **API pubblica**: Serve esporre dati via REST API?
4. **PWA offline**: Implementare cache completo per app offline?

### Opzionali
5. **Notifiche push**: Utili per task/eventi?
6. **Esportazione dati**: CSV/PDF necessari?
7. **Analytics**: Google Analytics o alternativa privacy-friendly (Plausible)?

---

## 🎓 Lezioni Apprese

### Cosa ha Funzionato Bene
- ✅ Qwik SSR performante (route loaders veloci)
- ✅ PocketBase semplice da usare (CRUD + auth integrato)
- ✅ Tailwind CSS + dark mode (implementation rapida)
- ✅ Schema unificato task_admin (best practice confermata)

### Da Migliorare
- ⚠️ Documentazione inline componenti (aggiungere JSDoc)
- ⚠️ Testing automatizzato (zero unit test al momento)
- ⚠️ Type safety PocketBase (generare types automatici)

---

## 📅 Roadmap Timeline Suggerita

### Gennaio 2025 (Sprint 1-2)
- ✅ Completare migrazione task_admin
- [ ] Decidere schema database (unificato o misto)
- [ ] Asset cleanup tool
- [ ] Testing completo esistente

### Febbraio 2025 (Sprint 3-4)
- [ ] SEO & meta tags
- [ ] Form creazione task dashboard
- [ ] Filtri avanzati admin
- [ ] Lighthouse >90 tutte pagine

### Marzo 2025 (Sprint 5-6)
- [ ] Statistiche dashboard avanzate
- [ ] (Opzionale) Migrazione schema unificato se approvato
- [ ] Export/backup tools
- [ ] Documentazione utente finale

### Q2 2025 (Aprile-Giugno)
- [ ] Notifiche automatiche task
- [ ] Ricerca vocale
- [ ] PWA offline completo
- [ ] (Opzionale) API pubblica

---

**Fine Documento - Progetto TODO Completo**

Per modifiche o domande, aggiornare questo file mantenendolo come singola fonte di verità per stato e roadmap progetto.

**Prossima revisione consigliata**: Fine Gennaio 2025
