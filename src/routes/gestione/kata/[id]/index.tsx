import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import KataForm from '~/components/admin/kata-form';

export const useKataDetail = routeLoader$(async ({ params, fail }) => {
    try {
        const record = await pbAdmin.collection('kata').getOne(params.id, {
            requestKey: null
        });
        return JSON.parse(JSON.stringify(record));
    } catch (err) {
        return fail(404, { message: 'Kata non trovato' });
    }
});

export default component$(() => {
    const kata = useKataDetail();

    if (kata.value.failed) {
        return (
            <div class="text-center py-20">
                <h2 class="text-2xl font-bold text-red-600">Errore 404</h2>
                <p class="text-gray-500 mt-2">Kata non trovato.</p>
            </div>
        );
    }

    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Modifica Kata</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Stai modificando: <span class="text-red-600 font-black">{kata.value.name}</span></p>
            </header>

            <KataForm kata={kata.value} isNew={false} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Modifica Kata - JudoOK Gestione',
};
