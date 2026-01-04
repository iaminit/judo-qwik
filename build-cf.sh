#!/bin/bash

# Script per generare build statica in cartella cf/

echo "🚧 Creazione build statica per Cloudflare in /cf..."

# 1. Pulizia iniziale
rm -rf dist
rm -rf cf
mkdir cf

# 2. Build Client (genera assets in dist)
echo "📦 Building client..."
# FORZIAMO l'URL del backend pubblico (per la build statica)
# VITE_PB_PUBLIC_URL instruisce pocketbase.ts a generare URL assoluti
export VITE_PB_PUBLIC_URL=https://judo.1ms.it

npm run build.client

# 3. Build Static (genera HTML in dist)
echo "📄 Generating static HTML..."
npm run build.static

# 4. Spostamento in cf
echo "📂 Copia in cartella cf..."
cp -r dist/* cf/

# 5. Ripristino dist pulita (opzionale) o rimozione
# rm -rf dist

echo "✅ Build statica completata! I file sono pronti in: ./cf"
