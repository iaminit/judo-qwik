# Guida alla Pubblicazione su Google Cloud

Questa guida descrive i passaggi per pubblicare il progetto (Qwik Frontend + PocketBase Backend) su Google Cloud Platform.

## Prerequisiti

*   Un account Google Cloud Platform.
*   [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installato e configurato (`gcloud auth login`, `gcloud config set project [PROJECT_ID]`).
*   Docker installato.

## 1. Backend (PocketBase)

PocketBase utilizza SQLite, che richiede un disco persistente. Su Google Cloud, la soluzione più semplice ed economica è utilizzare **Compute Engine** (una VM).

### Opzione A: Compute Engine (Consigliata)

1.  **Creare l'immagine Docker (opzionale ma consigliato per consistenza)**
    ```bash
    # Costruisci l'immagine
    gcloud builds submit --tag gcr.io/[PROJECT_ID]/pocketbase --file Dockerfile.pocketbase .
    ```

2.  **Creare una VM**
    Puoi creare una VM "e2-micro" (spesso gratuita nel tier free) o simile.

    ```bash
    gcloud compute instances create pocketbase-vm \
        --image-family=cos-stable \
        --image-project=cos-cloud \
        --machine-type=e2-micro \
        --zone=europe-west1-b \
        --tags=http-server,https-server
    ```

3.  **Deploy su VM**
    Accedi alla VM via SSH e avvia il container Docker, montando un volume per i dati.
    ```bash
    gcloud compute ssh pocketbase-vm
    # Dentro la VM:
    docker run -d \
      -p 80:8090 \
      -v /var/pocketbase_data:/pb/pb_data \
      gcr.io/[PROJECT_ID]/pocketbase
    ```

    Assicurati di impostare un IP statico se necessario e configurare il firewall per permettere il traffico sulla porta 80.

### Opzione B: Cloud Run (Sperimentale / Stateless)
Cloud Run è stateless. Se riavvii il servizio, perdi i dati a meno che non configuri i "Volume Mounts" (Network File System) o usi LiteStream per replicare su Cloud Storage. **Sconsigliato per produzione semplice senza configurazione avanzata.**

## 2. Frontend (Qwik App)

Il frontend Qwik è configurato per utilizzare l'adapter Cloud Run.

1.  **Ottenere l'URL del Backend**
    Prima di distribuire il frontend, assicurati di avere l'URL pubblico del tuo PocketBase (es. `http://[IP_VM_POCKETBASE]`).

2.  **Costruire e Pubblicare**
    Sostituisci `[PROJECT_ID]` con il tuo ID progetto e `[POCKETBASE_URL]` con l'URL del backend.

    ```bash
    # 1. Costruisci l'immagine e inviala a Container Registry / Artifact Registry
    gcloud builds submit --tag gcr.io/[PROJECT_ID]/qwik-app

    # 2. Distribuisci su Cloud Run
    gcloud run deploy qwik-app \
        --image gcr.io/[PROJECT_ID]/qwik-app \
        --platform managed \
        --region europe-west1 \
        --allow-unauthenticated \
        --set-env-vars PUBLIC_PB_URL=[POCKETBASE_URL]
    ```

    *Nota: `PUBLIC_PB_URL` è la variabile d'ambiente che abbiamo configurato nel codice per puntare al backend.*

## Verifica

Apri l'URL fornito da Cloud Run. L'applicazione dovrebbe caricarsi e connettersi al backend PocketBase specificato.
