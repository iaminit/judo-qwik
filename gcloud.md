# Guida al Deployment su Google Cloud Run (FREE TIER)

**🎯 OBIETTIVO:** Pubblicare la tua app Qwik + PocketBase su Google Cloud Run **COMPLETAMENTE GRATIS** usando il Free Tier!

---

## 📋 Indice

1. [Cos'è Google Cloud Run Free Tier](#-cosè-google-cloud-run-free-tier)
2. [Prerequisiti](#-prerequisiti)
3. [Guida Passo-Passo](#-guida-passo-passo)
4. [Configurazione Avanzata](#-configurazione-avanzata)
5. [Monitoraggio e Costi](#-monitoraggio-e-costi)
6. [Troubleshooting](#-troubleshooting)
7. [FAQ](#-faq)

---

## 🎁 Cos'è Google Cloud Run Free Tier

Google Cloud Run offre un **Always Free tier** che NON scade mai:

### Quota Mensili GRATUITE (per sempre)

- **2 milioni di richieste/mese** - GRATIS
- **360,000 GB-secondi di memoria** - GRATIS
- **180,000 vCPU-secondi** - GRATIS
- **1 GB di traffico in uscita/mese** - GRATIS

### 💰 Cosa significa in pratica?

Con la configurazione ottimale (512MB RAM, 0.5 CPU):
- **~67,000 richieste al giorno** - GRATIS
- **~194 ore di runtime al mese** - GRATIS
- Perfetto per progetti personali, portfolio, piccole app!

### ✅ Vantaggi di Cloud Run

- **Scaling automatico**: Scala a zero quando non usata (nessun costo)
- **HTTPS automatico**: Certificato SSL gratis
- **No server da gestire**: Deploy con un comando
- **Cold start**: 1-2 secondi quando l'app è inattiva (accettabile per la maggior parte dei casi)

---

## 📦 Prerequisiti

### 1. Account Google Cloud

- Crea un account su [cloud.google.com](https://cloud.google.com)
- Configura il metodo di pagamento (richiesto anche per free tier, ma NON ti verrà addebitato nulla)
- Ricevi $300 di crediti per i primi 90 giorni (bonus extra!)

### 2. Software Necessario

- **Node.js** 18+ installato
- **Docker Desktop** installato e in esecuzione
- **Git** installato
- **Google Cloud SDK** (lo installeremo nel passo 1)

---

## 🚀 Guida Passo-Passo

### STEP 1: Installare e Configurare Google Cloud SDK

#### 1.1 Installare gcloud CLI

```bash
# Su macOS
brew install --cask google-cloud-sdk

# Verifica installazione
gcloud --version
```

Dovresti vedere qualcosa come:
```
Google Cloud SDK 460.0.0
```

#### 1.2 Autenticarsi con Google Cloud

```bash
# Login con il tuo account Google
gcloud auth login
```

Si aprirà il browser. Accedi con il tuo account Google e autorizza l'accesso.

#### 1.3 Creare un nuovo progetto

```bash
# Crea il progetto (sostituisci con un nome univoco se necessario)
gcloud projects create judo-qwik-app --name="Judo Qwik App"

# Imposta come progetto corrente
gcloud config set project judo-qwik-app

# Verifica che sia impostato correttamente
gcloud config get-value project
```

#### 1.4 Collegare l'account di billing

```bash
# Lista gli account di billing disponibili
gcloud billing accounts list

# Collega l'account di billing al progetto
gcloud billing projects link judo-qwik-app \
  --billing-account=YOUR-BILLING-ACCOUNT-ID
```

**NOTA**: Anche se colleghi il billing, restando nel free tier NON pagherai nulla!

#### 1.5 Abilitare le API necessarie

```bash
# Abilita Cloud Build API (per build delle immagini Docker)
gcloud services enable cloudbuild.googleapis.com

# Abilita Cloud Run API
gcloud services enable run.googleapis.com

# Abilita Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# Verifica che siano abilitate
gcloud services list --enabled
```

---

### STEP 2: Preparare il Progetto Qwik

#### 2.1 Installare l'adapter Express

L'app Qwik ha bisogno di un adapter per girare come applicazione Node.js server-side.

```bash
# Installa le dipendenze per Express (già fatto)
# npm install express @types/compression @types/express compression dotenv

# I file adapter sono già stati creati in:
# - src/entry.express.tsx
# - adapters/express/vite.config.ts
```

**NOTA**: I file dell'adapter Express sono già stati configurati automaticamente nel progetto.

#### 2.2 Verificare la struttura

Dopo l'installazione dovresti avere:
```
judo-qwik/
├── server/
│   └── entry.express.js  (o simile)
├── pb-server
├── pb_data/
├── src/
├── package.json
└── ...
```

---

### STEP 3: Creare i File di Deployment

#### 3.1 Creare il Dockerfile

Crea un file chiamato `Dockerfile` nella root del progetto:

```dockerfile
# Stage 1: Build dell'applicazione
FROM node:20-alpine AS builder

WORKDIR /app

# Copia i file di package e installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia tutto il codice sorgente
COPY . .

# Build dell'applicazione Qwik
RUN npm run build

# Stage 2: Runtime production
FROM node:20-alpine

WORKDIR /app

# Copia solo i file necessari per production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copia il server PocketBase
COPY pb-server ./pb-server
RUN chmod +x ./pb-server

# Crea directory per i dati di PocketBase
RUN mkdir -p ./pb_data

# Esponi le porte
# 8080: Qwik app (Cloud Run usa questa porta)
# 8090: PocketBase API (interno)
EXPOSE 8080 8090

# Copia lo script di avvio
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Avvia l'applicazione
CMD ["./start.sh"]
```

#### 3.2 Creare lo script di avvio

Crea un file chiamato `start.sh` nella root del progetto:

```bash
#!/bin/sh

# Avvia PocketBase in background sulla porta 8090
./pb-server serve --http=0.0.0.0:8090 &

# Aspetta che PocketBase sia pronto
sleep 2

# Avvia l'applicazione Qwik sulla porta 8080
# NOTA: Verifica il nome esatto del file nella cartella server/
PORT=8080 node server/entry.express.js
```

**IMPORTANTE**: Verifica il nome del file entry point nella cartella `server/`. Potrebbe essere:
- `entry.express.js`
- `entry.node.js`
- `index.js`

Modifica lo script di conseguenza.

#### 3.3 Creare .dockerignore

Crea un file chiamato `.dockerignore` nella root del progetto:

```
# Dipendenze (verranno reinstallate)
node_modules
npm-debug.log

# File di development
.git
.gitignore
.env
.env.local
.DS_Store

# IDE
.vscode
.idea
.claude

# Markdown e documentazione
*.md
gcloud.md

# Database temporanei (non vogliamo sovrascrivere i dati)
pb_data/*.db-shm
pb_data/*.db-wal

# Build artifacts locali
dist
server

# Logs
*.log
```

#### 3.4 Aggiornare package.json

Aggiungi o modifica lo script `start` in `package.json`:

```json
{
  "scripts": {
    "build": "qwik build",
    "start": "node server/entry.express.js",
    "dev": "vite --mode ssr"
  }
}
```

---

### STEP 4: Testare Localmente con Docker

Prima di deployare su Cloud Run, testiamo tutto localmente.

#### 4.1 Build dell'immagine Docker locale

```bash
# Dalla root del progetto
docker build -t judo-app-local .
```

Questo processo può richiedere 2-5 minuti. Dovresti vedere:
```
Successfully built xxxxx
Successfully tagged judo-app-local:latest
```

#### 4.2 Eseguire il container localmente

```bash
# Avvia il container
docker run -p 8080:8080 -p 8090:8090 judo-app-local
```

#### 4.3 Testare l'applicazione

Apri il browser:
- **App Qwik**: http://localhost:8080
- **PocketBase Admin**: http://localhost:8090/_/

Se funziona tutto, premi `Ctrl+C` per fermare il container.

---

### STEP 5: Build e Deploy su Cloud Run

#### 5.1 Build dell'immagine con Cloud Build

Google Cloud Build costruirà l'immagine Docker per te nel cloud:

```bash
# Build e push su Google Container Registry
gcloud builds submit --tag gcr.io/judo-qwik-app/judo-app
```

Questo processo:
- Carica il codice su Cloud Build
- Costruisce l'immagine Docker
- La salva su Google Container Registry
- Può richiedere 5-10 minuti

Vedrai un output simile a:
```
DONE
ID: xxxxx-xxxx-xxxx
CREATE_TIME: ...
DURATION: 3m15s
SOURCE: gs://...
IMAGES: gcr.io/judo-qwik-app/judo-app
STATUS: SUCCESS
```

#### 5.2 Deploy su Cloud Run (CONFIGURAZIONE FREE TIER)

Ora deployiamo l'immagine su Cloud Run con la configurazione ottimale per il free tier:

```bash
gcloud run deploy judo-app \
  --image gcr.io/judo-qwik-app/judo-app \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 0.5 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 60 \
  --concurrency 80 \
  --set-env-vars "NODE_ENV=production,POCKETBASE_URL=http://localhost:8090"
```

**Spiegazione dei parametri:**

| Parametro | Valore | Perché |
|-----------|--------|--------|
| `--region` | `europe-west1` | Regione USA gratuita |
| `--memory` | `512Mi` | Ottimale per free tier |
| `--cpu` | `0.5` | Riduce consumo vCPU |
| `--min-instances` | `0` | **CRITICO!** Scala a zero |
| `--max-instances` | `3` | Limita costi in caso di spike |
| `--timeout` | `60` | 60 secondi max per richiesta |
| `--concurrency` | `80` | Max richieste per istanza |

#### 5.3 Conferma quando richiesto

Ti verrà chiesto:
```
Allow unauthenticated invocations to [judo-app] (y/N)?
```

Rispondi `y` per rendere l'app pubblica.

#### 5.4 Ottieni l'URL

Al termine del deploy vedrai:
```
Service [judo-app] revision [judo-app-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://judo-app-xxxxxxxxx-uc.a.run.app
```

**🎉 COMPLIMENTI! La tua app è online e GRATIS!**

---

### STEP 6: Verificare il Deployment

#### 6.1 Aprire l'app

```bash
# Apri automaticamente l'URL nel browser
gcloud run services describe judo-app \
  --region europe-west1 \
  --format="value(status.url)" | xargs open
```

Oppure copia l'URL e aprilo manualmente.

#### 6.2 Verificare i logs

```bash
# Visualizza i logs in tempo reale
gcloud run services logs tail judo-app --region europe-west1

# Oppure gli ultimi 50 log
gcloud run services logs read judo-app --region europe-west1 --limit 50
```

---

## 🔧 Configurazione Avanzata

### Gestione delle Variabili d'Ambiente

#### Creare segreti per dati sensibili

```bash
# Esempio: API key di Mailgun
echo -n "your-mailgun-api-key" | gcloud secrets create MAILGUN_API_KEY --data-file=-

# Concedi accesso al servizio Cloud Run
gcloud secrets add-iam-policy-binding MAILGUN_API_KEY \
  --member="serviceAccount:YOUR-PROJECT-NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### Aggiornare il servizio con i segreti

```bash
gcloud run services update judo-app \
  --region europe-west1 \
  --update-secrets=MAILGUN_API_KEY=MAILGUN_API_KEY:latest
```

### Collegare un Dominio Personalizzato

#### 6.1 Verifica il dominio

```bash
# Mappa il tuo dominio
gcloud run domain-mappings create \
  --service judo-app \
  --domain your-domain.com \
  --region europe-west1
```

#### 6.2 Configura i record DNS

Google Cloud ti dirà quali record DNS aggiungere nel tuo provider:
- Record `A` o `AAAA`
- Record `CNAME`

### Persistenza Dati PocketBase (Bucket GCS)

**IMPORTANTE**: Per impostazione predefinita, Cloud Run è stateless. Per non perdere i dati del database (`pb_data`) e i media ad ogni deploy, utilizzeremo il bucket `gs://judofeltre` montato come volume.

#### 6.1 Configurare i Permessi GCS
Il servizio Cloud Run deve avere i permessi per leggere e scrivere nel bucket. Assicurati di aver concesso il ruolo `Storage Object Admin` all'account di servizio (solitamente quello di Compute Engine):

```bash
# Ottieni il numero del progetto
PROJECT_NUMBER=$(gcloud projects list --filter="qwik-judo-app" --format="value(projectNumber)")

# Concedi i permessi
gcloud projects add-iam-policy-binding judo-qwik-app \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# 6.1.5 (OPZIONALE) Caricare i dati locali sul bucket
# Se hai già dei dati in locale che vuoi mantenere online:
gsutil -m cp -r pb_data/* gs://judofeltre/
```

#### 6.2 Comando di Deploy con Volume Mount
Usa questo comando aggiornato per montare il bucket `judofeltre` direttamente nella cartella `pb_data` di PocketBase:

```bash
gcloud run deploy judo-app \
  --image gcr.io/judo-qwik-app/judo-app \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --add-volume=name=pb-data,type=cloud-storage,bucket=judofeltre \
  --add-volume-mount=volume=pb-data,mount-path=/app/pb_data \
  --set-env-vars "NODE_ENV=production,POCKETBASE_URL=http://localhost:8090"
```

**Nota**: Abbiamo impostato `--max-instances 1` per evitare problemi di lock su SQLite, dato che più istanze non possono scrivere contemporaneamente sullo stesso file DB nel bucket.

#### 6.3 Configurazione Media Ottimizzata (S3)
Per una gestione ottimale dei media, ti consiglio di configurare PocketBase per usare il bucket via S3 API (oltre al mount per il DB):

1. Vai nel pannello Admin di PocketBase -> **Settings** -> **Files storage**.
2. Abilita **S3 Storage**.
3. Configura i campi:
   - **Endpoint**: `https://storage.googleapis.com`
   - **Region**: `europe-west1` (o la tua regione)
   - **Bucket**: `judofeltre`
   - **Access Key / Secret**: Generabili dalla console Google Cloud -> Storage -> Settings -> Interoperability.
   - **Force Path Style**: `ON`.
   - **Upload Url**: (Lascia vuoto o metti l'URL pubblico del bucket se disponibile).

---

## 📊 Monitoraggio e Costi

### Verificare l'Utilizzo Corrente

#### Dashboard Cloud Run

```bash
# Apri la console Cloud Run
open "https://console.cloud.google.com/run?project=judo-qwik-app"
```

Nella dashboard puoi vedere:
- Numero di richieste
- Latenza media
- Consumo memoria/CPU
- Costi stimati

#### Visualizzare metriche dettagliate

```bash
# Metriche del servizio
gcloud run services describe judo-app \
  --region europe-west1 \
  --format="table(status.url, status.traffic)"
```

### Configurare Alert di Budget

**MOLTO IMPORTANTE**: Imposta alert per evitare sorprese!

#### 6.1 Trova il tuo Billing Account ID

```bash
gcloud billing accounts list
```

Copia il `ACCOUNT_ID`.

#### 6.2 Crea un Budget Alert

```bash
gcloud billing budgets create \
  --billing-account=YOUR-BILLING-ACCOUNT-ID \
  --display-name="Free Tier Alert - Judo App" \
  --budget-amount=5EUR \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

Riceverai email quando:
- Spendi €2.50 (50%)
- Spendi €4.50 (90%)
- Spendi €5.00 (100%)

### Calcolo del Consumo Free Tier

**Con la configurazione consigliata (512Mi, 1 CPU):**

| Richieste/giorno | Richieste/mese | Costo stimato |
|------------------|----------------|---------------|
| 1,000 | 30,000 | €0 (FREE) |
| 10,000 | 300,000 | €0 (FREE) |
| 50,000 | 1,500,000 | €0 (FREE) |
| 67,000 | 2,000,000 | €0 (FREE - limite) |
| 100,000 | 3,000,000 | ~€2-3/mese |
| 200,000 | 6,000,000 | ~€8-10/mese |

**Nota**: Con `min-instances=0`, se l'app non riceve traffico per alcuni minuti, scala a zero = €0 costo!

---

## 🔄 Aggiornare l'Applicazione

### Deploy di una Nuova Versione

Ogni volta che modifichi il codice:

```bash
# 1. Build nuova immagine
gcloud builds submit --tag gcr.io/judo-qwik-app/judo-app

# 2. Deploy automaticamente la nuova versione
gcloud run deploy judo-app \
  --image gcr.io/judo-qwik-app/judo-app \
  --region europe-west1
```

Cloud Run manterrà la configurazione precedente (memoria, CPU, env vars).

### Rollback a Versione Precedente

```bash
# Lista tutte le revisioni
gcloud run revisions list --service judo-app --region europe-west1

# Rollback a una revisione specifica
gcloud run services update-traffic judo-app \
  --to-revisions=judo-app-00001-xxx=100 \
  --region europe-west1
```

---

## 🛠️ Troubleshooting

### Problema: "Container failed to start"

**Causa**: Errore nello script di avvio o porta sbagliata.

**Soluzione**:
```bash
# 1. Verifica i logs
gcloud run services logs read judo-app --region europe-west1 --limit 100

# 2. Testa localmente
docker build -t judo-app-debug .
docker run -p 8080:8080 judo-app-debug

# 3. Verifica che l'app ascolti sulla porta 8080
# In start.sh: PORT=8080 node server/entry.express.js
```

### Problema: "Permission denied" durante build

**Causa**: API non abilitate o permessi mancanti.

**Soluzione**:
```bash
# Abilita tutte le API necessarie
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

# Aggiungi permessi
gcloud projects add-iam-policy-binding judo-qwik-app \
  --member="user:tua-email@gmail.com" \
  --role="roles/run.admin"
```

### Problema: Cold Start Lento (>5 secondi)

**Causa**: Container troppo grande o inizializzazione lenta.

**Soluzione**:
```bash
# 1. Riduci dimensioni immagine Docker
# Usa alpine, rimuovi file inutili

# 2. Aumenta min-instances (ATTENZIONE: esci dal free tier!)
gcloud run services update judo-app \
  --region europe-west1 \
  --min-instances 1  # Costa circa €8/mese
```

### Problema: PocketBase perde i dati

**Causa**: Cloud Run è stateless.

**Soluzione temporanea**:
- Per test/sviluppo: ricrea i dati a ogni deploy
- Per produzione: implementa Cloud Storage o Cloud SQL (vedi sezione Configurazione Avanzata)

### Problema: "Quota exceeded"

**Causa**: Hai superato il free tier.

**Soluzione**:
```bash
# 1. Verifica utilizzo
open "https://console.cloud.google.com/billing/reports?project=judo-qwik-app"

# 2. Riduci max-instances
gcloud run services update judo-app \
  --region europe-west1 \
  --max-instances 2

# 3. Verifica che min-instances=0
gcloud run services describe judo-app --region europe-west1
```

### Problema: Build fallisce con errore npm

**Causa**: Dipendenze mancanti o incompatibili.

**Soluzione**:
```bash
# 1. Pulisci e reinstalla localmente
rm -rf node_modules package-lock.json
npm install

# 2. Verifica che package.json e package-lock.json siano committati
git status

# 3. Rebuilda
gcloud builds submit --tag gcr.io/judo-qwik-app/judo-app
```

---

## ❓ FAQ

### Q: Il free tier scade?

**A**: NO! L'Always Free tier di Cloud Run non scade mai. Solo i $300 di crediti iniziali scadono dopo 90 giorni.

### Q: Devo inserire una carta di credito?

**A**: Sì, Google richiede una carta per verificare l'identità, ma NON ti verrà addebitato nulla se resti nel free tier. Puoi anche impostare budget alert per sicurezza.

### Q: Cosa succede se supero il free tier?

**A**: Paghi solo l'eccedenza. Con budget alert riceverai email prima di superare la soglia. Il costo è molto basso: ~€0.02 per 1000 richieste extra.

### Q: Posso usare Cloud Run in Europa?

**A**: Sì! Puoi deployare in qualsiasi regione. Usa `europe-west1` invece di `europe-west1`. Il free tier è globale.

### Q: Come funziona lo scaling a zero?

**A**: Se l'app non riceve richieste per 15 minuti, Cloud Run spegne tutte le istanze. Alla prima richiesta successiva, l'istanza si riavvia (cold start 1-2 secondi).

### Q: Posso connettere un database esterno?

**A**: Sì! Puoi usare:
- Cloud SQL (PostgreSQL, MySQL) - ha anche un free tier limitato
- Database esterni (MongoDB Atlas, Supabase, ecc.)
- PocketBase con Cloud Storage per persistenza

### Q: Come faccio il backup dei dati?

**A**: Per PocketBase:
```bash
# Scarica i dati dal container in esecuzione (avanzato)
# Oppure usa Cloud Storage per persistenza automatica
```

### Q: Posso eseguire cron job?

**A**: Sì, con Cloud Scheduler (free tier: 3 job/mese). Ma ogni esecuzione consuma quota free tier.

### Q: L'app è sicura con `--allow-unauthenticated`?

**A**: Sì, `allow-unauthenticated` significa solo che chiunque può accedere all'URL. Implementa autenticazione nella tua app (es. con PocketBase) per proteggere le route.

### Q: Posso usare WebSocket?

**A**: Sì! Cloud Run supporta WebSocket nativamente.

### Q: Come abilito CORS?

**A**: Configura CORS nella tua app Qwik/Express, non in Cloud Run.

---

## 🎯 Checklist Finale

Prima di considerare il deployment completo:

- [ ] App testata localmente con Docker
- [ ] Build su Cloud Build riuscito
- [ ] Deploy su Cloud Run completato
- [ ] App accessibile via URL pubblico
- [ ] `min-instances=0` impostato (verifica con `gcloud run services describe`)
- [ ] Budget alert configurato (€5)
- [ ] Logs monitorati e senza errori
- [ ] PocketBase funzionante (crea un test record)
- [ ] Variabili d'ambiente sensibili salvate come segreti
- [ ] (Opzionale) Dominio personalizzato configurato
- [ ] (Opzionale) Persistenza dati implementata

---

## 📚 Comandi Utili di Riferimento

```bash
# Lista tutti i servizi Cloud Run
gcloud run services list

# Dettagli servizio
gcloud run services describe judo-app --region europe-west1

# Logs in tempo reale
gcloud run services logs tail judo-app --region europe-west1

# Aggiorna variabile d'ambiente
gcloud run services update judo-app \
  --region europe-west1 \
  --update-env-vars "NEW_VAR=value"

# Cambia memoria/CPU
gcloud run services update judo-app \
  --region europe-west1 \
  --memory 1Gi \
  --cpu 1

# Elimina servizio
gcloud run services delete judo-app --region europe-west1

# Elimina immagine container
gcloud container images delete gcr.io/judo-qwik-app/judo-app

# Visualizza costi
gcloud billing accounts list
open "https://console.cloud.google.com/billing/reports"
```

---

## 🌐 Risorse Utili

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GCP Free Tier Details](https://cloud.google.com/free/docs/free-cloud-features#free-tier-usage-limits)
- [Cloud Run Pricing Calculator](https://cloud.google.com/products/calculator)
- [Qwik Deployment Guide](https://qwik.builder.io/docs/deployments/)
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 📞 Supporto

Se hai problemi durante il deployment:

1. **Controlla i logs**: `gcloud run services logs read judo-app --region europe-west1 --limit 100`
2. **Testa localmente**: `docker build -t test . && docker run -p 8080:8080 test`
3. **Verifica la configurazione**: `gcloud run services describe judo-app --region europe-west1`
4. **Consulta il troubleshooting**: Vedi sezione sopra
5. **Verifica i costi**: https://console.cloud.google.com/billing/reports

---

**🎉 Buon deployment! La tua app Qwik + PocketBase ora gira su Google Cloud GRATIS!**
