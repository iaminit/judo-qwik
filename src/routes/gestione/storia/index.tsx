import { $, component$, useComputed$, useSignal } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { pb } from '~/lib/pocketbase';

export interface HistoryRecord {
  id: string;
  titolo: string;
  titolo_secondario: string;
  descrizione_breve: string;
  contenuto: string;
  anno: number;
  ordine: number;
  tags: string;
}

const isTimelineRecord = (item: Pick<HistoryRecord, 'tags'>) =>
  String(item.tags || '')
    .split(',')
    .some((tag) => tag.trim().toLowerCase() === 'timeline');

const toPlainText = (content: string) =>
  String(content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

export const useHistoryList = routeLoader$<HistoryRecord[]>(async () => {
  try {
    const records = await pb.collection('storia').getFullList<HistoryRecord>({
      sort: 'anno,ordine,titolo',
      requestKey: null,
    });

    return records.map((record: any) => ({
      id: record.id,
      titolo: record.titolo || '',
      titolo_secondario: record.titolo_secondario || '',
      descrizione_breve: record.descrizione_breve || '',
      contenuto: record.contenuto || '',
      anno: Number(record.anno || 0),
      ordine: Number(record.ordine || 0),
      tags: String(record.tags || ''),
    }));
  } catch (error) {
    console.error('[Gestione Storia] Impossibile caricare i record:', error);
    return [];
  }
});

export default component$(() => {
  const listLoader = useHistoryList();
  const deletedIds = useSignal<string[]>([]);
  const filterText = useSignal('');
  const activeType = useSignal<'all' | 'article' | 'timeline'>('all');

  const activeItems = useComputed$(() =>
    (listLoader.value || []).filter((item) => !deletedIds.value.includes(item.id))
  );

  const articleCount = useComputed$(() =>
    activeItems.value.filter((item) => !isTimelineRecord(item)).length
  );

  const timelineCount = useComputed$(() =>
    activeItems.value.filter((item) => isTimelineRecord(item)).length
  );

  const filteredItems = useComputed$(() => {
    const query = filterText.value.toLowerCase().trim();

    return activeItems.value.filter((item) => {
      const isTimeline = isTimelineRecord(item);
      const matchesType =
        activeType.value === 'all' ||
        (activeType.value === 'timeline' && isTimeline) ||
        (activeType.value === 'article' && !isTimeline);

      if (!matchesType) return false;
      if (!query) return true;

      return (
        item.titolo.toLowerCase().includes(query) ||
        item.titolo_secondario.toLowerCase().includes(query) ||
        item.descrizione_breve.toLowerCase().includes(query) ||
        toPlainText(item.contenuto).toLowerCase().includes(query) ||
        String(item.anno || '').includes(query)
      );
    });
  });

  const handleDelete = $(async (id: string, title: string) => {
    if (!confirm(`Eliminare definitivamente “${title}”?`)) return;

    try {
      await pbAdmin.collection('storia').delete(id);
      deletedIds.value = [...deletedIds.value, id];
    } catch (error) {
      console.error('[Gestione Storia] Errore durante l’eliminazione:', error);
      alert('Impossibile eliminare il contenuto. Accedi nuovamente e riprova.');
    }
  });

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <Link
              href="/gestione"
              class="text-sm font-bold no-underline"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ‹ Gestione
            </Link>
          </div>
          <h1 class="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Storia del Judo
          </h1>
          <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {articleCount.value} articoli storici e {timelineCount.value} eventi della cronologia.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <Link
            href="/gestione/storia/new?type=timeline"
            class="inline-flex items-center justify-center gap-2 px-5 py-3 font-bold rounded-xl border no-underline transition-colors"
            style={{
              color: 'var(--color-action)',
              borderColor: 'var(--color-action)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <span>+</span> Nuovo Evento
          </Link>
          <Link
            href="/gestione/storia/new?type=article"
            class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md no-underline transition-colors"
          >
            <span>+</span> Nuovo Articolo
          </Link>
        </div>
      </div>

      <div class="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <input
          type="search"
          placeholder="Cerca per titolo, testo o anno..."
          value={filterText.value}
          onInput$={(event) => {
            filterText.value = (event.target as HTMLInputElement).value;
          }}
          class="w-full md:max-w-md px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 outline-none font-medium dark:text-white"
        />

        <div
          class="inline-flex w-full md:w-auto p-1 rounded-xl border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {[
            { value: 'all', label: `Tutti (${activeItems.value.length})` },
            { value: 'article', label: `Articoli (${articleCount.value})` },
            { value: 'timeline', label: `Cronologia (${timelineCount.value})` },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick$={() => {
                activeType.value = filter.value as 'all' | 'article' | 'timeline';
              }}
              class="flex-1 md:flex-none px-3 py-2 text-xs font-bold rounded-lg transition-colors"
              style={{
                backgroundColor:
                  activeType.value === filter.value ? 'var(--color-action)' : 'transparent',
                color:
                  activeType.value === filter.value ? '#fff' : 'var(--color-text-muted)',
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
          <p class="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            Nessun contenuto trovato
          </p>
          <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Modifica i filtri oppure crea un nuovo articolo o evento.
          </p>
        </div>
      ) : (
        <div
          class="rounded-2xl border overflow-hidden shadow-sm"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredItems.value.map((item) => {
              const timeline = isTimelineRecord(item);
              const description = item.descrizione_breve || toPlainText(item.contenuto);

              return (
                <div
                  key={item.id}
                  class="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        class={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                          timeline
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {timeline ? 'Cronologia' : 'Articolo'}
                      </span>
                      {timeline && (
                        <span class="text-xs font-bold" style={{ color: 'var(--color-text-muted)' }}>
                          {item.anno || 'Anno da impostare'}
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

                  <div class="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/gestione/storia/${item.id}`}
                      class="px-3.5 py-2 text-xs font-bold rounded-lg no-underline transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      Modifica
                    </Link>
                    <button
                      type="button"
                      onClick$={() => handleDelete(item.id, item.titolo)}
                      class="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-red-200 dark:border-red-900"
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
  title: 'Gestione Storia del Judo - JudoOK',
};
