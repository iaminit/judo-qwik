#!/bin/bash

# --- CONFIGURAZIONE ---
PROJECT_ID="judo-qwik-app"
SERVICE_NAME="judo-app"
REGION="europe-west1"
BUCKET_NAME="judofeltre"

# Colori per l'output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Inizio processo di deployment per ${SERVICE_NAME}...${NC}"

# 1. Sincronizzazione Intelligente Database e Media (Solo differenze)
echo -e "${YELLOW}📦 1/3 Sincronizzazione (rsync) di pb_data con il bucket...${NC}"
gsutil -m rsync -r pb_data gs://${BUCKET_NAME}
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sincronizzazione completata.${NC}"
else
    echo -e "⚠️ Errore durante rsync, procedo comunque con la build..."
fi

# 2. Build dell'immagine Docker
echo -e "${YELLOW}🏗️ 2/3 Build e push dell'immagine con Cloud Build...${NC}"
gcloud builds submit --config=cloudbuild.yaml
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completata con successo.${NC}"
else
    echo -e "❌ Errore durante la build. Operazione annullata."
    exit 1
fi

# 3. Deploy su Cloud Run
echo -e "${YELLOW}🚀 3/3 Deploy del nuovo servizio su Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/judo-app \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated
  
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✨ DEPLOY COMPLETATO CON SUCCESSO!${NC}"
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)')
    echo -e "${BLUE}🔗 URL: ${SERVICE_URL}${NC}"
else
    echo -e "❌ Errore durante il deploy su Cloud Run."
    exit 1
fi
