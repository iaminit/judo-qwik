#!/bin/bash
set -e

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   🥋 Judo Qwik - Deployment Manager     ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "Seleziona l'operazione da eseguire:"
echo ""
echo -e "1) ${GREEN}Deploy su GitHub Pages${NC} (Static Site)"
echo -e "2) ${GREEN}Deploy su Google Cloud Run${NC} (Container)"
echo -e "3) ${GREEN}Build per Cloudflare${NC}"
echo -e "4) ${YELLOW}Sync Dati (Pull Data)${NC}"
echo -e "5) ${YELLOW}Ottimizza .git (Reduce Size)${NC}"
echo -e "6) ${YELLOW}Pulizia Progetto (Clean Up)${NC}"
echo -e "q) Esci"
echo ""
read -p "Scelta: " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚀 Avvio deploy su GitHub Pages...${NC}"
        ./deploy-github-pages.sh
        ;;
    2)
        echo ""
        echo -e "${GREEN}🚀 Avvio deploy su Google Cloud Run...${NC}"
        ./deploy-gcloude.sh
        ;;
    3)
        echo ""
        echo -e "${GREEN}🏗️  Avvio build Cloudflare...${NC}"
        ./build-cloudeflare.sh
        ;;
    4)
        echo ""
        echo -e "${YELLOW}🔄 Avvio sincronizzazione dati...${NC}"
        ./pull-data.sh
        ;;
    5)
        echo ""
        echo -e "${YELLOW}🧹 Avvio ottimizzazione Git...${NC}"
        ./git-optimize.sh
        ;;
    6)
        echo ""
        echo -e "${YELLOW}🧹 Avvio pulizia progetto...${NC}"
        ./clean-project.sh
        ;;
    q|Q)
        echo "Uscita."
        exit 0
        ;;
    *)
        echo "❌ Scelta non valida."
        exit 1
        ;;
esac
