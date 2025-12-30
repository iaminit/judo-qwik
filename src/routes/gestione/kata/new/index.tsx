import { component$ } from '@builder.io/qwik';
import KataForm from '~/components/admin/kata-form';

export default component$(() => {
    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Nuovo Kata</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Aggiungi un nuovo Kata al database.</p>
            </header>

            <KataForm isNew={true} />
        </div>
    );
});
