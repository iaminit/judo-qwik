# Riorganizzazione Database PocketBase - Judo Qwik

## Documento di Analisi e Proposta v2.0 - Schema Unificato

**Data**: 2025-12-31
**Versione**: 2.0 (Schema Base Unificato)
**Autore**: Claude Code Analysis

---

## FILOSOFIA PROGETTUALE

### Principio Guida: Schema Base Comune

Tutte le collection principali (escluse tabelle di join e lookup) condividono uno **schema base unificato** con campi comuni. I layout delle pagine si adattano mostrando/nascondendo campi in base al tipo di contenuto.

**Vantaggi:**
- ✅ **Ricerca globale istantanea** su tutti i contenuti
- ✅ **Componenti form riutilizzabili** (un solo base-form.tsx)
- ✅ **Consistenza dati** (tutti i record hanno created, updated, pubblicato, etc.)
- ✅ **Full-text search unificato** su campi titolo, contenuto, tags
- ✅ **Facilità manutenzione** (modifiche schema propagate uniformemente)

---

## 1. SCHEMA BASE UNIFICATO (BaseRecord)

### Campi Comuni a Tutte le Collection Principali

```typescript
interface BaseRecord {
  // Identità
  id: string (auto)
  tipo_contenuto: string (auto, nome collection)

  // Contenuti Testuali (Ricercabili)
  titolo: string (text, required, indexed)
  titolo_secondario?: string (text, indexed) // es. nome giapponese, sottotitolo
  slug: string (text, unique, auto-generated, indexed)
  contenuto?: string (editor HTML, full-text indexed)
  descrizione_breve?: string (text, 500 char, indexed)
  tags?: string (text, comma-separated, indexed)

  // Classificazione
  categoria_principale?: relation (→ categorie)
  categoria_secondaria?: string (text)

  // Media
  immagine_principale?: file (webp/jpg)
  immagine_secondaria?: file (webp/jpg)
  audio?: file (mp3)
  video_link?: url (YouTube, Vimeo)
  video_id?: string (YouTube ID estratto)
  file_allegato?: file (PDF, DOC)

  // Metadati Numerici
  ordine?: number (default 0, per sorting)
  livello?: number (1-10, per graduazioni/difficoltà)
  anno?: number (per timeline, validità)

  // Date
  data_riferimento?: datetime (data evento/pubblicazione)
  data_inizio?: datetime (validità/corso)
  data_fine?: datetime (scadenza/termine)

  // Link e Relazioni
  link_esterno?: url
  record_correlato_id?: relation (auto-relation, per linking cross-collection)

  // Stato e Visibilità
  pubblicato: bool (default true, indexed)
  in_evidenza: bool (default false, per pinning)

  // Auditing
  autore_id?: relation (→ utenti)
  created: datetime (auto, indexed)
  updated: datetime (auto, indexed)
}
```

---

## 2. COLLECTION PRINCIPALI CON SCHEMA BASE

### DOMINIO DIDATTICA

#### 2.1 `tecniche`
**Campi Base + Specifici**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "tecniche",
  titolo: "Seoi Nage",
  titolo_secondario: "背負い投げ", // nome giapponese
  slug: "seoi-nage",
  contenuto: "<p>Descrizione tecnica...</p>",
  descrizione_breve: "Proiezione caricando sulle spalle",
  tags: "proiezione,te-waza,sacrificio,I-kyo",
  categoria_principale: → gruppo_tecnica_id,
  categoria_secondaria: "Te Waza",
  immagine_principale: "seoi-nage.webp",
  audio: "seoi-nage.mp3",
  video_id: "abc123xyz",
  ordine: 1,
  livello: 1, // dan level
  pubblicato: true,
  created, updated, autore_id,

  // --- CAMPI SPECIFICI TECNICHE ---
  gruppo_tecnica_id: relation (→ gruppi_tecniche) // "I Kyo", "II Kyo"
  categoria_tecnica_id: relation (→ categorie_tecniche) // "Nage Waza"
  sottocategoria: "Te Waza" // Ashi, Koshi, Te, Sutemi
}
```

**Layout Pagina Tecnica:**
- Mostra: titolo, titolo_secondario, immagine_principale, audio, video_id, contenuto, gruppo, categoria, sottocategoria
- Nasconde: data_riferimento, data_fine, file_allegato, anno

---

#### 2.2 `kata`
**Campi Base + Specifici**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "kata",
  titolo: "Nage No Kata",
  titolo_secondario: "投の形",
  slug: "nage-no-kata",
  contenuto: "<p>Storia e significato del kata...</p>",
  descrizione_breve: "Forme delle proiezioni",
  tags: "forme,nage,proiezioni,dan",
  immagine_principale: "nage-no-kata-cover.webp",
  video_link: "https://youtube.com/watch?v=...",
  video_id: "abc123",
  ordine: 1,
  livello: 1, // dan richiesto
  pubblicato: true,
  created, updated,

  // --- CAMPI SPECIFICI KATA ---
  livello_dan_id: relation (→ livelli_dan)
}
```

**Relazione N:M con tecniche:** Tabella join `tecniche_kata`

**Layout Pagina Kata:**
- Mostra: titolo, titolo_secondario, immagine_principale, video_link, contenuto, livello, tecniche_associate
- Nasconde: audio, tags visibili, data_riferimento

