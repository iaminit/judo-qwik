import { component$ } from '@builder.io/qwik';
import GalleryForm from '~/components/admin/gallery-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nuovo Elemento Galleria</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Aggiungi una nuova foto o un video alla galleria.</p>
            </header>

            <GalleryForm isNew={true} />
        </div>
    );
});
