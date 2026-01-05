#!/bin/bash
set -e

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   🧹 Project Cleaner                    ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

clean_build() {
    echo -e "${RED}🗑️  Rimuovo artifacts di build (dist, server, github-pages)...${NC}"
    rm -rf dist
    rm -rf server
    rm -rf github-pages
}

clean_cache() {
    echo -e "${RED}🗑️  Rimuovo cache (node_modules/.cache, .vite)...${NC}"
    rm -rf node_modules/.cache
    rm -rf node_modules/.vite
}

clean_temp() {
    echo -e "${RED}🗑️  Rimuovo file temporanei e log (.DS_Store, tmp/, *.log)...${NC}"
    rm -rf tmp/*
    find . -maxdepth 3 -name ".DS_Store" -delete
    find . -maxdepth 3 -name "*.log" -delete
}

echo -e "${YELLOW}Seleziona cosa vuoi pulire:${NC}"
echo "1) Build Artifacts (dist, server, github-pages)"
echo "2) Caches (node_modules/.cache)"
echo "3) Temp Files (.DS_Store, tmp/, *.log)"
echo "4) TUTTO (Deep Clean)"
echo "q) Annulla"
echo ""
read -p "Scelta: " choice

case $choice in
    1)
        clean_build
        ;;
    2)
        clean_cache
        ;;
    3)
        clean_temp
        ;;
    4)
        clean_build
        clean_cache
        clean_temp
        ;;
    q|Q)
        echo "Operazione annullata."
        exit 0
        ;;
    *)
        echo "❌ Scelta non valida."
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Pulizia completata!${NC}"
