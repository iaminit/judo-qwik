import { $, component$, useComputed$, useSignal } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import { pbAdmin } from '~/lib/pocketbase-admin';

export const useQuestions = routeLoader$(async () => {
  try {
    return await pb.collection('domande_quiz').getFullList({ sort: 'categoria,livello_dan', requestKey: null });
  } catch (error) {
    console.error('[Gestione Quiz] Caricamento fallito:', error);
    return [];
  }
});

export default component$(() => {
  const records = useQuestions();
  const removed = useSignal<string[]>([]);
  const search = useSignal('');
  const filtered = useComputed$(() => {
    const query = search.value.trim().toLowerCase();
    return records.value.filter((item: any) =>
      !removed.value.includes(item.id) &&
      (!query || `${item.domanda} ${item.categoria} ${item.spiegazione}`.toLowerCase().includes(query))
    );
  });

  const deleteItem = $(async (id: string) => {
    if (!confirm('Eliminare questa domanda del quiz?')) return;
    try {
      await pbAdmin.collection('domande_quiz').delete(id);
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
          <h1 class="text-3xl font-black">Gestione Domande Quiz</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{records.value.length} domande, con tutti i campi dello schema.</p>
        </div>
        <Link href="/gestione/domande-quiz/new" class="px-5 py-3 rounded-xl bg-red-600 text-white font-bold no-underline">+ Nuova domanda</Link>
      </div>
      <input value={search.value} onInput$={(event) => (search.value = (event.target as HTMLInputElement).value)} placeholder="Cerca domanda, categoria o spiegazione..." class="w-full p-3 mb-5 rounded-xl border" />
      <div class="space-y-3">
        {filtered.value.map((item: any, index) => (
          <article key={item.id} class="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
            <div class="flex-1 min-w-0">
              <p class="font-black">{index + 1}. {item.domanda}</p>
              <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{item.categoria} · DAN {item.livello_dan} · risposta {item.risposta_corretta}</p>
            </div>
            <div class="flex gap-2">
              <Link href={`/gestione/domande-quiz/${item.id}`} class="px-4 py-2 rounded-lg bg-gray-900 text-white font-bold no-underline">Modifica</Link>
              <button type="button" onClick$={() => deleteItem(item.id)} class="px-4 py-2 rounded-lg bg-red-50 text-red-700 font-bold">Elimina</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
});

export const head: DocumentHead = { title: 'Gestione Domande Quiz - JudoOK' };
