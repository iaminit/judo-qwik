import { component$ } from '@builder.io/qwik';

interface CompleteContentFieldsProps {
  record?: Record<string, any>;
  exclude?: string[];
}

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-red-500/20';

const fieldStyle = {
  backgroundColor: 'var(--color-surface)',
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

const dateValue = (value?: string) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

export default component$<CompleteContentFieldsProps>(({ record = {}, exclude = [] }) => {
  const show = (field: string) => !exclude.includes(field);
  const hasExistingFile = (field: string) => Boolean(record?.[field]);

  return (
    <details
      open
      class="rounded-2xl border p-5 md:p-6"
      style={{ backgroundColor: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}
    >
      <summary class="cursor-pointer font-black text-lg" style={{ color: 'var(--color-text)' }}>
        Tutti i campi database
      </summary>
      <p class="text-sm mt-2 mb-5" style={{ color: 'var(--color-text-muted)' }}>
        Campi opzionali condivisi dallo schema. Possono restare vuoti, ma sono sempre disponibili.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        {show('titolo') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Titolo</span>
            <input name="titolo" required value={record.titolo || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('titolo_secondario') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Titolo secondario</span>
            <input name="titolo_secondario" value={record.titolo_secondario || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('slug') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Slug</span>
            <input name="slug" value={record.slug || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('tags') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Tag</span>
            <input name="tags" value={record.tags || ''} placeholder="Separati da virgola" class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('categoria_principale') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Categoria principale</span>
            <input name="categoria_principale" value={record.categoria_principale || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('categoria_secondaria') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Categoria secondaria</span>
            <input name="categoria_secondaria" value={record.categoria_secondaria || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('video_link') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Link video</span>
            <input type="url" name="video_link" value={record.video_link || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('video_id') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">ID video</span>
            <input name="video_id" value={record.video_id || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('link_esterno') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Link esterno</span>
            <input type="url" name="link_esterno" value={record.link_esterno || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('ordine') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Ordine</span>
            <input type="number" name="ordine" value={record.ordine ?? 0} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('livello') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Livello</span>
            <input type="number" name="livello" value={record.livello ?? 0} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('anno') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Anno</span>
            <input type="number" name="anno" value={record.anno ?? 0} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('data_riferimento') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Data di riferimento</span>
            <input type="date" name="data_riferimento" value={dateValue(record.data_riferimento)} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('data_inizio') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Data inizio</span>
            <input type="date" name="data_inizio" value={dateValue(record.data_inizio)} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('data_fine') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">Data fine</span>
            <input type="date" name="data_fine" value={dateValue(record.data_fine)} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('record_correlato_id') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">ID record correlato</span>
            <input name="record_correlato_id" value={record.record_correlato_id || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}

        {show('autore_id') && (
          <label class="space-y-2">
            <span class="block text-xs font-black uppercase tracking-wide">ID autore</span>
            <input name="autore_id" value={record.autore_id || ''} class={INPUT_CLASS} style={fieldStyle} />
          </label>
        )}
      </div>

      {(show('descrizione_breve') || show('contenuto')) && (
        <div class="grid grid-cols-1 gap-5 mt-5">
          {show('descrizione_breve') && (
            <label class="space-y-2">
              <span class="block text-xs font-black uppercase tracking-wide">Descrizione breve</span>
              <textarea name="descrizione_breve" rows={3} value={record.descrizione_breve || ''} class={INPUT_CLASS} style={fieldStyle} />
            </label>
          )}
          {show('contenuto') && (
            <label class="space-y-2">
              <span class="block text-xs font-black uppercase tracking-wide">Contenuto</span>
              <textarea name="contenuto" rows={8} value={record.contenuto || ''} class={INPUT_CLASS} style={fieldStyle} />
            </label>
          )}
        </div>
      )}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        {(['immagine_principale', 'immagine_secondaria', 'audio', 'file_allegato'] as const).map((field) =>
          show(field) ? (
            <div key={field} class="space-y-2">
              <label class="block text-xs font-black uppercase tracking-wide" for={`complete-${field}`}>
                {field.replaceAll('_', ' ')}
              </label>
              {hasExistingFile(field) && (
                <p class="text-xs break-all" style={{ color: 'var(--color-text-muted)' }}>
                  File attuale: {String(record[field])}
                </p>
              )}
              <input
                id={`complete-${field}`}
                type="file"
                name={field}
                accept={field.startsWith('immagine') ? 'image/*' : field === 'audio' ? 'audio/*' : undefined}
                class={INPUT_CLASS}
                style={fieldStyle}
              />
              {hasExistingFile(field) && (
                <label class="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  <input type="checkbox" name={`${field}__remove`} /> Rimuovi il file attuale
                </label>
              )}
            </div>
          ) : null,
        )}
      </div>

      {(show('pubblicato') || show('in_evidenza')) && (
        <div class="flex flex-wrap gap-6 mt-6">
          {show('pubblicato') && (
            <label class="flex items-center gap-3 font-bold">
              <input type="checkbox" name="pubblicato" checked={record.pubblicato !== false} />
              Pubblicato
            </label>
          )}
          {show('in_evidenza') && (
            <label class="flex items-center gap-3 font-bold">
              <input type="checkbox" name="in_evidenza" checked={Boolean(record.in_evidenza)} />
              In evidenza
            </label>
          )}
        </div>
      )}
    </details>
  );
});
