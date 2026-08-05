import { $, component$, useComputed$, useSignal } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { getPBFileUrl, pb } from '~/lib/pocketbase';
import { pbAdmin } from '~/lib/pocketbase-admin';

type FijlkamType = 'info' | 'timeline' | 'regulations' | 'programmi';

interface FijlkamRecord {
  id: string;
  collectionId: string;
  titolo: string;
  categoria_secondaria: string;
  descrizione_breve: string;
  contenuto: string;
  tags: string;
  anno: number;
  livello: number;
  ordine: number;
  immagine_principale: string;
  imageUrl: string;
}

const getRecordType = (tags: string): FijlkamType => {
  const normalized = String(tags || '').toLowerCase();
  if (normalized.includes('timeline')) return 'timeline';
  if (normalized.includes('regolamento')) return 'regulations';
  if (normalized.includes('esame_dan')) return 'programmi';
  return 'info';
};

const typeMeta: Record<FijlkamType, { label: string; className: string }> = {
  info: {
    label: 'Informazioni',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  timeline: {
    label: 'Cronologia',
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  },
  regulations: {
    label: 'Regolamento',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  programmi: {
    label: 'Programma DAN',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
};

const toPlainText = (content: string) =>
  String(content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

export const useFijlkamList = routeLoader$<FijlkamRecord[]>(async () => {
  try {
    const records = await pb.collection('fijlkam').getFullList({
      sort: 'ordine,anno,titolo',
      requestKey: null,
    });

    return records.map((record: any) => {
      const image = String(record.immagine_principale || '');
      const imageUrl = !image
        ? ''
        : image.startsWith('http')
          ? image
          : image.startsWith('/media/')
            ? image
            : image.startsWith('media/')
              ? `/${image}`
              : getPBFileUrl(record.collectionId, record.id, image);

      return {
        id: record.id,
        collectionId: record.collectionId,
        titolo: record.titolo || '',
        categoria_secondaria: record.categoria_secondaria || '',
        descrizione_breve: record.descrizione_breve || '',
        contenuto: record.contenuto || '',
        tags: String(record.tags || ''),
        anno: Number(record.anno || 0),
        livello: Number(record.livello || 0),
        ordine: Number(record.ordine || 0),
        immagine_principale: image,
        imageUrl,
      };
    });
  } catch (error) {
    console.error('[Gestione FIJLKAM] Impossibile caricare i contenuti:', error);
    return [];
  }
});

export default component$(() => {
  const listLoader = useFijlkamList();
  const deletedIds = useSignal<string[]>([]);
  const filterText = useSignal('');
  const activeType = useSignal<'all' | FijlkamType>('all');

  const activeItems = useComputed$(() =>
    (listLoader.value || []).filter((item) => !deletedIds.value.includes(item.id))
  );

  const filteredItems = useComputed$(() => {
    const query = filterText.value.toLowerCase().trim();
    return activeItems.value.filter((item) => {
      const type = getRecordType(item.tags);
      if (activeType.value !== 'all' && activeType.value !== type) return false;
      if (!query) return true;
      return (
        item.titolo.toLowerCase().includes(query) ||
        item.categoria_secondaria.toLowerCase().includes(query) ||
        item.descrizione_breve.toLowerCase().includes(query) ||
        toPlainText(item.contenuto).toLowerCase().includes(query) ||
        String(item.anno || '').includes(query) ||
        String(item.livello || '').includes(query)
      );
    });
  });

  const countByType = (type: FijlkamType) =>
    activeItems.value.filter((item) => getRecordType(item.tags) === type).length;

  const handleDelete = $(async (id: string, title: string) => {
    if (!confirm(`Eliminare definitivamente “${title}”?`)) return;
    try {
      await pbAdmin.collection('fijlkam').delete(id);
      deletedIds.value = [...deletedIds.value, id];
    } catch (error) {
      console.error('[Gestione FIJLKAM] Errore eliminazione:', error);
      alert('Impossibile eliminare il contenuto. Accedi nuovamente e riprova.');
    }
  });

  const createButtons: Array<{ type: FijlkamType; label: string }> = [
    { type: 'info', label: 'Informazione' },
    { type: 'timeline', label: 'Evento' },
    { type: 'regulations', label: 'Regolamento' },
    { type: 'programmi', label: 'Programma DAN' },
  ];

  const filters: Array<{ type: 'all' | FijlkamType; label: string }> = [
    { type: 'all', label: `Tutti (${activeItems.value.length})` },
    { type: 'info', label: `Info (${countByType('info')})` },
    { type: 'timeline', label: `Cronologia (${countByType('timeline')})` },
    { type: 'regulations', label: `Regole (${countByType('regulations')})` },
    { type: 'programmi', label: `DAN (${countByType('programmi')})` },
  ];

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div class="flex flex-col gap-5 mb-8">
        <div>
          <Link
            href="/gestione"
            class="inline-block text-sm font-bold no-underline mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ‹ Gestione
          </Link>
          <h1 class="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Gestione FIJLKAM
          </h1>
          <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Gestisci tutti i contenuti federali e le immagini associate ({activeItems.value.length} schede).
          </p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {createButtons.map((button) => (
            <Link
              key={button.type}
              href={`/gestione/fijlkam/new?type=${button.type}`}
              class="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm no-underline transition-colors"
            >
              <span>+</span> {button.label}
            </Link>
          ))}
        </div>
      </div>

      <div class="flex flex-col gap-4 mb-6">
        <input
          type="search"
          placeholder="Cerca per titolo, sezione, testo, anno o grado..."
          value={filterText.value}
          onInput$={(event) => {
            filterText.value = (event.target as HTMLInputElement).value;
          }}
          class="w-full md:max-w-lg px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 outline-none font-medium dark:text-white"
        />

        <div
          class="grid grid-cols-2 sm:grid-cols-5 p-1 rounded-xl border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {filters.map((filter) => (
            <button
              key={filter.type}
              type="button"
              onClick$={() => {
                activeType.value = filter.type;
              }}
              class="px-3 py-2 text-xs font-bold rounded-lg transition-colors"
              style={{
                backgroundColor:
                  activeType.value === filter.type ? '#2563eb' : 'transparent',
                color: activeType.value === filter.type ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.value.length === 0 ? (
        <div
          class="p-12 text-center border rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p class="font-bold" style={{ color: 'var(--color-text)' }}>Nessun contenuto trovato</p>
        </div>
      ) : (
        <div
          class="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredItems.value.map((item) => {
              const type = getRecordType(item.tags);
              const meta = typeMeta[type];
              const description = item.descrizione_breve || toPlainText(item.contenuto);
              const detail =
                type === 'timeline'
                  ? item.anno || 'Anno da impostare'
                  : type === 'programmi'
                    ? `${item.livello || '—'}° DAN`
                    : item.categoria_secondaria;

              return (
                <div key={item.id} class="p-4 md:p-5 flex items-center gap-4">
                  <div
                    class="w-20 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-surface-alt)' }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" class="w-full h-full object-cover" />
                    ) : (
                      <span class="text-2xl opacity-50">🖼️</span>
                    )}
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1">
                      <span class={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${meta.className}`}>
                        {meta.label}
                      </span>
                      {detail && (
                        <span class="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                          {detail}
                        </span>
                      )}
                    </div>
                    <h2 class="font-bold text-base md:text-lg truncate m-0" style={{ color: 'var(--color-text)' }}>
                      {item.titolo || 'Senza titolo'}
                    </h2>
                    {description && (
                      <p class="text-sm truncate m-0 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        {description}
                      </p>
                    )}
                  </div>

                  <div class="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Link
                      href={`/gestione/fijlkam/${item.id}`}
                      class="px-3.5 py-2 text-xs font-bold rounded-lg no-underline bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      Modifica
                    </Link>
                    <button
                      type="button"
                      onClick$={() => handleDelete(item.id, item.titolo)}
                      class="px-3.5 py-2 text-xs font-bold text-red-600 rounded-lg border border-red-200 dark:border-red-900"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Gestione FIJLKAM - JudoOK',
};
