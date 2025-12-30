import { component$ } from '@builder.io/qwik';
import FijlkamForm from '~/components/admin/fijlkam-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nuova Informazione FIJLKAM</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Aggiungi un nuovo articolo informativo.</p>
            </header>
            <FijlkamForm isNew={true} type="info" />
        </div>
    );
});
