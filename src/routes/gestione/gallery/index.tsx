import { $, component$, useComputed$, useSignal } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { pbAdmin } from '~/lib/pocketbase-admin';

interface GalleryRecord {
  id: string;
  titolo: string;
  tags: string;
  data_riferimento: string;
  pubblicato: boolean;
}

export const useGalleryList = routeLoader$<GalleryRecord[]>(async () => {
  try {
    const records = await pb.collection('galleria').getFullList({
      sort: '-data_riferimento,titolo',
      requestKey: null,
    });
    return records.map((record: any) => ({
      id: record.id,
      titolo: record.titolo || '',
      tags: record.tags || '',
      data_riferimento: record.data_riferimento || '',
      pubblicato: record.pubblicato !== false,
    }));
  } catch (error) {
    console.error('[Gestione Galleria] Impossibile caricare i record:', error);
    return [];
  }
});

export default component$(() => {
  const records = useGalleryList();
  const deletedIds = useSignal<string[]>([]);
  const query = useSignal('');

  const filtered = useComputed$(() => {
    const search = query.value.trim().toLowerCase();
    return records.value.filter((item) => {
      if (deletedIds.value.includes(item.id)) return false;
      return !search || item.titolo.toLowerCase().includes(search) || item.tags.toLowerCase().includes(search);
    });
  });

  const deleteItem = $(async (id: string) => {
    if (!confirm('Eliminare questa scheda della galleria?')) return;
    try {
      await pbAdmin.collection('galleria').delete(id);
      deletedIds.value = [...deletedIds.value, id];
    } catch (error) {
      console.error('[Gestione Galleria] Eliminazione fallita:', error);
      alert('Impossibile eliminare la scheda. Verifica la sessione amministrativa.');
    }
  });

  return (
    <div class="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-black" style={{ color: 'var(--color-text)' }}>Gestione Galleria</h1>
          <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Gestisci le schede foto e video archiviate nel database.
          </p>
        </div>
        <Link href="/gestione/gallery/new" class="px-5 py-3 rounded-xl bg-red-600 text-white font-bold no-underline">
          + Nuova scheda
        </Link>
      </div>

      <input
        value={query.value}
        onInput$={(event) => (query.value = (event.target as HTMLInputElement).value)}
        placeholder="Cerca per titolo o tag..."
        class="w-full px-4 py-3 mb-5 rounded-xl border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      />

      <div class="space-y-3">
        {filtered.value.map((item) => (
          <article
            key={item.id}
            class="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div class="flex-1 min-w-0">
              <h2 class="font-black text-lg m-0" style={{ color: 'var(--color-text)' }}>{item.titolo}</h2>
              <p class="text-sm m-0 mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {item.tags || 'Nessun tag'} {item.data_riferimento ? `· ${item.data_riferimento.slice(0, 10)}` : ''}
                {!item.pubblicato ? ' · Bozza' : ''}
              </p>
            </div>
            <div class="flex gap-2">
              <Link href={`/gestione/gallery/${item.id}`} class="px-4 py-2 rounded-lg bg-gray-900 text-white no-underline font-bold">
                Modifica
              </Link>
              <button type="button" onClick$={() => deleteItem(item.id)} class="px-4 py-2 rounded-lg bg-red-50 text-red-700 font-bold">
                Elimina
              </button>
            </div>
          </article>
        ))}
        {!filtered.value.length && (
          <p class="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>Nessuna scheda trovata.</p>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Gestione Galleria - JudoOK',
};
