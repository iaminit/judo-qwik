# 🥋 Judo Qwik - CMS Didattico

CMS completo per la gestione di contenuti didattici sul Judo, costruito con **Qwik City** + **PocketBase** + **Tailwind CSS**.

---

## 📚 Documentazione Progetto

### File Principali
- **[progetto_todo.md](progetto_todo.md)** - 📋 Stato progetto completo, roadmap e TODO
- **[reorg.md](reorg.md)** - 📐 Piano riorganizzazione database v2.0 (schema base unificato)

### Quick Links
- **PocketBase Admin**: http://127.0.0.1:8090/_/
- **Frontend Dev**: http://localhost:5173
- **Dashboard Gestione**: http://localhost:5173/gestione

---

## 🚀 Quick Start

### Installazione
```bash
npm install
```

### Avvia PocketBase (Backend)
```bash
./pocketbase serve
# In ascolto su http://127.0.0.1:8090
```

### Avvia Dev Server (Frontend)
```bash
npm run dev
# In ascolto su http://localhost:5173
```

### Build Produzione
```bash
npm run build
npm run preview
```

---

## 📁 Struttura Progetto

```
├── public/
│   ├── media/           # 149 immagini tecniche (WebP)
│   │   └── audio/       # 489 file MP3 (pronunce)
│   ├── icons/           # 40 icone custom
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── admin/       # 9 form CRUD amministrazione
│   │   ├── search-modal/
│   │   ├── technique-card/
│   │   └── ...
│   ├── routes/
│   │   ├── gestione/    # Area amministrazione
│   │   ├── tecniche/    # Database Gokyo no Waza
│   │   ├── kata/        # Catalogo kata
│   │   ├── dizionario/  # Glossario terminologia
│   │   ├── quiz/        # Quiz esami
│   │   └── ...          # 18+ routes totali
│   ├── lib/
│   │   ├── pocketbase.ts       # Client PocketBase pubblico
│   │   └── pocketbase-admin.ts # Client admin con auth
│   └── global.css       # Tailwind + dark mode
├── pb_data/             # Database PocketBase (SQLite)
├── pb_schema_*.json     # Schema collection PocketBase
├── migrate_*.mjs        # Script migrazione database
└── check_*.mjs          # Script debug/ispezione (18 script)
```

---

## 🎯 Features Principali

### Area Pubblica
- ✅ Homepage con menu sezioni
- ✅ Database tecniche Gokyo no Waza (filtri gruppo/categoria)
- ✅ Catalogo kata tradizionali
- ✅ Dizionario terminologia giapponese (con audio)
- ✅ Quiz esami con scoring "Hansoku-make"
- ✅ Timeline storia del Judo
- ✅ Info FIJLKAM + regolamenti
- ✅ Bacheca news/eventi
- ✅ Galleria foto/video
- ✅ Giochi: Gokyo Game, Tris, Flash Cards

### Area Gestione (Admin)
- ✅ Dashboard con statistiche real-time
- ✅ CRUD completo per tutte le collection
- ✅ Upload media (immagini WebP, audio MP3, PDF)
- ✅ Task amministrativi con email Mailgun
- ✅ Media center centralizzato
- ✅ Bulk actions (selezione multipla + eliminazione massa)
- ✅ Rich text editor con preview
- ✅ Dark mode persistente

---

## 🗄️ Database PocketBase

### Collection Principali
- `techniques` - Tecniche Gokyo no Waza (149 record)
- `dictionary` - Terminologia giapponese (489 termini)
- `kata` - Forme tradizionali
- `post` - Bacheca news/eventi
- `gallery` - Galleria media
- `history` + `timeline_history` - Storia del Judo
- `quiz_questions` - Domande quiz esami
- `program` - Programmi FIJLKAM
- `settings` - Impostazioni sistema
- `users` - Utenti/Community
- `task_admin` - Task amministrativi (schema italiano ✅)

**Totale**: 12 collection operative

---

## ⚙️ Configurazione

### Variabili Ambiente (.env)
```bash
VITE_PB_URL=http://127.0.0.1:8090

# Mailgun (opzionale, per task reminder)
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.tuodominio.com
MAILGUN_FROM_EMAIL=noreply@judook.com
MAILGUN_FROM_NAME=JudoOK Admin
```

### PocketBase
- **Versione**: 0.26+
- **Database**: SQLite (`pb_data/data.db`)
- **Storage**: Locale (`pb_data/storage`)
- **Auth**: Email + password

---

## 🛠️ Script Utili

### Migrazione Database
```bash
# Migra admin_tasks → task_admin (schema italiano)
node migrate_admin_tasks.mjs
```

### Debug PocketBase
```bash
# Verifica collection
node check_collections.mjs

# Ispeziona schema
node check_schema.mjs

# Lista tecniche
node check_tech.mjs

# Verifica task
node check_admin_tasks.mjs
```

### Git
```bash
# Commit con messaggio standard
git add .
git commit -m "feat: descrizione feature

🤖 Generated with Claude Code
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 📊 Stato Progetto

**Versione**: 2.0 (Schema Base Unificato)
**Ultimo aggiornamento**: 31 Dicembre 2025

### Completamento
- ✅ **Frontend**: 100% (18+ routes pubbliche + admin)
- ✅ **Backend**: 100% (12 collection operative)
- ✅ **Componenti**: 100% (25+ componenti)
- ✅ **Migrazione task_admin**: 100% ✅ (schema italiano)
- ⏳ **Schema unificato completo**: Pianificato (vedi [reorg.md](reorg.md))

### Metriche
- **Linee codice**: ~8000 TSX
- **Assets**: ~104MB (immagini + audio + video)
- **Routes**: 28 totali (18 pubbliche + 10 admin)
- **Collection**: 12 attive

Vedi **[progetto_todo.md](progetto_todo.md)** per dettagli completi.

---

## 🔗 Link Utili

### Documentazione Framework
- [Qwik Docs](https://qwik.dev/)
- [Qwik City Routing](https://qwik.dev/qwikcity/routing/overview/)
- [PocketBase Docs](https://pocketbase.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Risorse Progetto
- [Mailgun API Docs](https://documentation.mailgun.com/)
- [Qwik Discord](https://qwik.dev/chat)
- [PocketBase GitHub](https://github.com/pocketbase/pocketbase)

---

## 📝 Licenza

Progetto privato - Tutti i diritti riservati

---

## 🙏 Credits

- **Framework**: [Qwik](https://qwik.dev/) by Builder.io
- **Backend**: [PocketBase](https://pocketbase.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Email**: [Mailgun](https://www.mailgun.com/)

**Sviluppato con** ⚡ **Qwik** + 🥋 **passione per il Judo**
