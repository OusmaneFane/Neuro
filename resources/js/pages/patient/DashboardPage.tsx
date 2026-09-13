import { defineComponent } from 'vue';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import type { Episode } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink } from 'vue-router';

export default defineComponent({
  name: 'PatientDashboard',
  setup() {
    const { data: patient } = useQuery({
      queryKey: ['patient-me'],
      queryFn: async () => {
        const { data } = await api.get<{ full_name: string; iup: string }>('/patient/me');
        return data;
      },
    });

    const { data: episodes } = useQuery({
      queryKey: ['patient-episodes'],
      queryFn: async () => {
        const { data } = await api.get<{ data: Episode[] }>('/patient/me/episodes');
        return data.data;
      },
    });

    return () => (
      <div class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-800">Mon tableau de bord</h2>
        {patient.value && (
          <div class="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 class="font-medium text-slate-800">Mon dossier</h3>
              <p class="mt-2 text-slate-600">{patient.value.full_name}</p>
              <p class="text-sm text-slate-500">ID: {patient.value.iup}</p>
              <div class="mt-4 flex gap-2">
                <RouterLink to="/patient/records">
                  <span class="text-sm text-primary hover:opacity-90">Voir mon dossier →</span>
                </RouterLink>
              </div>
            </Card>
            <Card>
              <h3 class="font-medium text-slate-800">Dernière observation médicale</h3>
              {episodes.value?.[0] ? (
                <div class="mt-2 rounded-lg bg-slate-50 p-3">
                  <p class="font-medium">{episodes.value[0].type}</p>
                  <p class="text-sm text-slate-600">{episodes.value[0].reason}</p>
                  {episodes.value[0].provenance ? (
                    <p class="mt-1 text-xs text-slate-500">Provenance : {episodes.value[0].provenance}</p>
                  ) : null}
                  {episodes.value[0].therapeutic_pathway ? (
                    <p class="mt-0.5 text-xs text-slate-500">Parcours : {episodes.value[0].therapeutic_pathway}</p>
                  ) : null}
                  <p class="text-xs text-slate-500">{episodes.value[0].start_date}</p>
                </div>
              ) : (
                <p class="mt-2 text-sm text-slate-500">Aucune observation médicale enregistrée</p>
              )}
            </Card>
          </div>
        )}
      </div>
    );
  },
});
