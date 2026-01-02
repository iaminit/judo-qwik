import { component$ } from '@builder.io/qwik';
import FijlkamForm from '~/components/admin/fijlkam-form';

export default component$(() => {
    return (
        <div class="space-y-6">
            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Nuovo Programma d'Esame</h2>
            <FijlkamForm isNew={true} type="programmi" />
        </div>
    );
});