---

#### 2.3 `dizionario`
**Campi Base + Specifici**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "dizionario",
  titolo: "Dojo",
  titolo_secondario: "道場",
  slug: "dojo",
  contenuto: "<p>Luogo dove si pratica la Via...</p>",
  descrizione_breve: "Luogo di pratica",
  tags: "luoghi,etichetta,cultura",
  categoria_principale: → categoria_dizionario_id,
  audio: "dojo.mp3",
  ordine: 0,
  pubblicato: true,
  created, updated,

  // --- CAMPI SPECIFICI DIZIONARIO ---
  kanji: "道場", // duplicato di titolo_secondario per chiarezza semantica
  pronuncia: "doo-joo",
  etimologia: "道 (via) + 場 (luogo)",
  categoria_dizionario_id: relation (→ categorie_dizionario) // "Luoghi", "Tecniche", "Etichetta"
}
```

**Layout Pagina Dizionario:**
- Mostra: titolo, kanji, pronuncia, audio, contenuto, etimologia, categoria
- Nasconde: immagine_principale, video, data_riferimento

---

### DOMINIO CONTENUTI E MEDIA

#### 2.4 `bacheca`
**Campi Base + Specifici**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "bacheca",
  titolo: "Gara Regionale 2025",
  slug: "gara-regionale-2025",
  contenuto: "<p>Dettagli evento...</p>",
  descrizione_breve: "Gara regionale Lazio U18",
  tags: "gara,agonismo,regionale,2025",
  categoria_principale: → categoria_bacheca_id,
  immagine_principale: "gara-cover.webp",
  video_link: "https://youtube.com/...",
  link_esterno: "https://fijlkam.it/evento",
  data_riferimento: "2025-03-15 10:00:00", // data evento
  data_fine: "2025-03-16 18:00:00", // scadenza/fine evento
  ordine: 0,
  in_evidenza: true, // pin top
  pubblicato: true,
  autore_id: → utenti,
  created, updated,

  // --- CAMPI SPECIFICI BACHECA ---
  categoria_bacheca_id: relation (→ categorie_bacheca) // "Evento", "Gara", "Notizia"
  attivita: "AGONISMO", // "GENERALE", "CORSO_BAMBINI", "GARE"
}
```

**Layout Pagina Bacheca:**
- Mostra: TUTTO lo schema base (esempio perfetto di utilizzo completo)
- Nasconde: audio

---

#### 2.5 `galleria`
**Campi Base + Specifici**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "galleria",
  titolo: "Stage Nazionale 2024",
  slug: "stage-nazionale-2024",
  descrizione_breve: "Foto stage con Maestro Yamashita",
  tags: "stage,nazionale,yamashita,2024",
  immagine_principale: "stage-cover.webp",
  video_link: "https://youtube.com/...",
  data_riferimento: "2024-11-20", // data evento
  ordine: 0,
  pubblicato: true,
  record_correlato_id: → bacheca (link a post evento),
  created, updated,

  // --- CAMPI SPECIFICI GALLERIA ---
  tipo_media: "foto", // "foto", "video", "album"
}
```

**Layout Pagina Galleria:**
- Mostra: titolo, immagine_principale, video_link, descrizione_breve, tags, data_riferimento
- Nasconde: contenuto lungo, audio, livello

---

#### 2.6 `storia`
**Campi Base + Specifici**
(Unifica history + timeline_history)

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "storia",
  titolo: "Fondazione Kodokan",
  slug: "fondazione-kodokan-1882",
  contenuto: "<p>Nel 1882 Jigoro Kano...</p>", // per articoli
  descrizione_breve: "Jigoro Kano fonda il Kodokan a Tokyo", // per timeline
  tags: "kano,kodokan,fondazione,origini",
  immagine_principale: "kodokan-1882.webp",
  anno: 1882, // per timeline
  data_riferimento: "1882-05-01", // data precisa se nota
  ordine: 1882,
  pubblicato: true,
  created, updated,

  // --- CAMPI SPECIFICI STORIA ---
  tipo_storia: "evento_timeline", // "articolo" o "evento_timeline"
  categoria_storia: "Fondatori", // "Origini", "Fondatori", "Eventi", "Evoluzione"
}
```

**Layout Pagina Storia:**
- **Se tipo_storia = "articolo"**: Mostra titolo, contenuto completo, immagine
- **Se tipo_storia = "evento_timeline"**: Mostra anno, descrizione_breve, immagine piccola

---

### DOMINIO FEDERAZIONE (FIJLKAM)

