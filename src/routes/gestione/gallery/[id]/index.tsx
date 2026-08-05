import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import GalleryForm from '~/components/admin/gallery-form';
import { pb } from '~/lib/pocketbase';

export const useGalleryRecord = routeLoader$(async ({ params }) => {
  return pb.collection('galleria').getOne(params.id, { requestKey: null });
});

export default component$(() => {
  const record = useGalleryRecord();
  return (
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black mb-8" style={{ color: 'var(--color-text)' }}>
        Modifica scheda: {record.value.titolo}
      </h1>
      <GalleryForm item={record.value} isNew={false} />
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Modifica scheda Galleria - JudoOK',
};
