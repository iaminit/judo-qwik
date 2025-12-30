import { component$ } from '@builder.io/qwik';
import HistoryForm from '~/components/admin/history-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nuovo Evento Cronologia</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Aggiungi una data alla cronologia mondiale.</p>
            </header>
            <HistoryForm isNew={true} type="timeline" />
        </div>
    );
});