#### 2.7 `programmi_fijlkam`
**Campi Base + Specifici**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "programmi_fijlkam",
  titolo: "Programma Primo Dan 2025",
  slug: "programma-primo-dan-2025",
  contenuto: "<h3>Nage Waza</h3><ul>...",
  tags: "primo-dan,programma,esame,2025",
  file_allegato: "programma-1dan-2025.pdf",
  anno: 2025,
  data_inizio: "2025-01-01",
  data_fine: "2025-12-31",
  livello: 1, // dan
  ordine: 1,
  pubblicato: true,
  created, updated,

  // --- CAMPI SPECIFICI PROGRAMMI ---
  livello_dan_id: relation (→ livelli_dan)
}
```

---

#### 2.8 `regolamenti_fijlkam`
**Campi Base + Specifici**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "regolamenti_fijlkam",
  titolo: "Regolamento Gare 2025",
  slug: "regolamento-gare-2025",
  contenuto: "<p>Articolo 1...</p>",
  descrizione_breve: "Regolamento competizioni agonistiche",
  tags: "gare,regolamento,arbitraggio,2025",
  categoria_secondaria: "Gare", // "Gare", "Arbitraggio", "Graduazioni"
  file_allegato: "regolamento-gare-2025.pdf",
  link_esterno: "https://fijlkam.it/regolamenti",
  anno: 2025,
  ordine: 1,
  pubblicato: true,
  created, updated,

  // --- CAMPI SPECIFICI REGOLAMENTI ---
  versione: "v2.1",
}
```

---

#### 2.9 `info_fijlkam`
**Campi Base (Schema minimo)**

```javascript
{
  // --- BASE SCHEMA ---
  id, tipo_contenuto: "info_fijlkam",
  titolo: "Chi Siamo",
  slug: "chi-siamo",
  contenuto: "<p>La FIJLKAM è...</p>",
  ordine: 1,
  pubblicato: true,
  updated,

  // --- CAMPI SPECIFICI INFO ---
  sezione: "chi_siamo", // "chi_siamo", "contatti", "affiliazione" (unique)
}
```

---

### DOMINIO SISTEMA

#### 2.10 `utenti` (PocketBase User Collection estesa)
**Campi PocketBase Auth + Custom**

```javascript
{
  // --- POCKETBASE AUTH BASE ---
  id, email, username, emailVisibility, verified,

  // --- CAMPI CUSTOM ---
  nome: "Mario",
  cognome: "Rossi",
  avatar: "avatar.webp",
  ruolo: "atleta", // "admin", "istruttore", "atleta", "genitore"
  cintura_livello_id: relation (→ livelli_dan),
  data_nascita: "2005-03-15",
  telefono: "+39 333 1234567",
  note: "Atleta promettente",
  attivo: true,
  created, updated,
}
```

---

#### 2.11 `impostazioni` (Singleton)
**Schema Custom**

```javascript
{
  id: "singleton",
  nome_sito: "Judo Qwik",
  sottotitolo: "Il portale del Judo",
  logo: "logo.webp",
  colore_primario: "#ef4444",
  colore_secondario: "#1f2937",
  email_contatto: "info@judoqwik.it",
  telefono_contatto: "+39 06 12345678",
  indirizzo_palestra: "Via Roma 123, Roma",
  social_facebook: "https://facebook.com/judoqwik",
  social_instagram: "https://instagram.com/judoqwik",
  social_youtube: "https://youtube.com/@judoqwik",
  google_analytics_id: "G-XXXXXXXXXX",
  manutenzione_attiva: false,
  messaggio_manutenzione: "Sito in manutenzione...",
  updated: datetime,
}
```

---

#### 2.12 `task_admin` (ex admin_tasks)
**Schema Custom - Gestione Attività Amministrative**

```javascript
{
  // --- CAMPI ATTUALI (Schema Esistente) ---
  id,
  title: "Aggiornare programma esami 2025", // text, required, max 200
  description: "Verificare requisiti con FIJLKAM", // text, max 500
  completed: false, // bool
  priority: "high", // select: "low", "medium", "high", "urgent"
  assigned_to: "Mario Rossi", // text, max 100
  due_date: "2025-02-15", // date
  created: datetime (auto),
  updated: datetime (auto),
}
```

**OPZIONE A - Mantenere Schema Attuale:**
- ✅ Già implementato e funzionante
- ✅ Sistema email Mailgun integrato
- ✅ Componente `AdminTaskList` pronto
- ⚠️ Nomi campi in inglese (non coerente con reorg)
- ⚠️ `assigned_to` è testo libero (non relazione a utenti)

**OPZIONE B - Adattamento Schema Unificato (PROPOSTA):**

```javascript
{
  // --- BASE SCHEMA ADATTATO ---
  id,
  titolo: "Aggiornare programma esami 2025", // ex title
  contenuto: "Verificare requisiti con FIJLKAM e aggiornare...", // ex description (più lungo)
  descrizione_breve: "Verifica requisiti FIJLKAM", // max 200 char
  categoria_principale: → categorie (tipo_categoria="task_admin"), // es. "Didattica", "Amministrativo", "Manutenzione"
  categoria_secondaria: "FIJLKAM", // tag libero
  tags: "esami,fijlkam,programma,2025",
  ordine: 0, // per sorting custom
  data_riferimento: "2025-02-15", // ex due_date
  pubblicato: false, // se true = visibile in dashboard
  in_evidenza: true, // pin task urgenti
  autore_id: → utenti, // chi ha creato
  created, updated,

  // --- CAMPI SPECIFICI TASK ---
  completato: false, // ex completed (nome italiano)
  priorita: "alta", // ex priority, valori: "bassa", "media", "alta", "urgente"
  assegnato_a_id: relation (→ utenti, required), // ex assigned_to ma con FK
  stato: "aperto", // "aperto", "in_corso", "bloccato", "completato"
  promemoria_inviato: false, // traccia se email inviata
  promemoria_data: datetime, // quando inviato ultimo promemoria
}
```

