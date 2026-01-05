Relazione Tecnica: Judo App (PocketBase + Qwik)

Il presente documento descrive l'architettura ottimizzata per il progetto Judo App, analizzando la struttura del repository attuale e definendo un piano di gestione a costo quasi zero sfruttando il modello JAMstack.

1. Panoramica dell'Architettura

L'obiettivo è separare il carico computazionale e lo storage dal frontend per massimizzare la velocità e azzerare i costi di hosting.

Frontend (Statico): Basato su Qwik, ospitato gratuitamente su GitHub Pages (iaminit.github.io).

Backend (Dinamico): Istanza PocketBase ospitata su Google Cloud Run. Gestisce il database SQLite, l'autenticazione e l'upload dei media.

Storage: Google Cloud Storage (GCS) per la persistenza del database e dei file multimediali.

2. Analisi della Struttura del Repository

In base ai file presenti nel repository judo-qwik, la struttura è così articolata:

Core & Configurazione

package.json: Gestione dipendenze (Qwik, Tailwind).

vite.config.ts: Configurazione della build.

Dockerfile & cloudbuild.yaml: Script per il deploy automatico su Google Cloud tramite Cloud Build.

adapters/static/: Configurazione per esportare il sito come Static Site Generation (SSG), ideale per GitHub Pages.

Frontend (Qwik)

src/routes/: Contiene la logica delle pagine (Bacheca, Dizionario, Tecniche, Storia).

src/components/admin/: Pannello di gestione per caricamento dati e immagini.

src/global.css: Styling tramite Tailwind CSS.

public/media/: Asset statici correnti (immagini tecniche e audio MP3).

Integrazione Backend

src/lib/pocketbase.ts: Client per la comunicazione con l'API su Cloud Run.

pb-server: Eseguibile PocketBase (Backend).

3. Analisi dei Costi (Regione europe-west1)

Stima calcolata per un bucket di 200MB e aggiornamenti settimanali.

Servizio

Utilizzo Stimato

Costo Mensile

Costo Annuale

GitHub Pages

Hosting Frontend

€0.00

€0.00

Cloud Run

< 2M richieste/mese (Free Tier)

€0.00

€0.00

Cloud Storage

200MB Standard Storage

~€0.005

€0.06

GCS Operations

Scritture settimanali (Class A/B)

€0.00

€0.00

Networking

Traffico dati (Egress < 1GB)

€0.00

€0.00

TOTALE



~€0.00

< €0.10

Nota: Google Cloud solitamente non addebita importi inferiori a 1$.

4. Task di Successione (Piano d'Azione)

Per implementare questa struttura, ecco i passaggi da seguire:

Configurazione Storage:

[ ] Creare un Bucket GCS Standard su europe-west1.

[ ] Configurare Cloud Run per montare il Bucket come volume sulla cartella /pb_data (persistenza DB).

Adattamento Frontend:

[ ] Configurare l'adapter static di Qwik per generare la cartella dist.

[ ] Puntare il repository pubblico iaminit.github.io alla cartella di output della build.

Automazione Deploy (CI/CD):

[ ] Configurare una GitHub Action nel repository privato che, dopo il deploy su Cloud Run, invii un trigger al repository pubblico.

[ ] Configurare il trigger su iaminit.github.io per rigenerare il sito statico (Repository Dispatch).

Sicurezza & CORS:

[ ] Impostare le API Rules su PocketBase.

[ ] Abilitare il dominio iaminit.github.io nelle impostazioni CORS del backend.