import { component$ } from '@builder.io/qwik';
import { Link, type DocumentHead, useLocation } from '@builder.io/qwik-city';
import HistoryForm from '~/components/admin/history-form';

export default component$(() => {
  const location = useLocation();
  const isTimeline = location.url.searchParams.get('type') === 'timeline';
  const type = isTimeline ? 'timeline' : 'info';

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
          {isTimeline ? 'Nuovo Evento Cronologico' : 'Nuovo Articolo Storico'}
        </h1>
        <p class="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {isTimeline
            ? 'Aggiungi una tappa alla cronologia pubblica del Judo.'
            : 'Crea un nuovo approfondimento per la pagina Storia del Judo.'}
        </p>
      </div>

      <HistoryForm isNew type={type} />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Nuovo contenuto storico - JudoOK',
};