**Vantaggi Opzione B:**
- ✅ Nomi italiani coerenti con reorg
- ✅ Relazione FK a `utenti` invece di testo libero
- ✅ Ricercabile con sistema globale (titolo, tags, contenuto)
- ✅ Supporta categorizzazione (es. "Didattica", "Manutenzione", "FIJLKAM")
- ✅ Tracking prememoria per evitare spam
- ✅ Campo `stato` più granulare di solo completed
- ✅ Può usare BaseForm (con config specifica)

**Migrazione da A a B:**

```javascript
// Script migrazione admin_tasks → task_admin
async function migraAdminTasks() {
  const oldTasks = await pb.collection('admin_tasks').getFullList();

  for (const task of oldTasks) {
    // Trova utente da nome stringa (fallback a primo admin)
    const user = await pb.collection('utenti').getFirstListItem(
      `nome ~ "${task.assigned_to}" || cognome ~ "${task.assigned_to}"`,
      { requestKey: null }
    ).catch(() => pb.collection('utenti').getFirstListItem('ruolo = "admin"'));

    await pb.collection('task_admin').create({
      // Schema base
      titolo: task.title,
      contenuto: task.description || '',
      descrizione_breve: task.title.substring(0, 200),
      tags: task.priority,
      data_riferimento: task.due_date,
      pubblicato: !task.completed,
      autore_id: user.id,
      created: task.created,
      updated: task.updated,

      // Campi specifici
      completato: task.completed,
      priorita: mapPriority(task.priority), // low→bassa, high→alta, etc.
      assegnato_a_id: user.id,
      stato: task.completed ? 'completato' : 'aperto',
    });
  }
}

function mapPriority(eng) {
  const map = { low: 'bassa', medium: 'media', high: 'alta', urgent: 'urgente' };
  return map[eng] || 'media';
}
```

**Raccomandazione:** Se procedi con migrazione completa del database, adotta **Opzione B** per coerenza. Altrimenti mantieni **Opzione A** per non rompere codice esistente.

---

## 3. TABELLE LOOKUP E JOIN (Schema Semplificato)

### 3.1 Tabelle Lookup (Reference)

#### `categorie`
Tabella universale per tutte le categorie

```javascript
{
  id,
  tipo_categoria: "gruppo_tecnica", // "gruppo_tecnica", "categoria_tecnica", "bacheca", "dizionario"
  nome: "I Kyo",
  descrizione: "Primo gruppo Gokyo no Waza",
  icona: "🥋",
  colore: "#ef4444",
  ordine: 1,
  created, updated
}
```

**Dati Predefiniti:**
```
tipo_categoria="gruppo_tecnica": I Kyo, II Kyo, III Kyo, IV Kyo, V Kyo, Habukiretsu, Shimmeisho No Waza
tipo_categoria="categoria_tecnica": Nage Waza, Katame Waza, Ne Waza, Atemi Waza
tipo_categoria="bacheca": Evento, Gara, Notizia, Corso
tipo_categoria="dizionario": Luoghi, Tecniche, Etichetta, Abbigliamento, Filosofia
tipo_categoria="task_admin": Didattica, Amministrativo, Manutenzione, FIJLKAM, Agonismo
```

---

#### `livelli_dan`
Gradi judo (kyu e dan)

```javascript
{
  id,
  tipo: "Dan", // "Kyu" o "Dan"
  grado: 1, // 1-10 Dan, 1-6 Kyu
  nome_completo: "Primo Dan",
  cintura_colore: "Nera",
  requisiti: "<ul><li>16 anni...</li></ul>",
  ordine: 10,
}
```

---

### 3.2 Tabelle Join

#### `tecniche_kata`
Relazione N:M tra tecniche e kata

```javascript
{
  id,
  kata_id: relation (→ kata, required),
  tecnica_id: relation (→ tecniche, required),
  sequenza: 1, // ordine esecuzione
  serie: "Prima Serie",
  note: "Eseguire lentamente",
}
```

---

#### `immagini_tecniche`
Galleria multipla per tecniche (1:N)

```javascript
{
  id,
  tecnica_id: relation (→ tecniche, required, cascade delete),
  immagine: file (webp, required),
  titolo: "Kuzushi iniziale",
  descrizione: "Fase di squilibrio",
  ordine: 1,
  created,
}
```

---

## 4. RICERCA UNIFICATA E ISTANTANEA

### 4.1 Strategia Full-Text Search

Con schema base unificato, la ricerca può interrogare **tutti i contenuti contemporaneamente**:

```typescript
// Ricerca globale istantanea
async function ricercaGlobale(query: string) {
  const collections = [
    'tecniche', 'kata', 'dizionario',
    'bacheca', 'galleria', 'storia',
    'programmi_fijlkam', 'regolamenti_fijlkam'
  ];

  const risultati = await Promise.all(
    collections.map(collection =>
      pb.collection(collection).getList(1, 5, {
        filter: `titolo ~ "${query}" || descrizione_breve ~ "${query}" || tags ~ "${query}"`,
        sort: '-created',
      })
    )
  );

  return risultati.flat();
}
```

### 4.2 Indice Ricerca Alfabetico

