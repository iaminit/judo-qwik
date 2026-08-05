import { component$ } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import HistoryForm from '~/components/admin/history-form';
import { pb } from '~/lib/pocketbase';

const hasTimelineTag = (tags: unknown) =>
  String(tags || '')
    .split(',')
    .some((tag) => tag.trim().toLowerCase() === 'timeline');

export const useHistoryDetail = routeLoader$(async ({ params }) => {
  return pb.collection('storia').getOne(params.id, { requestKey: null });
});

export default component$(() => {
  const itemLoader = useHistoryDetail();
  const item = itemLoader.value;
  const type = hasTimelineTag(item.tags) ? 'timeline' : 'info';

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <Link
          href="/gestione/storia"
          class="inline-block text-sm font-bold no-underline mb-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ‹ Storia del Judo
        </Link>
        <h1 class="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
          {type === 'timeline' ? 'Modifica Evento Cronologico' : 'Modifica Articolo Storico'}
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {item.titolo || 'Contenuto storico'}
        </p>
      </div>

      <HistoryForm item={item} isNew={false} type={type} />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Modifica contenuto storico - JudoOK',
};
