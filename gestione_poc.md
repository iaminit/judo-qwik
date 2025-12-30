# Gestione - Proof of Concept

## Panoramica

**Gestione** è l'interfaccia di amministrazione per JudoOK, progettata per la gestione completa dei contenuti attraverso PocketBase. L'obiettivo è creare un'interfaccia leggera, intuitiva ed efficace che permetta agli amministratori di gestire tutti i contenuti dell'applicazione senza dover accedere direttamente al pannello admin di PocketBase.

## Architettura

### Stack Tecnologico

- **Frontend**: Qwik (integrato nel progetto esistente)
- **Backend**: PocketBase Admin API
- **Autenticazione**: PocketBase Auth (email/password + OAuth2: Google, Microsoft, Facebook)
- **File Upload**: PocketBase File API
- **Real-time**: PocketBase Realtime Subscriptions (opzionale)

### Approccio Architetturale

```
┌─────────────────────────────────────────────────┐
│           Gestione (Qwik Frontend)              │
│  ┌───────────┬───────────┬───────────┐         │
│  │Dashboard  │ List View │ Edit Form │         │
│  └───────────┴───────────┴───────────┘         │
└─────────────────┬───────────────────────────────┘
                  │
                  │ PocketBase SDK
                  │
┌─────────────────▼───────────────────────────────┐
│            PocketBase Server                    │
│  ┌──────────────────────────────────────┐      │
│  │ Collections:                         │      │
│  │ • techniques     • gallery           │      │
│  │ • dictionary     • bacheca           │      │
│  │ • kata           • community         │      │
│  │ • exam_program   • kaeshi_renraku    │      │
│  │ • fijlkam        • regulations       │      │
│  │ • timeline_*     • users             │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

## Funzionalità Principali

### 1. Dashboard Centrale

**Obiettivo**: Visione d'insieme dell'applicazione

- Statistiche rapide (totale tecniche, gallery items, news, etc.)
- Attività recenti (ultimi contenuti modificati)
- Quick actions (aggiungi tecnica, carica foto, etc.)
- Stato del sistema (storage utilizzato, numero utenti, etc.)

### 2. Gestione Contenuti per Collection

#### 2.1 Tecniche (`techniques`)
- Lista filtrata per gruppo Gokyo
- Ricerca per nome/kanji
- Form di editing con:
  - Nome, kanji, romaji, group
  - Descrizione, key_points (rich text)
  - Upload immagine (.webp)
  - Video URL (YouTube)
  - Tags multipli
- Anteprima card come appare nell'app
- Bulk actions (elimina, cambia gruppo)

#### 2.2 Dizionario (`dictionary`)
- Lista paginata con ricerca
- Form con editor HTML per descrizione
- Import/export CSV per modifiche massive

#### 2.3 Galleria (`gallery`)
- Grid view con thumbnail
- Upload multiplo immagini
- Form con:
  - Titolo, descrizione
  - Tipo (photo/video)
  - Upload immagine o YouTube URL
  - Data, link esterno
- Drag & drop per upload
- Anteprima in-line

#### 2.4 Bacheca/News (`bacheca`)
- Lista cronologica
- Editor WYSIWYG per contenuto
- Gestione allegati
- Stato pubblicazione (draft/published)
- Scheduling (data pubblicazione)

#### 2.5 Community/Eventi (`community`)
- Calendario view per eventi
- Form con date inizio/fine
- Upload locandina evento
- Gestione iscrizioni (opzionale)

#### 2.6 Kata (`kata`)
- Lista gerarchica (gruppi)
- Form con video embed
- Gestione sequenze tecniche

#### 2.7 FIJLKAM & Storia
- Timeline editor visuale
- Gestione items ordinati
- Upload documenti/regolamenti
- Rich text editor per contenuti lunghi

#### 2.8 Programmi d'Esame (`exam_program`)
- Organizzati per DAN level
- Editor strutturato per sezioni
- Preview formattata

#### 2.9 Kaeshi Renraku (`kaeshi_renraku`)
- Lista filtrata per tipo/categoria/difficoltà
- Form con campi tecnica "da" e "a"
- Editor per key points

### 3. Gestione Media

**Obiettivo**: Centralizzare la gestione di immagini e file

- Media library con preview
- Upload multiplo con progress
- Ottimizzazione automatica immagini (resize, compress)
- Organizzazione in cartelle/tags
- Search e filtri per tipo/data
- Eliminazione batch con conferma

### 4. Sistema di Autenticazione e Permessi

**Obiettivo**: Sicurezza e controllo accessi

#### Metodi di Autenticazione

1. **Email/Password**: Login tradizionale con credenziali
2. **OAuth2 Providers**: Autenticazione federata con:
   - **Google** (Gmail/Google Workspace)
   - **Microsoft** (Outlook/Azure AD)
   - **Facebook**
3. **Fallback Admin**: Account admin locale per emergenze

#### Autorizzazioni e Ruoli

- Ruoli: Admin, Editor, Viewer
- Permissions granulari per collection
- Audit log (chi ha modificato cosa e quando)
- Session management con timeout
- 2FA opzionale per account critici

### 5. Utilità e Tools

- **Import/Export**: CSV/JSON per backup e migrazione dati
- **Bulk Operations**: Modifica multipla record
- **Search Globale**: Ricerca full-text attraverso tutte le collections
- **Preview Mode**: Visualizza come appare nell'app prima di salvare
- **Backup Manager**: Snapshot del database su richiesta

## Implementazione Tecnica

### Struttura delle Route

```
/gestione
  /
    → Dashboard
  /login
    → Login form
  /techniques
    → Lista tecniche
    /[id]
      → Edit tecnica
    /new
      → Nuova tecnica
  /gallery
    → Media library grid
    /[id]
      → Edit gallery item
    /upload
      → Upload multiplo
  /dictionary
    → Lista termini
  /bacheca
    → Lista news
  /community
    → Calendario eventi
  /kata
    → Lista kata
  /fijlkam
    → Gestione FIJLKAM content
  /exam-program
    → Programmi per DAN
  /kaeshi-renraku
    → Lista contri/combinazioni
  /settings
    → Configurazioni app
  /users
    → Gestione utenti admin
