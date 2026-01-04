#!/bin/bash

# Configurazione
BUCKET_NAME="judofeltre"

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  Attenzione: Questo script sovrascriverà il database locale con quello online.${NC}"
echo -e "${YELLOW}🛑 Assicurati di aver fermato il server PocketBase locale prima di procedere.${NC}"
read -p "Vuoi continuare? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operazione annullata."
    exit 1
fi

echo -e "${YELLOW}📥 Scaricamento dati da Google Storage (gs://${BUCKET_NAME})...${NC}"

# Esegue rsync dal bucket alla cartella locale pb_data
# -m: multi-thread (più veloce)
# -r: ricorsivo
# -d: delete (cancella file locali che non esistono più in remoto - opzionale, meglio di no per sicurezza o si?)
# Solitamente per un pull clean si vuole la copia esatta, ma per sicurezza usiamo rsync semplice prima.
# Se l'utente vuole un mirror esatto, dovrebbe usare -d. 
# Nel deploy.sh usava "gsutil -m rsync -r pb_data gs://${BUCKET_NAME}" (local -> remote)
# Qui facciamo il contrario.

gsutil -m rsync -r gs://${BUCKET_NAME} pb_data

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database e Media sincronizzati con successo!${NC}"
else
    echo -e "❌ Errore durante il download."
    exit 1
fi
