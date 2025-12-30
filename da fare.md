da fare

Ecco il report dettagliato sullo stato attuale del backend (area gestionale) e sugli interventi necessari per completare l'infrastruttura amministrativa.

1. Architettura e Standardizzazione (Priorità Alta)
Conversione List Views: Al momento, diverse sezioni (Gallery, Kata, Storia) utilizzano ancora useResource$. Per garantire una gestione robusta dell'autenticazione ed evitare mismatch di idratazione, conviene convertirle a Signals + useVisibleTask$ (come già fatto per Bacheca e Dizionario).
Feedback Errori: Migliorare il parsing degli errori di PocketBase nei form (specialmente in post-form e technique-form) per mostrare messaggi specifici all'utente (es. "Campo obbligatorio mancante") invece dell'errore generico 400.
2. Funzionalità Mancanti (Priorità Media)
Gestione Impostazioni (/gestione/settings): Attualmente è un placeholder che rimanda al pannello di PocketBase. È necessario implementare un'interfaccia per gestire i metadati globali (Titolo sito, Meta description, Link social, Orari Dojo).
Gestione Membri (/gestione/community): La sezione "Membri" è vuota. Servirebbe una tabella per visualizzare gli iscritti, gestire i ruoli (Sensei, Allievo, Admin) e resettare le password se necessario.
Media Center Integrato: Manca una pagina per gestire i file fisici nella cartella public/media. Sarebbe utile un tool che elenchi i file "orfani" (non collegati a nessuna tecnica o post) per pulire lo storage.
3. Raffinatezza UI/UX (Priorità Bassa)
Bulk Actions: Aggiungere la possibilità di selezionare più elementi tramite checkbox nelle tabelle per eliminazioni di massa o cambi di stato (es. "Sposta tutti i post selezionati in archivio").
Preview Rich Text: Nel rich-text-editor.tsx, aggiungere un pulsante "Preview" per vedere come apparirà il contenuto nel modal frontend prima di salvare definitivamente.
Status Dashboard: Implementare grafici reali (anche semplici via CSS/SVG) nel dashboard principale per mostrare la crescita dei contenuti o l'attività recente degli admin.
4. Ottimizzazione Asset
Gestione Audio: Implementare un sistema di upload audio anche per il Dizionario (attualmente cerca solo file locali per nome).
Validazione Immagini: Aggiungere un controllo durante l'upload che verifichi le dimensioni delle immagini (es. avvisare se un'immagine è troppo pesante per il mobile).
Cosa vuoi affrontare per primo? Posso iniziare standardizzando le pagine di gestione Gallery o Kata per portarle allo stesso livello di performance della Bacheca.

