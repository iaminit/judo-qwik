# Configurazione Mailgun per JudoOK

Questa guida ti aiuterà a configurare Mailgun per l'invio di email e notifiche nell'applicazione JudoOK.

## 🚀 Setup Rapido

### 1. Ottieni le credenziali Mailgun

1. Vai su [Mailgun](https://www.mailgun.com/)
2. Accedi al tuo account o creane uno nuovo
3. Nel dashboard, vai su **Sending** → **Domains**
4. Copia il tuo dominio (es. `mg.tuodominio.com` o `sandbox-xxx.mailgun.org`)
5. Vai su **Settings** → **API Keys**
6. Copia la tua **Private API key**

### 2. Configura le variabili d'ambiente

Apri il file `.env` nella root del progetto e sostituisci i valori:

```bash
# PocketBase
VITE_PB_URL=http://127.0.0.1:8090

# Mailgun Configuration
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxxxxxxx  # ← La tua API key privata
MAILGUN_DOMAIN=mg.tuodominio.com                # ← Il tuo dominio Mailgun
MAILGUN_FROM_EMAIL=noreply@tuodominio.com       # ← Email mittente
MAILGUN_FROM_NAME=JudoOK Admin                  # ← Nome mittente

# Admin Email (riceverà le notifiche)
ADMIN_EMAIL=tua-email@esempio.com               # ← La tua email per le notifiche
```

### 3. Verifica la configurazione

1. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

2. Vai alla pagina di test:
   ```
   http://localhost:5173/gestione/email-test
   ```

3. Inserisci la tua email e prova a inviare un'email di test

## 📧 Funzioni Disponibili

### `sendEmail(params)`
Invia un'email generica con personalizzazione completa.

```typescript
import { sendEmail } from '~/utils/mailgun';

await sendEmail({
  to: 'utente@esempio.com',
  subject: 'Oggetto dell\'email',
  html: '<h1>Contenuto HTML</h1>',
  text: 'Contenuto testo semplice'
});
```

### `sendAdminTaskNotification(taskData)`
Invia notifica all'admin quando viene creata una nuova task.

```typescript
import { sendAdminTaskNotification } from '~/utils/mailgun';

await sendAdminTaskNotification({
  title: 'Aggiornare documentazione',
  description: 'Completare la documentazione delle kata',
  priority: 'Alta',
  createdBy: 'Roberto Admin'
});
```

### `sendNewPostNotification(postData)`
Invia notifica quando viene pubblicato un nuovo post nella bacheca.

```typescript
import { sendNewPostNotification } from '~/utils/mailgun';

await sendNewPostNotification({
  title: 'Nuovo Evento Judo',
  author: 'Admin',
  excerpt: 'Sabato prossimo ci sarà un seminario speciale...'
});
```

### `sendReminderEmail(reminderData)`
Invia reminder personalizzati.

```typescript
import { sendReminderEmail } from '~/utils/mailgun';

await sendReminderEmail({
  to: 'utente@esempio.com',
  title: 'Scadenza imminente',
  message: 'Ricordati di completare la task entro domani',
  actionUrl: 'https://judook.com/gestione',
  actionLabel: 'Vai al Pannello'
});
```

## 🔌 Endpoint API

### POST `/api/email/test`
Invia un'email di test.

```bash
curl -X POST http://localhost:5173/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "tua-email@esempio.com",
    "subject": "Test",
    "message": "Questa è un'\''email di test"
  }'
```

### POST `/api/email/task-notification`
Invia notifica creazione task all'admin.

```bash
curl -X POST http://localhost:5173/api/email/task-notification \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nuova Task",
    "description": "Descrizione della task",
    "priority": "Alta",
    "createdBy": "Admin"
  }'
```

### POST `/api/email/reminder`
Invia un reminder.

```bash
curl -X POST http://localhost:5173/api/email/reminder \
  -H "Content-Type: application/json" \
  -d '{
    "to": "utente@esempio.com",
    "title": "Reminder",
    "message": "Non dimenticare...",
    "actionUrl": "https://judook.com",
    "actionLabel": "Vai al sito"
  }'
```

## 🔗 Integrazione nei Componenti Esistenti

### Esempio: Inviare notifica quando viene creata una task

Nel file `src/components/admin/admin-task-list.tsx`, dopo aver salvato una task:

```typescript
import { sendAdminTaskNotification } from '~/utils/mailgun';

// Dopo il salvataggio della task
const record = await pb.collection('task_admin').create(taskData);

// Invia notifica email
await sendAdminTaskNotification({
  title: taskData.titolo,
  description: taskData.descrizione,
  priority: taskData.priorita,
  createdBy: 'Admin'
});
```

### Esempio: Notifica per nuovo post bacheca

Nel file `src/components/admin/post-form.tsx`:

```typescript
import { sendNewPostNotification } from '~/utils/mailgun';

// Dopo la creazione del post
const newPost = await pb.collection('bacheca').create(postData);

// Invia notifica
await sendNewPostNotification({
  title: postData.titolo,
  author: 'Admin',
  excerpt: postData.contenuto.substring(0, 150) + '...'
});
```

## 🌍 Region EU vs US

Per impostazione predefinita, il codice usa la region EU di Mailgun:
```typescript
url: 'https://api.eu.mailgun.net'
```

Se il tuo account Mailgun è US, modifica in `src/utils/mailgun.ts`:
```typescript
url: 'https://api.mailgun.net'
```

## 🔒 Sicurezza

⚠️ **IMPORTANTE**:
- NON committare mai il file `.env` con le tue credenziali reali
- Il file `.env.example` contiene solo placeholder
- Le API key sono sensibili - trattale come password

## 📝 Template Email Personalizzati

Puoi creare template HTML personalizzati modificando le funzioni in `src/utils/mailgun.ts`.

I template attuali includono:
- ✅ Design responsive
- ✅ Stili inline per compatibilità email
- ✅ Pulsanti CTA (Call-to-Action)
- ✅ Versione testo semplice automatica

## 🐛 Troubleshooting

### Errore: "MAILGUN_API_KEY non configurata"
- Verifica che il file `.env` sia nella root del progetto
- Controlla che la variabile sia scritta correttamente
- Riavvia il server di sviluppo dopo aver modificato `.env`

### Email non arrivano
- Verifica che il dominio sia stato verificato su Mailgun
- Controlla lo spam della tua casella email
- Verifica i log di Mailgun nel dashboard
- Se usi sandbox domain, aggiungi i destinatari autorizzati su Mailgun

### Errore 401 Unauthorized
- Verifica che l'API key sia corretta
- Assicurati di usare la chiave **privata**, non quella pubblica

## 📚 Risorse

- [Documentazione Mailgun](https://documentation.mailgun.com/)
- [Mailgun.js GitHub](https://github.com/mailgun/mailgun.js)
- [API Reference](https://documentation.mailgun.com/en/latest/api_reference.html)

## 🎯 Prossimi Passi

Dopo aver configurato Mailgun, puoi:

1. ✅ Testare l'invio su `/gestione/email-test`
2. 📧 Integrare le notifiche nei componenti esistenti
3. 🎨 Personalizzare i template HTML
4. 📊 Monitorare le statistiche di invio su Mailgun
5. 🔔 Aggiungere nuovi tipi di notifiche

---

Creato per **JudoOK** - Sistema di gestione Judo
