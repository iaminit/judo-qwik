import { component$ } from '@builder.io/qwik';
import { Link, routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import FijlkamForm from '~/components/admin/fijlkam-form';
import { pb } from '~/lib/pocketbase';

type FijlkamType = 'info' | 'timeline' | 'regulations' | 'programmi';

const getRecordType = (tags: unknown): FijlkamType => {
  const normalized = String(tags || '').toLowerCase();
  if (normalized.includes('timeline')) return 'timeline';
  if (normalized.includes('regolamento')) return 'regulations';
  if (normalized.includes('esame_dan')) return 'programmi';
  return 'info';
};

const typeTitles: Record<FijlkamType, string> = {
  info: 'Modifica Scheda FIJLKAM',
  timeline: 'Modifica Evento Storico',
  regulations: 'Modifica Regolamento',
  programmi: 'Modifica Programma DAN',
};

export const useFijlkamDetail = routeLoader$(async ({ params }) => {
  return pb.collection('fijlkam').getOne(params.id, { requestKey: null });
});

export default component$(() => {
  const itemLoader = useFijlkamDetail();
  const item = itemLoader.value;
  const type = getRecordType(item.tags);

  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <div class="mb-8">
        <Link
          href="/gestione/fijlkam"
          class="inline-block text-sm font-bold no-underline mb-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ‹ Gestione FIJLKAM
        </Link>
        <h1 class="text-3xl font-black" style={{ color: 'var(--color-text)' }}>
          {typeTitles[type]}
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {item.titolo || 'Contenuto FIJLKAM'}
        </p>
      </div>

      <FijlkamForm item={item} isNew={false} type={type} />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Modifica contenuto FIJLKAM - JudoOK',
};
