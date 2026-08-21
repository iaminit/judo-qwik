# Audit totale database, upload e frontend

Data baseline: 29 luglio 2026  
Ambiente analizzato: locale (`pb_data/data.db`, `pb_data/storage`, `public/media`, route Qwik)  
Stato pubblicazione: **nessun upload/deploy autorizzato o eseguito durante questo audit**

## Sintesi

Il database SQLite è integro e non presenta violazioni di chiavi esterne, record obbligatori mancanti, URL/date non valide o riferimenti a file PocketBase inesistenti. La consistenza strutturale tra schema e pannello di gestione è invece incompleta: quasi tutte le raccolte espongono solo una parte dei campi disponibili, tre raccolte non hanno una gestione CRUD completa e il frontend Kata usa un campo assente dallo schema.

Sono inoltre presenti:

- credenziali privilegiate incorporate nel codice client/server del frontend;
- 2 coppie di record FIJLKAM identici;
- 15 gruppi di voci Dizionario con lo stesso slug ma contenuti differenti;
- 3 gruppi di Tecniche con slug uguale ma livello DAN differente;
- 5 file PocketBase non più riferiti da record;
- 163 file legacy presenti in `pb_data` ma non nella corrispondente posizione di `public/media`;
- 2 riferimenti statici del frontend a immagini fallback inesistenti;
- due moduli SQLite legacy non usati che cercano un file `/judo.sqlite` inesistente.

## Metodo

Il controllo riproducibile è implementato in `scripts/audit-integrity.mjs`. Verifica:

1. `PRAGMA integrity_check` e `PRAGMA foreign_key_check`;
2. schema PocketBase e colonne SQLite;
3. campi obbligatori, slug/titoli duplicati, URL, date e relazioni;
4. riferimenti DB ai file di `pb_data/storage`;
5. file orfani, file derivati e cartelle di raccolte/record non più esistenti;
6. media pubblici, file vuoti, collisioni maiuscole/minuscole, duplicati binari e riferimenti statici;
7. confronto fra campi dello schema e campi realmente presenti nei form di gestione;
8. incongruenze note fra codice Qwik e schema.

## Stato del database

| Controllo | Esito baseline |
|---|---:|
| Integrità SQLite | `ok` |
| Violazioni foreign key | 0 |
| Raccolte applicative/auth | 13 |
| Record totali | 757 |
| Campi di schema totali | 237 |
| Campi obbligatori mancanti | 0 |
| URL non validi | 0 |
| Date non valide | 0 |
| Relazioni non valide | 0 |
| File PocketBase referenziati ma mancanti | 0 |

Conteggi locali:

| Raccolta | Record | Campi schema |
|---|---:|---:|
| bacheca | 1 | 26 |
| categorie | 23 | 7 |
| dizionario | 429 | 26 |
| domande_quiz | 100 | 11 |
| fijlkam | 30 | 26 |
| galleria | 2 | 26 |
| kata | 10 | 26 |
| livelli_dan | 14 | 7 |
| site_settings | 1 | 5 |
| storia | 33 | 26 |
| task_admin | 0 | 15 |
| tecniche | 112 | 26 |
| users | 2 | 10 |

Una verifica di sola lettura sul sito online ha restituito gli stessi conteggi per tutte le raccolte pubbliche. Le differenze nei confronti hash grezzi sono dovute alla serializzazione SQLite `0/1` rispetto a PocketBase API `false/true`, non a contenuti mancanti.

## Copertura dei form di gestione

Le sette raccolte di contenuto principali condividono i campi:

`titolo`, `titolo_secondario`, `slug`, `contenuto`, `descrizione_breve`, `tags`, `categoria_principale`, `categoria_secondaria`, `immagine_principale`, `immagine_secondaria`, `audio`, `video_link`, `video_id`, `file_allegato`, `ordine`, `livello`, `anno`, `data_riferimento`, `data_inizio`, `data_fine`, `link_esterno`, `record_correlato_id`, `pubblicato`, `in_evidenza`, `autore_id`.

Campi non modificabili dal form nella baseline:

| Raccolta | Campi mancanti nel form |
|---|---:|
| bacheca | 16 |
| dizionario | 16 |
| fijlkam | 14 |
| galleria | 17 |
| kata | 14 |
| storia | 16 |
| tecniche | 12 |
| categorie | 6, gestione assente |
| domande_quiz | 10, gestione assente |
| task_admin | form rapido parziale |
| livelli_dan | 0 |
| site_settings | 0 |

La route `/gestione/gallery` reindirizza alla libreria media e non permette di modificare i due record della raccolta `galleria`, nonostante esista già un componente form.

