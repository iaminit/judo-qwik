# Changelog - 4 Gennaio 2026

## 📧 Integrazione Email (Sostituzione Mailgun)
- **Nuovo Sistema**: Sostituito il servizio `mailgun.js` con `nodemailer` utilizzando Gmail SMTP.
- **Utility**: Creata nuova utility centralizzata `src/utils/email.ts` per gestire gli invii.
- **API**: Aggiornati tutti gli endpoint in `src/routes/api/email/` per usare la nuova utility.
- **UI Admin**: Aggiornato il pannello di test email (`/gestione/email-test/`) con nuovi campi e istruzioni SMTP.
- **Configurazione**:
  - Variabili d'ambiente locali `.env` aggiornate con credenziali SMTP.
  - Variabili d'ambiente Cloud Run aggiornate per la produzione.

## 🎨 Fix Frontend & CSS
- **Tailwind v4**: Migrazione completata all'integrazione nativa Vite.
  - Installato plugin `@tailwindcss/vite`.
  - Configurato `vite.config.ts`.
  - Rimossa configurazione obsoleta `postcss.config.js`.
  - Ripristinato `src/global.css` con le direttive corrette per v4.

## 🚀 Infrastruttura & Deploy
- **Docker**:
  - Creato script `start.sh` per gestire l'avvio parallelo di PocketBase e Node.js nel container.
  - Fixato `Dockerfile` per includere e usare `start.sh`.
- **Express Server**:
  - Aggiornato `src/entry.express.tsx` per escludere le rotte `/api/email` dal proxy di PocketBase, permettendo la gestione locale.
- **Deploy**: Eseguito deploy con successo su Cloud Run con tutte le fix applicate.

## 🧹 Pulizia
- Rimossi script temporanei di debug.
- Cancellati file di backup e configurazioni duplicate.
- Pulizia branch Git obsoleti.
