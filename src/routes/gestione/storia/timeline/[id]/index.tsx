import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import HistoryForm from '~/components/admin/history-form';

export const useItemDetail = routeLoader$(async ({ params, fail }) => {
    try {
        const record = await pbAdmin.collection('timeline_history').getOne(params.id, { requestKey: null });
        return JSON.parse(JSON.stringify(record));
    } catch (err) {
        return fail(404, { message: 'Evento non trovato' });
    }
});

export default component$(() => {
    const item = useItemDetail();

    if (item.value.failed) {
        return <div class="p-20 text-center font-bold text-red-600">Errore: Evento non trovato</div>;
    }

    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Modifica Evento Cronologia</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Stai modificando l'evento del: <span class="text-orange-600 font-black">{item.value.year}</span></p>
            </header>
            <HistoryForm item={item.value} isNew={false} type="timeline" />
        </div>
    );
});
