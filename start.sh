#!/bin/sh
# Avvia PocketBase in background
./pb-server serve --http=127.0.0.1:8090 &

# Attendi qualche secondo che PB parta
sleep 2

# Avvia l'app Qwik
# ORIGIN è importante per Qwik City in produzione
# PORT 8080 è la porta standard di Cloud Run
export ORIGIN=https://judo.1ms.it
export PORT=8080

node server/entry.express.js
