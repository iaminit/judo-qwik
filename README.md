# Judo Qwik App

Questo progetto è un'applicazione web costruita con [Qwik](https://qwik.builder.io/), Docker e PocketBase, deployata su Google Cloud Platform.

## 🔗 Link del Progetto Online

Di seguito trovi i collegamenti diretti a tutte le componenti del progetto attive su Google Cloud:

### 🌍 Applicazione Pubblica
- **Sito Web Live**: [https://judo-app-4hhblbuynq-ew.a.run.app](https://judo-app-4hhblbuynq-ew.a.run.app)
  *(URL alternativo: https://judo-app-238185604112.europe-west1.run.app)*

### ☁️ Infrastruttura Google Cloud
- **Dashboard Progetto**: [GCP Dashboard](https://console.cloud.google.com/home/dashboard?project=judo-qwik-app)
- **Cloud Run (Hosting)**: [Servizio inEsecuzione](https://console.cloud.google.com/run/detail/europe-west1/judo-app/metrics?project=judo-qwik-app)
  *Qui puoi vedere log, metriche e gestire le revisioni del sito.*
- **Cloud Build (CI/CD)**: [Cronologia Build](https://console.cloud.google.com/cloud-build/builds?project=judo-qwik-app)
  *Qui controlli lo stato dei deploy e delle build precedenti.*
- **Cloud Storage (Dati & Media)**: [Bucket 'judofeltre'](https://console.cloud.google.com/storage/browser/judofeltre?project=judo-qwik-app)
  *Contiene il database di PocketBase (`pb_data`) e i file caricati.*

### ⚡️ Edge Integration (Cloudflare)
- **Cloudflare Worker**: [https://judofeltre.roberto-dalzotto.workers.dev/](https://judofeltre.roberto-dalzotto.workers.dev/)

cartella cf da fare upload cartella<25MB
build-cf.sh

  *Endpoint per funzionalità edge o proxy.*

## 🛠 Comandi Utili

### Deploy
Per aggiornare il sito online, esegui lo script di deploy dalla root del progetto:
```bash
./deploy.sh
```
Questo comando:
1. Sincronizza i dati locali (`pb_data`) con il bucket Cloud Storage.
2. Esegue la build del container Docker su Cloud Build.
3. Aggiorna il servizio Cloud Run con la nuova immagine.

### GitHub Pages
Per generare una build statica pronta per GitHub Pages (nella cartella `github-pages`):
```bash
./deploy-gh.sh
```
Questo genererà i file statici in `/github-pages` che potrai pushare su un branch `gh-pages`.

### Sviluppo Locale
```bash
npm run dev
```
Avvia il server di sviluppo locale.

---
*Documentazione generata automaticamente.*
