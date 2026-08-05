import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import CategoryForm from '~/components/admin/category-form';
import { pb } from '~/lib/pocketbase';

export const useCategory = routeLoader$(({ params }) =>
  pb.collection('categorie').getOne(params.id, { requestKey: null })
);

export default component$(() => {
  const item = useCategory();
  return (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-black mb-8">Modifica categoria: {item.value.nome}</h1>
      <CategoryForm item={item.value} isNew={false} />
    </div>
  );
});

export const head: DocumentHead = { title: 'Modifica Categoria - JudoOK' };
