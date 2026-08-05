import { component$ } from '@builder.io/qwik';
import { Link, type DocumentHead, useLocation } from '@builder.io/qwik-city';
import FijlkamForm from '~/components/admin/fijlkam-form';

type FijlkamType = 'info' | 'timeline' | 'regulations' | 'programmi';

const typeContent: Record<FijlkamType, { title: string; description: string }> = {
  info: {
    title: 'Nuova Scheda FIJLKAM',
    description: 'Aggiungi informazioni federali, campioni, cinture o comitati.',
  },
  timeline: {
    title: 'Nuovo Evento Storico FIJLKAM',
    description: 'Aggiungi una tappa alla cronologia federale.',
  },
  regulations: {
    title: 'Nuovo Regolamento FIJLKAM',
    description: 'Aggiungi una regola, un documento o un approfondimento arbitrale.',
  },
  programmi: {
    title: 'Nuovo Programma DAN',
    description: 'Aggiungi una sezione al programma d’esame federale.',
  },
};

export default component$(() => {
  const location = useLocation();
  const requestedType = location.url.searchParams.get('type');
  const type: FijlkamType =
    requestedType === 'timeline' ||
    requestedType === 'regulations' ||
    requestedType === 'programmi'
      ? requestedType
      : 'info';
  const content = typeContent[type];

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
          {content.title}
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {content.description}
        </p>
      </div>

      <FijlkamForm isNew type={type} />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Nuovo contenuto FIJLKAM - JudoOK',
};
