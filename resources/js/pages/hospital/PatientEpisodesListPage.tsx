import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { Episode } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';

const episodeLabels: Record<string, string> = {
  CONSULTATION: 'Consultation',
  HOSPITALIZATION: 'Hospitalisation',
  EMERGENCY: 'Urgence',
};

export default defineComponent({
  name: 'PatientEpisodesListPage',
  setup() {
    const route = useRoute();
    const id = computed(() => route.params.id as string);

    const { data: episodes, isLoading } = useQuery({
      queryKey: ['patient-episodes', id],
      queryFn: async () => {
        const { data } = await api.get<{ data: Episode[] }>(`/patients/${id.value}/episodes`);
        return data.data;
      },
    });

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Observations médicales
            </h2>
            <p class="mt-1 text-slate-600">
              Historique des observations (consultations, hospitalisations, urgences).
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <RouterLink to={`/hospital/patients/${id.value}/episodes/new`}>
              <span class="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
                Nouvelle observation médicale
              </span>
            </RouterLink>
            <RouterLink to={`/hospital/patients/${id.value}/notes-cliniques`}>
              <span class="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Notes cliniques
              </span>
            </RouterLink>
          </div>
        </div>
        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !episodes.value?.length ? (
            <div class="py-16 text-center text-slate-500">
              <p>Aucune observation médicale.</p>
              <RouterLink
                to={`/hospital/patients/${id.value}/episodes/new`}
                class="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                Créer une observation médicale
              </RouterLink>
            </div>
          ) : (
            <div class="divide-y divide-slate-100">
              {episodes.value.map((e) => (
                <div
                  key={e.id}
                  class="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div class="flex items-center gap-2">
                      <Badge variant={e.type === 'EMERGENCY' ? 'destructive' : 'default'}>
                        {episodeLabels[e.type] ?? e.type}
                      </Badge>
                      <span class="text-sm text-slate-500">{e.start_date} {e.end_date ? `– ${e.end_date}` : ''}</span>
                    </div>
                    <p class="mt-2 font-medium text-slate-800">{e.reason ?? '—'}</p>
                    {e.provenance ? (
                      <p class="mt-1 text-sm text-slate-600">
                        <span class="font-medium text-slate-500">Provenance :</span> {e.provenance}
                      </p>
                    ) : null}
                    {e.therapeutic_pathway ? (
                      <p class="mt-1 text-sm text-slate-600">
                        <span class="font-medium text-slate-500">Parcours :</span> {e.therapeutic_pathway}
                      </p>
                    ) : null}
                    {e.diagnosis && <p class="mt-1 text-sm text-slate-600">{e.diagnosis}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
});
