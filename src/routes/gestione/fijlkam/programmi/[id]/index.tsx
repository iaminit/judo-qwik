import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import FijlkamForm from '~/components/admin/fijlkam-form';

export const useProgramData = routeLoader$(async ({ params, error }) => {
    try {
        return await pbAdmin.collection('programmi_fijlkam').getOne(params.id);
    } catch (e) {
        throw error(404, 'Programma non trovato');
    }
});

export default component$(() => {
    const data = useProgramData();

    return (
        <div class="space-y-6">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Modifica Programma d'Esame</h2>
            <FijlkamForm isNew={false} item={data.value} type="programmi" />
        </div>
    );
});
