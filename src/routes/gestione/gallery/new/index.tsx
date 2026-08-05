import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import GalleryForm from '~/components/admin/gallery-form';
import { pbAdmin } from '~/lib/pocketbase-admin';

export default component$(() => {
  const nav = useNavigate();

  useVisibleTask$(() => {
    if (!pbAdmin.authStore.isValid) nav('/gestione/login');
  });

  return (
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black mb-8" style={{ color: 'var(--color-text)' }}>Nuova scheda Galleria</h1>
      <GalleryForm isNew />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Nuova scheda Galleria - JudoOK',
};