Per ricerca per lettera (es. tutte le tecniche con "S"):

```typescript
// Ricerca per lettera iniziale
async function ricercaPerLettera(lettera: string, collection: string) {
  return pb.collection(collection).getList(1, 100, {
    filter: `titolo >= "${lettera}" && titolo < "${String.fromCharCode(lettera.charCodeAt(0) + 1)}"`,
    sort: 'titolo',
  });
}

// Esempio: ricercaPerLettera('S', 'tecniche')
// Risultato: Seoi Nage, Sode Tsuri Komi Goshi, Sukui Nage, Sumi Gaeshi...
```

### 4.3 Collection `indice_ricerca` (Opzionale)
Per performance ottimali, creare indice denormalizzato:

```javascript
{
  id,
  tipo_contenuto: "tecniche", // nome collection origine
  record_id: "abc123", // ID record originale
  titolo_indicizzato: "seoi nage", // lowercase, no accenti
  testo_completo: "seoi nage背負い投げ proiezione caricando spalle te waza...", // concat tutti campi testuali
  tags_array: ["proiezione", "te-waza", "I-kyo"],
  created, updated,
}
```

Aggiornato automaticamente via PocketBase hooks o script batch.

---

## 5. COMPONENTI FRONTEND UNIFICATI

### 5.1 BaseForm Component (Riutilizzabile)

Con schema unificato, un solo componente form adattabile:

```tsx
// src/components/admin/base-form.tsx
interface BaseFormProps {
  collection: string; // 'tecniche', 'kata', etc.
  record?: any;
  isNew?: boolean;
  config: FieldConfig[]; // quali campi mostrare
}

interface FieldConfig {
  name: keyof BaseRecord;
  visible: boolean;
  required?: boolean;
  label?: string;
}

// Esempio configurazione per tecniche
const tecnicheConfig: FieldConfig[] = [
  { name: 'titolo', visible: true, required: true, label: 'Nome Tecnica' },
  { name: 'titolo_secondario', visible: true, label: 'Nome Giapponese' },
  { name: 'immagine_principale', visible: true },
  { name: 'audio', visible: true },
  { name: 'video_id', visible: true },
  { name: 'contenuto', visible: true },
  { name: 'categoria_principale', visible: true }, // dropdown gruppi
  { name: 'livello', visible: true, label: 'Dan Level' },
  { name: 'data_riferimento', visible: false }, // nascosto per tecniche
  { name: 'file_allegato', visible: false },
];

export default component$<BaseFormProps>(({ collection, record, config }) => {
  // Logica form universale
  // Campi si mostrano/nascondono in base a config.visible
});
```

### 5.2 Configurazioni per Collection

```typescript
// src/lib/collection-configs.ts

export const COLLECTION_CONFIGS = {
  tecniche: {
    fields: [
      { name: 'titolo', visible: true, required: true },
      { name: 'titolo_secondario', visible: true },
      { name: 'immagine_principale', visible: true },
      { name: 'audio', visible: true },
      { name: 'video_id', visible: true },
      { name: 'contenuto', visible: true },
      { name: 'categoria_principale', visible: true, type: 'relation', collection: 'categorie' },
      { name: 'livello', visible: true },
      // ...altri
    ],
    labels: {
      titolo: 'Nome Tecnica',
      titolo_secondario: 'Nome Giapponese',
      livello: 'Livello Dan',
    }
  },

  bacheca: {
    fields: [
      { name: 'titolo', visible: true, required: true },
      { name: 'contenuto', visible: true },
      { name: 'immagine_principale', visible: true },
      { name: 'video_link', visible: true },
      { name: 'link_esterno', visible: true },
      { name: 'data_riferimento', visible: true },
      { name: 'data_fine', visible: true },
      { name: 'categoria_principale', visible: true },
      { name: 'in_evidenza', visible: true },
      { name: 'audio', visible: false }, // nascosto per bacheca
    ],
    labels: {
      titolo: 'Titolo Post',
      data_riferimento: 'Data Evento',
      data_fine: 'Data Scadenza',
    }
  },

  // ... config per altre collection
};
```

### 5.3 Utilizzo

```tsx
// src/routes/gestione/tecniche/nuovo/index.tsx
<BaseForm
  collection="tecniche"
  isNew={true}
  config={COLLECTION_CONFIGS.tecniche}
/>

// src/routes/gestione/bacheca/nuovo/index.tsx
<BaseForm
  collection="bacheca"
  isNew={true}
  config={COLLECTION_CONFIGS.bacheca}
/>
```

---

## 6. VANTAGGI DELLO SCHEMA UNIFICATO

### 6.1 Sviluppo e Manutenzione

| Aspetto | Prima (Schema Disomogeneo) | Dopo (Schema Unificato) |
|---------|---------------------------|------------------------|
| **Form Admin** | 9 componenti separati | 1 BaseForm + 9 config |
| **Ricerca** | 9 query diverse | 1 funzione universale |
| **Codice TypeScript** | 9 interface separate | 1 BaseRecord + extends |
| **Aggiunta campo** | Modificare 9 file | Modificare 1 schema |
| **Componenti Card** | 6 componenti custom | 1 BaseCard + props |

### 6.2 Performance