```

### Componenti Riusabili

#### `DataTable.tsx`
Tabella generica con:
- Sorting
- Filtering
- Pagination
- Bulk select
- Actions column

#### `RichTextEditor.tsx`
Editor WYSIWYG con:
- Formatting tools
- Image embed
- Link insertion
- HTML preview

#### `MediaUploader.tsx`
Upload component con:
- Drag & drop zone
- Progress bar
- Preview thumbnails
- Validation

#### `FormBuilder.tsx`
Form generator dinamico da schema:
- Text, textarea, select, date inputs
- Image upload field
- Rich text field
- Relational picker

#### `PreviewModal.tsx`
Modale per anteprima contenuto come appare nell'app

### Integrazione con PocketBase

#### Autenticazione

```typescript
// ~/lib/pocketbase-admin.ts
import PocketBase from 'pocketbase';

export const pbAdmin = new PocketBase('http://127.0.0.1:8090');

// Traditional Email/Password Login
export const loginAdmin = async (email: string, password: string) => {
  try {
    const authData = await pbAdmin.admins.authWithPassword(email, password);
    return { success: true, admin: authData.admin };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// OAuth2 Login
export const loginWithOAuth2 = async (provider: 'google' | 'microsoft' | 'facebook') => {
  try {
    // Get available OAuth2 providers
    const authMethods = await pbAdmin.collection('users').listAuthMethods();

    // Find the provider config
    const providerConfig = authMethods.authProviders.find(p => p.name === provider);

    if (!providerConfig) {
      return { success: false, error: `Provider ${provider} non configurato` };
    }

    // Redirect to OAuth2 provider
    const redirectUrl = `${window.location.origin}/gestione/auth/callback`;
    const authUrl = `${providerConfig.authUrl}${redirectUrl}`;

    // Store provider for callback
    localStorage.setItem('oauth_provider', provider);

    // Redirect to provider
    window.location.href = authUrl;

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// OAuth2 Callback Handler
export const handleOAuth2Callback = async (code: string, state: string) => {
  try {
    const provider = localStorage.getItem('oauth_provider');

    if (!provider) {
      throw new Error('Provider non trovato');
    }

    // Exchange code for token
    const authData = await pbAdmin.collection('users').authWithOAuth2Code(
      provider,
      code,
      '',  // codeVerifier (not needed for server-side flow)
      `${window.location.origin}/gestione/auth/callback`
    );

    // Check if user has admin role
    if (!authData.record.role || authData.record.role !== 'admin') {
      pbAdmin.authStore.clear();
      throw new Error('Accesso negato: permessi insufficienti');
    }

    localStorage.removeItem('oauth_provider');

    return { success: true, user: authData.record };
  } catch (err) {
    localStorage.removeItem('oauth_provider');
    return { success: false, error: err.message };
  }
};

export const isAdminAuthenticated = () => {
  return pbAdmin.authStore.isValid;
};

export const logoutAdmin = () => {
  pbAdmin.authStore.clear();
  localStorage.removeItem('oauth_provider');
};

// Get current admin user
export const getCurrentAdmin = () => {
  return pbAdmin.authStore.model;
};

// Get auth method used
export const getAuthMethod = () => {
  const user = pbAdmin.authStore.model;
  if (!user) return null;

  // Check if user has OAuth data
  if (user.provider) {
    return `oauth_${user.provider}`;
  }

  return 'email_password';
};
```

#### CRUD Operations

```typescript
// ~/lib/collections-api.ts
import { pbAdmin } from '~/lib/pocketbase-admin';

export const getRecords = async (collection: string, options = {}) => {
  return await pbAdmin.collection(collection).getFullList({
    sort: '-created',
    ...options,
  });
};

export const getRecord = async (collection: string, id: string) => {
  return await pbAdmin.collection(collection).getOne(id);
};

export const createRecord = async (collection: string, data: any) => {
  return await pbAdmin.collection(collection).create(data);
};

export const updateRecord = async (collection: string, id: string, data: any) => {
  return await pbAdmin.collection(collection).update(id, data);
};

export const deleteRecord = async (collection: string, id: string) => {
  return await pbAdmin.collection(collection).delete(id);
};

export const uploadFile = async (collection: string, id: string, field: string, file: File) => {
  const formData = new FormData();
  formData.append(field, file);
  return await pbAdmin.collection(collection).update(id, formData);
};
```

#### Real-time Updates (Opzionale)

```typescript
// Subscribe to changes for live updates
export const subscribeToCollection = (
  collection: string,
  callback: (data: any) => void
) => {
  pbAdmin.collection(collection).subscribe('*', callback);
};

export const unsubscribeFromCollection = (collection: string) => {
  pbAdmin.collection(collection).unsubscribe('*');
};
```

### Middleware di Protezione

```typescript
// ~/middleware/admin-auth.ts
import { type RequestHandler } from '@builder.io/qwik-city';
import { isAdminAuthenticated } from '~/lib/pocketbase-admin';

export const onRequest: RequestHandler = async ({ redirect, url }) => {
  const isAuthRoute = url.pathname === '/gestione/login';
  const isAuthenticated = isAdminAuthenticated();

  if (!isAuthenticated && !isAuthRoute) {
    throw redirect(302, '/gestione/login');
  }

  if (isAuthenticated && isAuthRoute) {
    throw redirect(302, '/gestione');
  }
};
```

## UI/UX Design

### Principi di Design

1. **Semplicità**: Interfaccia pulita senza elementi superflui
2. **Efficienza**: Azioni comuni accessibili in 1-2 click
3. **Feedback Visivo**: Conferme, errori e successi chiari
4. **Responsività**: Funziona su desktop e tablet
5. **Dark Mode**: Supporto tema scuro per comfort visivo

### Layout

```
┌─────────────────────────────────────────────────┐
│ Header: JudoOK Gestione | User Menu            │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ Sidebar  │         Main Content Area           │
│          │                                      │
│ • Home   │  ┌────────────────────────────┐     │
│ • Tech   │  │                            │     │
│ • Dict   │  │  Page Content              │     │
│ • Kata   │  │  (Dashboard, List, Form)   │     │
│ • Gall   │  │                            │     │
│ • Bach   │  └────────────────────────────┘     │
│ • Comm   │                                      │
│ • FIJL   │                                      │
│ • Exam   │                                      │
│ • K-R    │                                      │
│ ───────  │                                      │
│ • Media  │                                      │
│ • Users  │                                      │
│ • Settings                                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Color Scheme

- **Primary**: Blue #3b82f6 (azioni principali)
- **Success**: Green #10b981 (conferme, salvataggio)
- **Warning**: Yellow #f59e0b (attenzione)
- **Danger**: Red #ef4444 (eliminazione, errori)
- **Neutral**: Gray scale per background e testo

## Security Considerations

### 1. Autenticazione e Autorizzazione

- **Admin-only Access**: Solo utenti con ruolo admin possono accedere
- **OAuth2 Security**: Token exchange sicuro, no credential exposure
- **Session Timeout**: 2 ore di inattività → logout automatico
- **CSRF Protection**: Token per form submissions
- **Password Policy**: Minimo 10 caratteri, complessità richiesta (solo per auth tradizionale)
- **Rate Limiting**: Limitazione tentativi login (email/password e OAuth)

### 2. Validazione Input

- **Client-side**: Validazione immediata per UX
- **Server-side**: Validazione obbligatoria in PocketBase rules
- **Sanitizzazione**: HTML sanitizer per rich text
- **File Upload**: Whitelist di estensioni, size limit (10MB)

### 3. Audit e Logging

- **Action Log**: Chi ha fatto cosa e quando
- **Change History**: Versionamento modifiche importanti
- **Failed Login Attempts**: Rate limiting e notifiche

### 4. Data Protection

- **Backup Automatici**: Snapshot giornalieri database
- **Soft Delete**: Cestino per recovery accidentali
- **Data Encryption**: Dati sensibili cifrati at rest

## Configurazione OAuth2 Providers

Per abilitare l'autenticazione con Google, Microsoft e Facebook, è necessario configurare i provider OAuth2 in PocketBase e nelle console developer dei rispettivi servizi.

### Setup PocketBase

1. Accedi al **PocketBase Admin UI** (`http://127.0.0.1:8090/_/`)
2. Vai su **Settings** → **Auth providers**
3. Abilita i provider desiderati

### 1. Google OAuth2

#### Step 1: Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita **Google+ API** e **People API**
4. Vai su **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configura il consenso screen:
   - **App name**: JudoOK Gestione
   - **User support email**: tua email
   - **Scopes**: `.../auth/userinfo.email`, `.../auth/userinfo.profile`
6. Crea OAuth client:
   - **Application type**: Web application
   - **Name**: JudoOK Admin
   - **Authorized JavaScript origins**: `http://localhost:3000`, `https://tuodominio.com`
   - **Authorized redirect URIs**:
     - `http://127.0.0.1:8090/api/oauth2-redirect`
     - `http://localhost:3000/gestione/auth/callback`
     - `https://tuodominio.com/gestione/auth/callback`
7. Copia **Client ID** e **Client Secret**

#### Step 2: PocketBase Configuration

1. Vai su PocketBase Admin → **Settings** → **Auth providers** → **Google**
2. Abilita il provider
3. Inserisci **Client ID** e **Client Secret** da Google Cloud Console
4. Salva

### 2. Microsoft OAuth2 (Azure AD)

#### Step 1: Azure Portal

1. Vai su [Azure Portal](https://portal.azure.com/)
2. Vai su **Azure Active Directory** → **App registrations** → **New registration**
3. Configura:
   - **Name**: JudoOK Gestione
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**:
     - Platform: Web
     - URI: `http://127.0.0.1:8090/api/oauth2-redirect`
4. Registra l'applicazione
5. Copia **Application (client) ID**
6. Vai su **Certificates & secrets** → **New client secret**
   - **Description**: PocketBase Auth
   - **Expires**: 24 months (o Custom)
7. Copia il **Value** del secret (sarà visibile solo ora!)
8. Vai su **API permissions** → **Add a permission** → **Microsoft Graph**
   - Aggiungi: `User.Read`, `email`, `profile`, `openid`
9. Vai su **Authentication** → **Add a platform** → **Web**
   - Aggiungi redirect URIs per produzione

#### Step 2: PocketBase Configuration

1. Vai su PocketBase Admin → **Settings** → **Auth providers** → **Microsoft**
2. Abilita il provider
3. Inserisci:
   - **Client ID**: Application (client) ID da Azure
   - **Client Secret**: Secret value da Azure
   - **Tenant**: `common` (per personal + organizational accounts)
4. Salva

### 3. Facebook OAuth2

#### Step 1: Facebook Developers

1. Vai su [Facebook Developers](https://developers.facebook.com/)
2. Crea una nuova app o seleziona esistente
3. Vai su **Settings** → **Basic**
4. Aggiungi **Facebook Login** come product
5. Vai su **Facebook Login** → **Settings**
6. Configura **Valid OAuth Redirect URIs**:
   - `http://127.0.0.1:8090/api/oauth2-redirect`
   - `http://localhost:3000/gestione/auth/callback`
   - `https://tuodominio.com/gestione/auth/callback`
7. Salva le modifiche
8. Torna su **Settings** → **Basic**
9. Copia **App ID** e **App Secret**

#### Step 2: PocketBase Configuration

1. Vai su PocketBase Admin → **Settings** → **Auth providers** → **Facebook**
2. Abilita il provider
3. Inserisci:
   - **Client ID**: App ID da Facebook
   - **Client Secret**: App Secret da Facebook
4. Salva

### Implementazione UI - Login Page

```typescript
// ~/routes/gestione/login/index.tsx
import { component$, $ } from '@builder.io/qwik';
import { loginAdmin, loginWithOAuth2 } from '~/lib/pocketbase-admin';

export default component$(() => {
  const handleEmailLogin = $(async (email: string, password: string) => {
    const result = await loginAdmin(email, password);
    if (result.success) {
      // Redirect to dashboard
      window.location.href = '/gestione';
    } else {
      // Show error
      alert(result.error);
    }
  });

  const handleOAuthLogin = $(async (provider: 'google' | 'microsoft' | 'facebook') => {
    await loginWithOAuth2(provider);
  });

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            JudoOK Gestione
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Accedi al pannello di amministrazione
          </p>
        </div>

        {/* OAuth Buttons */}
        <div class="space-y-3">
          <button
            onClick$={() => handleOAuthLogin('google')}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              {/* Google Icon SVG */}
            </svg>
            <span class="font-medium text-gray-700 dark:text-gray-200">
              Continua con Google
            </span>
          </button>

          <button
            onClick$={() => handleOAuthLogin('microsoft')}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              {/* Microsoft Icon SVG */}
            </svg>
            <span class="font-medium text-gray-700 dark:text-gray-200">
              Continua con Microsoft
            </span>
          </button>

          <button
            onClick$={() => handleOAuthLogin('facebook')}
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              {/* Facebook Icon SVG */}
            </svg>
            <span class="font-medium text-gray-700 dark:text-gray-200">
              Continua con Facebook
            </span>
          </button>
        </div>

        {/* Divider */}
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">oppure</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form
          preventdefault:submit
          onSubmit$={(e) => {
            const formData = new FormData(e.target as HTMLFormElement);
            const email = formData.get('email') as string;
            const password = formData.get('password') as string;
            handleEmailLogin(email, password);
          }}
          class="space-y-4"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Accedi
          </button>
        </form>
      </div>
    </div>
  );
});
```

### OAuth Callback Route

```typescript
// ~/routes/gestione/auth/callback/index.tsx
import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { handleOAuth2Callback } from '~/lib/pocketbase-admin';

export default component$(() => {
  const loc = useLocation();

  useVisibleTask$(async () => {
    const code = loc.url.searchParams.get('code');
    const state = loc.url.searchParams.get('state');

    if (code && state) {
      const result = await handleOAuth2Callback(code, state);

      if (result.success) {
        // Redirect to dashboard
        window.location.href = '/gestione';
      } else {
        // Redirect to login with error
        window.location.href = `/gestione/login?error=${encodeURIComponent(result.error)}`;
      }
    } else {
      // Invalid callback
      window.location.href = '/gestione/login?error=invalid_callback';
    }
  });

  return (
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400">Autenticazione in corso...</p>
      </div>
    </div>
  );
});
```

### Best Practices

1. **Ambiente di Sviluppo**: Usa redirect URIs localhost per testing
2. **Produzione**: Configura redirect URIs con HTTPS obbligatorio
3. **Scopes Minimi**: Richiedi solo permessi necessari (email, profile)
4. **Error Handling**: Gestisci errori di autenticazione con messaggi chiari
5. **Fallback**: Mantieni sempre autenticazione email/password come fallback
6. **User Mapping**: Assicurati che gli utenti OAuth abbiano il campo `role` impostato a `admin`
7. **Testing**: Testa tutti i provider in ambiente staging prima del deploy

### Troubleshooting Comuni

**Google**:
- Errore "redirect_uri_mismatch" → Verifica che URI in Google Cloud Console corrisponda esattamente
- Errore "access_denied" → Utente ha rifiutato permessi

**Microsoft**:
- Errore "AADSTS50011" → Redirect URI non configurato in Azure
- Errore "invalid_client" → Client Secret scaduto o errato

**Facebook**:
- Errore "Can't Load URL" → Redirect URI non in whitelist
- App in "Development Mode" → Solo admin/developer/tester possono autenticarsi

## Roadmap di Implementazione

### Fase 1: MVP (2-3 settimane)
- [ ] Setup route `/gestione` con middleware auth
- [ ] Login page con email/password
- [ ] Configurazione OAuth2 providers (Google, Microsoft, Facebook)
- [ ] OAuth callback handler e redirect logic
- [ ] Dashboard basilare con statistiche
- [ ] CRUD completo per Techniques
- [ ] Media uploader per immagini

### Fase 2: Core Features (2 settimane)
- [ ] CRUD per Dictionary, Kata, Gallery
- [ ] Rich text editor integrato
- [ ] Search globale
- [ ] Bulk operations

### Fase 3: Advanced Features (1-2 settimane)
- [ ] CRUD per tutte le collections rimanenti
- [ ] Media library completa
- [ ] Import/Export CSV/JSON
- [ ] Preview mode

### Fase 4: Polish & Optimization (1 settimana)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Mobile responsive
- [ ] Documentazione utente

## Testing Strategy

### Unit Tests
- Utility functions
- Form validation logic
- API call wrappers

### Integration Tests
- PocketBase API integration
- File upload flow
- Authentication flow (email/password)
- OAuth2 flow (Google, Microsoft, Facebook)
- Token refresh e session management

### E2E Tests
- Login tradizionale → Dashboard → CRUD operations → Logout
- OAuth login (per ogni provider) → Dashboard → Logout
- File upload → Media library → Delete
- Bulk operations
- Error handling OAuth (denied permissions, invalid state)

## Metriche di Successo

- **Performance**: Caricamento pagine < 1s
- **Usabilità**: Task completion rate > 95%
- **Affidabilità**: Uptime > 99.9%
- **Sicurezza**: Zero vulnerabilità critiche
- **Autenticazione OAuth**: Tasso di successo login > 98%, tempo medio login < 5s
- **Adozione OAuth**: Preferenza utenti OAuth vs tradizionale (target: > 60%)

## Alternative Considerate

### 1. Usare PocketBase Admin UI direttamente
**Pro**: Zero sviluppo necessario
**Contro**: Non personalizzabile, UX non ottimizzata per il caso d'uso specifico

### 2. CMS Headless esterno (Strapi, Directus)
**Pro**: Feature-rich out of the box
**Contro**: Complessità aggiuntiva, costi hosting separati

### 3. Custom Backend + Admin Panel
**Pro**: Controllo totale
**Contro**: Overhead di sviluppo e manutenzione eccessivo

**Scelta: Gestione personalizzata su PocketBase** offre il miglior bilanciamento tra semplicità, flessibilità e integrazione.

## Conclusioni

Gestione sarà un'interfaccia admin leggera ma potente che:
- Semplifica la gestione dei contenuti per gli amministratori
- Si integra nativamente con PocketBase
- Fornisce un'esperienza d'uso ottimizzata per il dominio Judo
- Offre autenticazione moderna e sicura (email/password + OAuth2)
- Mantiene un'architettura semplice e manutenibile
- Garantisce sicurezza e affidabilità

L'implementazione incrementale (MVP → Full Features) permette di validare l'approccio e iterare basandosi sul feedback reale degli utilizzatori.

---

**Next Steps**:
1. Review e approvazione del POC
2. Setup iniziale `/gestione/login` e middleware
3. Implementazione Dashboard MVP
4. Iterazione su feedback

