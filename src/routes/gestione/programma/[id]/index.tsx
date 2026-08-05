import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { pb } from '~/lib/pocketbase';
import ProgramForm from '~/components/admin/program-form';

export const useProgramDetail = routeLoader$(async (requestEvent) => {
    const id = requestEvent.params.id;
    return pb.collection('livelli_dan').getOne(id, { requestKey: null });
});

export default component$(() => {
    const programSignal = useProgramDetail();
    const program = programSignal.value;

    return (
        <div class="space-y-10 max-w-4xl mx-auto px-4 py-8">

            <header>
                <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    Modifica Livello Programma: {program?.nome_completo || program?.belt || 'Dettaglio Livello'}
                </h2>
                <p class="text-gray-500 dark:text-gray-400 font-medium mt-1">
                    Modifica requisiti, grado e dettagli del programma d'esame.
                </p>
            </header>

            <ProgramForm program={program} isNew={false} />
        </div>
    );
});