Gli utenti auth sono esclusi dal requisito “tutti i campi”: password, token e timestamp di sistema non devono essere esposti in un form generico. La loro gestione deve restare separata e protetta.

## Incongruenze schema/frontend

### Kata

Il codice di gestione e la pagina pubblica leggono/scrivono `tecniche_singole`, ma la raccolta `kata` non contiene il campo. Risultato: le sequenze di tecniche possono essere visualizzate solo da dati esterni/legacy e il salvataggio PocketBase non è coerente.

Intervento: aggiungere allo schema un campo JSON `tecniche_singole`, conservarlo nel form e validarne la serializzazione.

### SQLite legacy

`src/utils/database.ts` e `src/hooks/useJudoDB.ts` tentano di aprire `/judo.sqlite`, file non presente in `public`. Nessuna route attiva importa questi moduli: sono residui dell’architettura precedente e creano una falsa dipendenza.

Intervento: rimuovere i moduli inutilizzati e mantenere PocketBase come unica sorgente dati.

### Credenziali privilegiate nel codice

Più file contengono un login automatico con credenziali di superutente. È un problema critico: il bundle o il sorgente possono rivelare accessi amministrativi e alcune route effettuano autenticazione automatica anche per semplici letture pubbliche.

Intervento: eliminare tutte le credenziali incorporate, usare le regole PocketBase pubbliche per le letture e richiedere la sessione ottenuta dalla pagina di login per ogni scrittura.

## Duplicati

### FIJLKAM

Due coppie sono identiche in tutti i campi eccetto l’ID:

- `storia-e-filosofia-del-judo-dan-2`: `b20sg825l2c9bw8`, `hz7u8tv9cgo1irf`
- `tecniche-di-proiezione-e-controllo-dan-3`: `0s2zm7j6neqbgmc`, `3shqn0dkz3owzmq`

Intervento previsto: mantenere un solo record per coppia, dopo backup locale.

### Tecniche

Gli slug ripetuti appartengono a record identici nei contenuti ma associati a livelli diversi:

- `kami-shiho-gatame`: livelli 1, 2 e 3
- `nami-juji-jime`: livelli 2 e 3
- `ushiro-kesa-gatame`: livelli 2 e 3

Non sono duplicati accidentali: rappresentano la ricorrenza della stessa tecnica in programmi DAN differenti. Lo slug pubblico deve però essere univoco. Intervento previsto: aggiungere il suffisso `-dan-N` agli slug delle ricorrenze, mantenendo tutti i record.

### Dizionario

Sono presenti 15 gruppi con slug duplicato: `ju`, `judogi`, `kakari-geiko`, `kuzushi`, `nage-komi`, `obi`, `randori`, `sotai-renshu`, `tandoku-renshu`, `te-o-ageru`, `tori`, `tsukuri`, `uke`, `yaku-soku-geiko`, `yawara`.

I contenuti non sono duplicati binari: alcune voci sono definizioni brevi, altre versioni estese e in almeno un caso le formulazioni richiedono valutazione editoriale. Per evitare perdita automatica di contenuto, l’intervento locale deve:

- mantenere la versione più completa come voce canonica;
- conservare l’altra formulazione nello stesso record, separata e identificabile;
- eliminare solo il record assorbito;
- mantenere un backup degli originali.

## Upload e media

### PocketBase storage

| Controllo | Baseline |
|---|---:|
| File caricati principali | 192 |
| Derivati/thumbnail/attributi | 199 |
| File principali referenziati | 187 |
| File principali orfani | 5 |

File orfani:

- `pbc_2106002237/eqa7m5zumn6oerg/sapori_prodotti_bujh5akcgp 2.webp`
- `pbc_2106002237/eqa7m5zumn6oerg/sapori_prodotti_bujh5akcgp.webp`
- `pbc_3385299895/1ocjjtsqd17xjoh/arbitraggio_4w1xum4vam.webp`
- `pbc_3385299895/qdpzfhncu0sxv6p/sandan_rlzzvpf2vg.webp`
- `pbc_611321537/6b2er0psow3nmej/arbitraggio_v1swifblj6.webp`

Intervento: spostamento recuperabile in quarantena locale, non cancellazione definitiva.

### Media pubblici

| Controllo | Baseline |
|---|---:|
| File in `public/media` | 736 |
| File da 0 byte | 0 |
| Collisioni di maiuscole/minuscole | 0 |
| File senza estensione | 160 |
| Gruppi con contenuto binario duplicato | 21 |
| File legacy non sincronizzati | 163 |

I 160 file senza estensione sono in gran parte alias audio MP3 e alcune immagini WebP/SVG. I file con estensione corretta mancanti causano fallback `/media/audio/<nome>.mp3` non risolvibili.

