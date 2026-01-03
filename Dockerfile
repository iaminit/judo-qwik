# Stage 1: Build dell'applicazione
FROM node:20-alpine AS builder

WORKDIR /app

# Copia i file di package e installa dipendenze
COPY package*.json ./
RUN npm ci

# Copia tutto il codice sorgente
COPY . .

# Build dell'applicazione Qwik
RUN npm run build

# Stage 2: Runtime production
FROM node:20-alpine

# Installa dipendenze necessarie (curl per health check, unzip per scaricare PB)
RUN apk add --no-cache curl unzip

WORKDIR /app

# Copia i file generati dalla build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# --- SCARICA POCKETBASE PER LINUX (Versione 0.34.2 per match con locale) ---
ENV PB_VERSION=0.35.0
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /app/ && \
    mv /app/pocketbase /app/pb-server && \
    chmod +x /app/pb-server && \
    rm /tmp/pb.zip

# Copia i dati del database
COPY pb_data/ ./pb_data/

# Copia le migrazioni se presenti
COPY pb_migrations/ ./pb_migrations/

# Esponi le porte
EXPOSE 8080 8090

COPY start.sh ./start.sh
RUN chmod +x ./start.sh

CMD ["./start.sh"]
