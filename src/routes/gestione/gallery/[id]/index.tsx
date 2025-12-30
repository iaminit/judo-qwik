import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import GalleryForm from '~/components/admin/gallery-form';

export const useGalleryItemDetail = routeLoader$(async ({ params, fail }) => {
    try {
        const record = await pbAdmin.collection('gallery').getOne(params.id, {
            requestKey: null
        });
        return JSON.parse(JSON.stringify(record));
    } catch (err) {
        return fail(404, { message: 'Elemento non trovato' });
    }
});

export default component$(() => {
    const item = useGalleryItemDetail();

    if (item.value.failed) {
        return (
            <div class="text-center py-20">
                <h2 class="text-2xl font-bold text-red-600">Errore 404</h2>
                <p class="text-gray-500 mt-2">Elemento della galleria non trovato.</p>
            </div>
        );
    }

    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Modifica Elemento Galleria</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Stai modificando: <span class="text-red-600 font-black">{item.value.title}</span></p>
            </header>

            <GalleryForm item={item.value} isNew={false} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Modifica Galleria - JudoOK Gestione',
};
