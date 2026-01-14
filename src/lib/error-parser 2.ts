export const parsePbError = (err: any): string => {
    console.error('[PocketBase Error Parser]', err);

    if (err.response?.data) {
        const data = err.response.data;
        const messages: string[] = [];

        for (const [field, errorObj] of Object.entries(data)) {
            const info = errorObj as any;
            messages.push(`${field.toUpperCase()}: ${info.message}`);
        }

        if (messages.length > 0) {
            return 'Dati non validi:\n• ' + messages.join('\n• ');
        }
    }

    if (err.message === 'Failed to fetch') {
        return 'Errore di rete: Impossibile connettersi al server PocketBase.';
    }

    return err.message || 'Errore sconosciuto durante il salvataggio.';
};