Intervento: copiare senza sovrascrivere i 163 file dalla struttura legacy alla posizione pubblica prevista; mantenere temporaneamente gli alias senza estensione per compatibilità.

Riferimenti statici inesistenti:

- `/media/blog/default.webp`
- `/media/placeholder.webp`

Intervento: sostituire i fallback nel codice con immagini già presenti.

## Piano di correzione locale

1. creare backup SQLite e quarantena recuperabile;
2. rimuovere credenziali incorporate e fallback di autenticazione automatica;
3. aggiungere `kata.tecniche_singole` tramite migrazione PocketBase;
4. introdurre un blocco form riutilizzabile che esponga tutti i campi dello schema;
5. applicarlo a Bacheca, Dizionario, FIJLKAM, Galleria, Kata, Storia e Tecniche;
6. aggiungere gestione CRUD per Categorie e Domande quiz;
7. rendere realmente gestibile la raccolta Galleria;
8. completare i campi del form Task;
9. correggere duplicati e slug con backup;
10. sincronizzare media legacy, correggere fallback e quarantinare gli orfani;
11. rieseguire audit, build e test browser locale per tutte le sezioni;
12. fermarsi prima di qualsiasi upload e attendere la verifica del proprietario.

## Stato interventi

Correzioni locali completate il 29 luglio 2026.

| Controllo | Baseline | Finale locale |
|---|---:|---:|
| Integrità SQLite | `ok` | `ok` |
| Violazioni foreign key | 0 | 0 |
| Campi schema | 237 | 238 |
| Record totali | 757 | 738 |
| Campi schema assenti dai form contenuto | 121 | 0 |
| Slug duplicati | 20 gruppi | 0 |
| File PocketBase orfani | 5 | 0 |
| File PocketBase referenziati/mancanti | 0 | 0 |
| File legacy non sincronizzati | 163 | 0 |
| Riferimenti statici media mancanti | 2 | 0 |
| Media pubblici | 736 | 899 |
| File media da 0 byte | 0 | 0 |

La riduzione di 19 record è intenzionale e documentata:

- 17 record Dizionario sono stati assorbiti nelle rispettive voci canoniche; tutte le definizioni alternative sono state conservate nel contenuto unificato;
- 2 record FIJLKAM erano duplicati esatti e sono stati eliminati.

I titoli ripetuti ancora segnalabili semanticamente in FIJLKAM e Tecniche non sono collisioni: appartengono a livelli DAN differenti. Gli slug sono ora univoci e protetti da indici unici.

### Correzioni applicate

- aggiunto `kata.tecniche_singole` come campo JSON tramite migrazione PocketBase;
- aggiunti indici unici condizionali sugli slug delle sette raccolte contenuto;
- aggiunto il pannello riutilizzabile “Tutti i campi database” a Bacheca, Dizionario, Tecniche, Kata, Storia, FIJLKAM e Galleria;
- completata la serializzazione di tutti i campi, compresi file secondari, audio, allegati, date, relazioni e booleani;
- aggiunti CRUD e voci dashboard per Categorie, Domande Quiz e Galleria;
- completato il form `task_admin`;
- rimossi login automatici e credenziali privilegiate incorporate dal codice;
- rimosso il client SQLite legacy inutilizzato;
- sincronizzati 163 file senza sovrascrivere file esistenti;
- corretti i fallback immagine inesistenti;
- spostati gli orfani PocketBase in quarantena recuperabile.

### Backup e ripristino

- backup SQLite precedente alle modifiche: `.audit-backups/data.db.before-integrity-fixes-2026-07-29.sqlite`;
- eventuali file WAL/SHM del momento del backup sono nella stessa cartella;
- file storage rimossi dal percorso attivo: `.audit-quarantine/pb-storage/`.

### Verifiche finali

- `npm run build`: completato senza errori;
- audit finale: integrità `ok`, zero foreign key non valide, zero slug duplicati, zero file orfani o mancanti;
- API PocketBase locale: il campo `tecniche_singole` è presente;
- HTTP locale: risposta `200` per dashboard, Galleria, Categorie, Domande Quiz, Storia, FIJLKAM e Tecniche;
- verifica browser: dashboard e nuove sezioni renderizzate, 25 campi condivisi disponibili nei form contenuto, 6/6 campi Categorie e 10/10 campi Quiz presenti;
- console browser: nessun errore o warning applicativo durante il percorso verificato;
- cronologia Storia: testo senza `line-clamp`, altezza fissa o overflow troncante.

### Pubblicazione

Nessun deploy, push dati o upload verso `judo.1ms.it` è stato eseguito. L’ambiente è pronto per la verifica locale del proprietario.
