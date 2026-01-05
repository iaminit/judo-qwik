#!/bin/bash
set -e

# Colori per output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   🧹 Git Repository Optimizer           ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Mostra dimensione iniziale
echo -e "${YELLOW}Dimensione attuale della cartella .git:${NC}"
du -sh .git
echo ""

echo -e "${GREEN}1. Pulizia reflog (expire now)...${NC}"
git reflog expire --expire=now --all

echo -e "${GREEN}2. Garbage collection aggressiva (prune now)...${NC}"
git gc --prune=now --aggressive

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}✅ Ottimizzazione completata!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Mostra dimensione finale
echo -e "${YELLOW}Nuova dimensione della cartella .git:${NC}"
du -sh .git
