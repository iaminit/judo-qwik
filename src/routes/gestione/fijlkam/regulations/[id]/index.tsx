import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import FijlkamForm from '~/components/admin/fijlkam-form';

export const useItemDetail = routeLoader$(async ({ params, fail }) => {
    try {
        const record = await pbAdmin.collection('programmi_fijlkam').getOne(params.id, { requestKey: null });
        return JSON.parse(JSON.stringify(record));
    } catch (err) {
        return fail(404, { message: 'Elemento non trovato' });
    }
});

export default component$(() => {
    const item = useItemDetail();

    if (item.value.failed) {
        return <div class="p-20 text-center font-bold text-red-600">Errore: Elemento non trovato</div>;
    }

    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Modifica Regolamento</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Stai modificando: <span class="text-blue-600 font-black">{item.value.titolo}</span></p>
            </header>
            <FijlkamForm item={item.value} isNew={false} type="regulations" />
        </div>
    );
});
