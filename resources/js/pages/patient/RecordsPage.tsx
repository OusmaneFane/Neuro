import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { Episode } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PatientRecords',
  setup() {
    const { data, isLoading } = useQuery({
      queryKey: ['patient-episodes'],
      queryFn: async () => {
        const { data: res } = await api.get<{ data: Episode[] }>('/patient/me/episodes');
        return res.data;
      },
    });

    return () => (
      <div class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-800">Mon dossier médical</h2>
        {isLoading.value ? (
          <div class="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !data.value?.length ? (
          <EmptyState
            title="Aucune observation médicale"
            description="Votre historique médical apparaîtra ici."
          />
        ) : (
          <div class="space-y-4">
            {data.value.map((ep) => (
              <Card key={ep.id}>
                <div class="flex justify-between">
                  <div>
                    <p class="font-medium">{ep.type}</p>
                    <p class="text-sm text-slate-600">{ep.reason}</p>
                    {ep.provenance ? (
                      <p class="mt-1 text-sm text-slate-500">Provenance : {ep.provenance}</p>
                    ) : null}
                    {ep.therapeutic_pathway ? (
                      <p class="mt-1 text-sm text-slate-500">Parcours : {ep.therapeutic_pathway}</p>
                    ) : null}
                    {ep.diagnosis && (
                      <p class="mt-1 text-sm text-slate-500">{ep.diagnosis}</p>
                    )}
                    <p class="mt-2 text-xs text-slate-400">
                      {ep.start_date} {ep.end_date ? `— ${ep.end_date}` : ''}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  },
});
