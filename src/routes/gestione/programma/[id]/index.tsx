import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { pbAdmin } from '~/lib/pocketbase-admin';
import ProgramForm from '~/components/admin/program-form';

export const useProgramDetail = routeLoader$(async ({ params, fail }) => {
    try {
        const record = await pbAdmin.collection('exam_program').getOne(params.id, {
            requestKey: null
        });
        return JSON.parse(JSON.stringify(record));
    } catch (err) {
        return fail(404, { message: 'Sezione non trovata' });
    }
});

export default component$(() => {
    const program = useProgramDetail();

    if (program.value.failed) {
        return (
            <div class="text-center py-20">
                <h2 class="text-2xl font-bold text-red-600">Errore 404</h2>
                <p class="text-gray-500 mt-2">Sezione del programma non trovata.</p>
            </div>
        );
    }

    return (
        <div class="space-y-10">
            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Modifica Sezione Programma</h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">Stai modificando: <span class="text-red-600 font-black">{program.value.title}</span></p>
            </header>

            <ProgramForm program={program.value} isNew={false} />
        </div>
    );
});

export const head: DocumentHead = {
    title: 'Modifica Programma - JudoOK Gestione',
};