- **Indexing unificato**: Tutti i campi `titolo`, `slug`, `tags`, `created`, `pubblicato` hanno indici con stessa strategia
- **Query caching**: Query simili su collection diverse possono condividere cache
- **Bundle size**: Meno componenti = meno codice frontend

### 6.3 User Experience

- **Ricerca globale**: Utente cerca "seoi" e trova tecniche + kata correlati + post bacheca + video gallery
- **Filtri cross-collection**: Mostra tutti i contenuti del 2024 (bacheca + gallery + programmi)
- **Navigazione correlata**: Record correlato_id permette linking automatico (es. gallery → bacheca evento)

---

## 7. PIANO DI MIGRAZIONE AGGIORNATO

### Fase 1: Definizione Schema Base (2-3 ore)

1. **Creazione BaseRecord schema** in PocketBase
2. **Setup collection con campi base** per tutte le principali
3. **Popolazione tabelle lookup**:
   - `categorie` con tutti i tipi
   - `livelli_dan`
4. **Configurazione indici** su campi chiave (titolo, slug, tags, created, pubblicato)

### Fase 2: Script Migrazione Dati (4-6 ore)

```javascript
// migrate.mjs
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function migraTechniques() {
  const old = await pb.collection('techniques').getFullList();

  for (const tech of old) {
    await pb.collection('tecniche').create({
      // Base schema
      titolo: tech.name,
      titolo_secondario: tech.japanese_name || '',
      slug: generateSlug(tech.name),
      contenuto: tech.description,
      descrizione_breve: tech.description?.substring(0, 200),
      tags: `${tech.group},${tech.category}`,
      categoria_principale: await findCategoria('gruppo_tecnica', tech.group),
      immagine_principale: tech.image,
      audio: tech.audio,
      video_id: tech.video_youtube,
      ordine: tech.order,
      livello: tech.dan_level,
      pubblicato: true,

      // Campi specifici
      gruppo_tecnica_id: await findCategoria('gruppo_tecnica', tech.group),
      categoria_tecnica_id: await findCategoria('categoria_tecnica', tech.category),
      sottocategoria: tech.subcategory,
    });
  }
}

async function migraHistory() {
  // Migra history articoli
  const articles = await pb.collection('history').getFullList();
  for (const art of articles) {
    await pb.collection('storia').create({
      titolo: art.title,
      contenuto: art.content,
      tipo_storia: 'articolo',
      pubblicato: true,
    });
  }

  // Migra timeline_history eventi
  const events = await pb.collection('timeline_history').getFullList();
  for (const evt of events) {
    await pb.collection('storia').create({
      titolo: evt.title,
      descrizione_breve: evt.description,
      anno: evt.year,
      ordine: evt.year,
      tipo_storia: 'evento_timeline',
      pubblicato: true,
    });
  }
}

// ... funzioni per altre collection
```

### Fase 3: Frontend Unificato (10-15 ore)

1. **Creare BaseForm component** (`src/components/admin/base-form.tsx`)
2. **Creare collection configs** (`src/lib/collection-configs.ts`)
3. **Aggiornare routes gestione**:
   - Sostituire 9 form specifici con BaseForm
   - Mantenere personalizzazioni UI (colori, icone) via config
4. **Implementare ricerca globale**:
   - Componente SearchModal unificato
   - API route `/api/ricerca` con query cross-collection
5. **Aggiornare componenti pubblici**:
   - technique-card → base-card con type="tecnica"
   - term-card → base-card con type="dizionario"
   - Ecc.

### Fase 4: Ottimizzazioni (3-4 ore)

1. **Generazione indice ricerca**:
   - Script batch per popolare `indice_ricerca`
   - Hook PocketBase per auto-update
2. **Lazy loading immagini** con placeholder slug-based
3. **Cache query** frequenti (gruppi, categorie, livelli)
4. **Ricerca alfabetica** con navigazione A-Z

### Fase 5: Testing & Deploy (4-6 ore)

1. **Test ricerca globale** con vari termini
2. **Test filtri cross-collection**
3. **Verifica relazioni** (tecniche_kata, categorie)
4. **Performance audit** (query < 100ms)
5. **Deploy produzione**

**Tempo totale stimato: 25-35 ore** (invariato ma con risultato più potente)

---

## 8. ESEMPI QUERY AVANZATE

### Query 1: Ricerca Globale "Seoi"

```typescript
const collections = ['tecniche', 'kata', 'bacheca', 'dizionario'];
const query = 'seoi';

const risultati = await Promise.all(
  collections.map(async (coll) => {
    const items = await pb.collection(coll).getList(1, 3, {
      filter: `titolo ~ "${query}" || titolo_secondario ~ "${query}" || tags ~ "${query}"`,
      fields: 'id,tipo_contenuto,titolo,titolo_secondario,descrizione_breve,slug,immagine_principale',
    });

    return items.items.map(item => ({
      ...item,
      tipo_contenuto: coll, // per rendering
    }));
  })
);

// Risultato:
// [
//   { tipo_contenuto: 'tecniche', titolo: 'Seoi Nage', slug: 'seoi-nage', ... },
//   { tipo_contenuto: 'tecniche', titolo: 'Seoi Otoshi', slug: 'seoi-otoshi', ... },
//   { tipo_contenuto: 'kata', titolo: 'Nage No Kata', descrizione_breve: 'Include Seoi Nage...', ... },
//   { tipo_contenuto: 'bacheca', titolo: 'Stage Seoi Nage Avanzato', ... }
// ]
```

