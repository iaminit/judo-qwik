import { $, component$, useComputed$, useSignal } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { pbAdmin } from '~/lib/pocketbase-admin';

export const useCategories = routeLoader$(async () => {
  try {
    return await pb.collection('categorie').getFullList({ sort: 'tipo_categoria,ordine,nome', requestKey: null });
  } catch (error) {
    console.error('[Gestione Categorie] Caricamento fallito:', error);
    return [];
  }
});

export default component$(() => {
  const records = useCategories();
  const removed = useSignal<string[]>([]);
  const search = useSignal('');
  const filtered = useComputed$(() => {
    const query = search.value.trim().toLowerCase();
    return records.value.filter((item: any) =>
      !removed.value.includes(item.id) &&
      (!query || `${item.nome} ${item.tipo_categoria} ${item.descrizione}`.toLowerCase().includes(query))
    );
  });

  const deleteItem = $(async (id: string) => {
    if (!confirm('Eliminare questa categoria?')) return;
    try {
      await pbAdmin.collection('categorie').delete(id);
      removed.value = [...removed.value, id];
    } catch (error) {
      console.error(error);
      alert('Eliminazione non riuscita. Verifica la sessione superutente.');
    }
  });

  return (
    <div class="max-w-6xl mx-auto px-4 py-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-black">Gestione Categorie</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Tutti i campi della raccolta categorie.</p>
        </div>
        <Link href="/gestione/categorie/new" class="px-5 py-3 rounded-xl bg-red-600 text-white font-bold no-underline">+ Nuova categoria</Link>
      </div>
      <input value={search.value} onInput$={(event) => (search.value = (event.target as HTMLInputElement).value)} placeholder="Cerca..." class="w-full p-3 mb-5 rounded-xl border" />
      <div class="space-y-3">
        {filtered.value.map((item: any) => (
          <article key={item.id} class="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div class="flex-1">
              <h2 class="font-black text-lg">{item.icona ? `${item.icona} ` : ''}{item.nome}</h2>
              <p class="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.tipo_categoria} · ordine {item.ordine}</p>
            </div>
            <div class="flex gap-2">
              <Link href={`/gestione/categorie/${item.id}`} class="px-4 py-2 rounded-lg bg-gray-900 text-white font-bold no-underline">Modifica</Link>
              <button type="button" onClick$={() => deleteItem(item.id)} class="px-4 py-2 rounded-lg bg-red-50 text-red-700 font-bold">Elimina</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
});

export const head: DocumentHead = { title: 'Gestione Categorie - JudoOK' };
