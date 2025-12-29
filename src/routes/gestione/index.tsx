import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">Gestione</h1>
      <p>Pagina amministrazione da migrare...</p>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Gestione - Admin',
  meta: [
    {
      name: 'description',
      content: 'Area amministrazione',
    },
  ],
};
