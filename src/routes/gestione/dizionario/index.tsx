import { component$, useSignal, $, useComputed$ } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import { pb } from '~/lib/pocketbase';

export interface DizionarioRecord {
  id: string;
  titolo: string;
  titolo_secondario: string;
  descrizione_breve: string;
  categoria_secondaria: string;
  pubblicato: boolean;
}

export const useDizionarioList = routeLoader$<DizionarioRecord[]>(async () => {
  try {
    const records = await pb.collection('dizionario').getFullList<DizionarioRecord>({
      sort: 'titolo',
      requestKey: null,
    });
    return records.map((r: any) => ({
      id: r.id,
      titolo: r.titolo || '',
      titolo_secondario: r.titolo_secondario || '',
      descrizione_breve: r.descrizione_breve || '',
      categoria_secondaria: r.categoria_secondaria || r.categoria_principale || '',
      pubblicato: r.pubblicato !== false,
    }));
  } catch (error) {
    console.error('[Gestione Dizionario] Impossibile caricare i record:', error);
    return [];
  }
});

export default component$(() => {
  const listLoader = useDizionarioList();
  const deletedIds = useSignal<string[]>([]);
  const filterText = useSignal('');

  const activeItems = useComputed$(() => {
    const raw = listLoader.value || [];
    return raw.filter((item) => !deletedIds.value.includes(item.id));
  });

  const handleDelete = $(async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo termine?')) return;
    try {
      await pbAdmin.collection('dizionario').delete(id);
      deletedIds.value = [...deletedIds.value, id];
    } catch (err) {
      console.error('[Gestione Dizionario] Delete error:', err);
      alert('Impossibile eliminare l\'elemento');
    }
  });

  const filteredItems = useComputed$(() => {
    const query = filterText.value.toLowerCase().trim();
    if (!query) return activeItems.value;
    return activeItems.value.filter(
      (item) =>
        (item.titolo || '').toLowerCase().includes(query) ||
        (item.titolo_secondario || '').toLowerCase().includes(query) ||
        (item.descrizione_breve || '').toLowerCase().includes(query) ||
        (item.categoria_secondaria || '').toLowerCase().includes(query)
    );
  });

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-8">

      {/* Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Gestione Dizionario
          </h1>
          <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Visualizza, modifica ed elimina i termini tecnici del Judo ({activeItems.value.length} voci).
          </p>
        </div>

        <Link
          href="/gestione/dizionario/new"
          class="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors"
        >
          <span>+</span> Nuovo Termine
        </Link>
      </div>

      {/* Search Bar */}
      <div class="mb-6">
        <input
          type="text"
          placeholder="Cerca per termine o definizione..."
          value={filterText.value}
          onInput$={(e) => (filterText.value = (e.target as HTMLInputElement).value)}
          class="w-full max-w-md px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 outline-none font-medium dark:text-white"
        />
      </div>

      {/* Content List */}
      {filteredItems.value.length === 0 ? (
        <div class="p-12 text-center border rounded-2xl bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
          <p class="text-base font-bold text-gray-700 dark:text-gray-300">Nessun termine trovato</p>
          <p class="text-sm text-gray-500 mt-1">Fai clic su "+ Nuovo Termine" per aggiungere una voce.</p>
        </div>
      ) : (
        <div class="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredItems.value.map((item) => (
              <div key={item.id} class="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                        item.pubblicato !== false
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {item.pubblicato !== false ? 'Pubblicato' : 'Bozza'}
                    </span>

                    {item.categoria_secondaria && (
                      <span class="px-2 py-0.5 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md">
                        {item.categoria_secondaria}
                      </span>
                    )}
                  </div>

                  <h3 class="font-bold text-base md:text-lg truncate m-0" style={{ color: 'var(--color-text)' }}>
                    {item.titolo} {item.titolo_secondario ? `(${item.titolo_secondario})` : ''}
                  </h3>

                  {item.descrizione_breve && (
                    <p class="text-sm truncate m-0 mt-0.5 text-gray-500">
                      {item.descrizione_breve}
                    </p>
                  )}
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/gestione/dizionario/${item.id}`}
                    class="px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Modifica
                  </Link>

                  <button
                    onClick$={() => handleDelete(item.id)}
                    class="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Gestione Dizionario - JudoOK',
};