### Query 2: Tutti i Contenuti 2024

```typescript
const contenuti2024 = await Promise.all(
  ['bacheca', 'galleria', 'programmi_fijlkam'].map(coll =>
    pb.collection(coll).getList(1, 50, {
      filter: `anno = 2024 || data_riferimento >= "2024-01-01"`,
      sort: '-data_riferimento',
    })
  )
);
```

### Query 3: Tecniche del I Kyo con Expand

```typescript
const tecnicheIKyo = await pb.collection('tecniche').getList(1, 50, {
  filter: 'categoria_principale.nome = "I Kyo"',
  expand: 'categoria_principale,gruppo_tecnica_id',
  sort: 'ordine',
});

// Risultato include:
// tecniche[0].expand.categoria_principale = { nome: "I Kyo", colore: "#ef4444" }
```

### Query 4: Kata con Tecniche Associate

```typescript
const kata = await pb.collection('kata').getFirstListItem('slug = "nage-no-kata"', {
  expand: 'tecniche_kata_via_kata.tecnica_id',
});

// Risultato:
// kata.expand.tecniche_kata_via_kata = [
//   { sequenza: 1, serie: "Prima Serie", expand: { tecnica_id: { titolo: "Uki Goshi", ... } } },
//   { sequenza: 2, serie: "Prima Serie", expand: { tecnica_id: { titolo: "Seoi Nage", ... } } },
//   ...
// ]
```

### Query 5: Alfabeto Tecniche (A-Z Navigator)

```typescript
async function getLetterIndex(collection: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const index = await Promise.all(
    alphabet.map(async letter => {
      const count = await pb.collection(collection).getList(1, 1, {
        filter: `titolo >= "${letter}" && titolo < "${String.fromCharCode(letter.charCodeAt(0) + 1)}"`,
      });

      return { letter, count: count.totalItems };
    })
  );

  return index.filter(item => item.count > 0);
}

// Risultato: [{ letter: 'D', count: 3 }, { letter: 'H', count: 5 }, { letter: 'K', count: 12 }, ...]
// UI: render solo lettere con count > 0 come link cliccabili
```

---

## 9. STRUTTURA FINALE DATABASE

### Collection Principali (Schema Base)
1. `tecniche` (ex techniques) - 8 campi specifici
2. `kata` - 1 campo specifico + relazione N:M
3. `dizionario` (ex dictionary) - 3 campi specifici
4. `bacheca` (ex post) - 2 campi specifici
5. `galleria` (ex gallery) - 1 campo specifico
6. `storia` (ex history + timeline_history unificati) - 2 campi specifici
7. `programmi_fijlkam` (ex program) - 1 campo specifico
8. `regolamenti_fijlkam` (NUOVA) - 1 campo specifico
9. `info_fijlkam` (NUOVA) - 1 campo specifico

### Collection Sistema
10. `utenti` (ex users) - PocketBase Auth + custom
11. `impostazioni` (ex settings) - Singleton
12. `task_admin` (ex admin_tasks) - Gestione task amministrativi

### Tabelle Lookup
13. `categorie` - Universale (tipo_categoria discriminante)
14. `livelli_dan` - Gradi judo

### Tabelle Join
15. `tecniche_kata` - N:M kata ↔ tecniche
16. `immagini_tecniche` - 1:N tecniche → immagini

### Opzionale Ottimizzazione
17. `indice_ricerca` - Indice denormalizzato per full-text search

**Totale: 16-17 collection** (include task_admin già implementato)

---

## 10. CONFRONTO APPROCCI

| Aspetto | Approccio Precedente (v1.0) | Approccio Unificato (v2.0) |
|---------|----------------------------|---------------------------|
| **Collection principali** | 9 con schemi diversi | 9 con schema base comune |
| **Campi totali unici** | ~120 campi diversi | ~35 campi base + ~20 specifici |
| **Componenti form** | 9 componenti separati | 1 BaseForm + 9 config |
| **Ricerca globale** | Complessa (9 query diverse) | Semplice (1 funzione) |
| **Manutenibilità** | Media | Alta |
| **Flessibilità** | Bassa | Alta (nuove collection facili) |
| **Normalizzazione** | Alta | Alta (mantenuta) |
| **Performance ricerca** | Media | Alta (indici uniformi) |
| **Curva apprendimento** | Media | Bassa (pattern ripetuto) |
| **Coerenza dati** | Media | Alta (auditing uniforme) |

---

## 11. CHECKLIST PRE-MIGRAZIONE

- [ ] **Approvazione approccio** schema unificato
- [ ] **Backup completo** database esistente + export JSON
- [ ] **Ambiente staging** PocketBase isolato
- [ ] **Script migrazione** testato su dati dummy
- [ ] **BaseForm component** sviluppato e testato
- [ ] **Collection configs** definite per tutte le 9 principali
- [ ] **Funzione ricerca globale** implementata
- [ ] **Test performance** query con indici
- [ ] **Documentazione** schema base per sviluppatori futuri
- [ ] **Piano rollback** in caso di problemi

