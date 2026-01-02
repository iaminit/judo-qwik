import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import TechniqueForm from '~/components/admin/technique-form';

export const useTechniqueDetail = routeLoader$(async ({ params, fail }) => {
    try {
        const record = await pbAdmin.collection('tecniche').getOne(params.id, {
            requestKey: null
        });

        const technique = JSON.parse(JSON.stringify(record));
        // Add collection info for builder
        technique.collectionId = record.collectionId;
        technique.collectionName = record.collectionName;

        return technique;
    } catch (err) {
        return fail(404, { message: 'Tecnica non trovata' });
    }
});

export default component$(() => {
    const technique = useTechniqueDetail();

    if (technique.value.failed) {
        return (
            <div class="text-center py-20">
                <h2 class="text-2xl font-bold text-red-600">Errore 404</h2>
                <p class="text-gray-500 mt-2">Tecnica non trovata.</p>
            </div>
        );
    }

    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Modifica Tecnica</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Stai modificando: <span class="text-red-600 font-black">{technique.value.titolo}</span></p>
            </header>

            <TechniqueForm technique={technique.value} isNew={false} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Modifica Tecnica - JudoOK Gestione',
};
