import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import CategoryForm from '~/components/admin/category-form';

export default component$(() => (
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-black mb-8">Nuova categoria</h1>
    <CategoryForm isNew />
  </div>
));

export const head: DocumentHead = { title: 'Nuova Categoria - JudoOK' };