---

## 12. RACCOMANDAZIONI FINALI

### ✅ APPROCCIO CONSIGLIATO: Schema Base Unificato (v2.0)

**Motivi:**
1. **Massima riutilizzabilità codice** (1 form vs 9)
2. **Ricerca unificata istantanea** su tutti i contenuti
3. **Manutenibilità eccellente** (modifiche centralizzate)
4. **Scalabilità** (nuove collection = solo aggiungere config)
5. **Coerenza totale** (auditing, pubblicazione, metadati uniformi)

### Roadmap Implementazione

**Sprint 1 (8-10 ore)**: Schema + Migrazione
- Definire BaseRecord in PocketBase
- Creare collection con schema base
- Script migrazione dati
- Popolamento lookup tables

**Sprint 2 (10-12 ore)**: Frontend Unificato
- BaseForm component
- Collection configs
- Aggiornamento routes gestione
- Ricerca globale

**Sprint 3 (6-8 ore)**: Ottimizzazioni + Testing
- Indice ricerca
- Performance tuning
- Test completi
- Deploy

**Totale: 25-30 ore** per trasformazione completa

---

## 13. PROSSIMI PASSI

1. **Approvazione schema base** proposto
2. **Discussione campi opzionali** (aggiungere/rimuovere dal base schema?)
3. **Prioritizzazione collection** (iniziare da tecniche + bacheca come pilot?)
4. **Setup ambiente sviluppo** con PocketBase staging
5. **Kickoff migrazione** con Sprint 1

---

---

## 14. NOTA: COLLECTION ADMIN_TASKS GIÀ IMPLEMENTATA

### Stato Attuale
La collection `admin_tasks` è **già operativa** con:
- ✅ Schema PocketBase creato
- ✅ Componente UI (`AdminTaskList`) funzionante
- ✅ API email con Mailgun (`/api/send-task-reminder`)
- ✅ Integrazione in dashboard `/gestione`
- ✅ Script setup e documentazione completa

### Approccio Migrazione

**Scenario A - Migrazione Parziale (Conservativo):**
- Mantenere `admin_tasks` com'è (schema inglese)
- Migrare solo le collection di contenuto pubblico
- **Pro:** Nessun impatto su codice funzionante
- **Contro:** Inconsistenza linguistica nel database

**Scenario B - Migrazione Completa (Raccomandato):**
- Migrare `admin_tasks` → `task_admin` con schema italiano
- Aggiornare `AdminTaskList` e API per nuovi nomi campi
- Aggiungere relazione FK `assegnato_a_id` → `utenti`
- **Pro:** Database 100% coerente e normalizzato
- **Contro:** Richiede aggiornamento codice (2-3 ore extra)

### Script Migrazione Rapida

Se scegli Scenario B, usa questo script:

```javascript
// migrate_admin_tasks.mjs
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
await pb.admins.authWithPassword('admin@example.com', 'password');

// 1. Crea nuova collection task_admin con schema italiano
// (da fare manualmente in PocketBase UI o via migration file)

// 2. Migra dati
const oldTasks = await pb.collection('admin_tasks').getFullList();

for (const task of oldTasks) {
  // Trova admin da nome (fallback a primo admin se non trovato)
  let user;
  try {
    user = await pb.collection('utenti').getFirstListItem(
      `nome ~ "${task.assigned_to}" || cognome ~ "${task.assigned_to}"`
    );
  } catch {
    user = await pb.collection('utenti').getFirstListItem('ruolo = "admin"');
  }

  await pb.collection('task_admin').create({
    titolo: task.title,
    contenuto: task.description || '',
    descrizione_breve: task.title.substring(0, 200),
    data_riferimento: task.due_date || null,
    completato: task.completed,
    priorita: { low: 'bassa', medium: 'media', high: 'alta', urgent: 'urgente' }[task.priority],
    assegnato_a_id: user.id,
    autore_id: user.id,
    stato: task.completed ? 'completato' : 'aperto',
    pubblicato: !task.completed,
    created: task.created,
    updated: task.updated,
  });
}

console.log(`✅ Migrati ${oldTasks.length} task`);

// 3. (Opzionale) Elimina vecchia collection dopo verifica
// await pb.collections.delete('admin_tasks');
```

### Aggiornamento Componente

```tsx
// Prima (admin_tasks - inglese)
const tasks = await pbAdmin.collection('admin_tasks').getFullList();
task.title, task.description, task.completed, task.priority

// Dopo (task_admin - italiano)
const tasks = await pbAdmin.collection('task_admin').getFullList({
  expand: 'assegnato_a_id' // ora è FK
});
task.titolo, task.contenuto, task.completato, task.priorita
task.expand.assegnato_a_id.nome // nome vero invece di stringa
```

---

**Fine Documento v2.0**

Questo approccio unificato rappresenta una soluzione moderna, scalabile e manutenibile per un CMS dedicato al Judo. La struttura è pronta per crescere con il progetto mantenendo complessità sotto controllo.

**Per la collection `admin_tasks` già implementata:** scegliere tra Scenario A (conservare) o B (migrare) in base alle priorità del progetto.

Per domande o modifiche allo schema base proposto, discutere prima di procedere con l'implementazione.
