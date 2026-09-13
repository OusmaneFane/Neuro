import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import type { Episode, Patient } from '@/types';
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
  name: 'PatientDetailPage',
  setup() {
    const route = useRoute();
    const id = computed(() => route.params.id as string);

    const { data: patient } = useQuery({
      queryKey: ['patient', id],
      queryFn: async () => {
        const { data } = await api.get<Patient>(`/patients/${id.value}`);
        return data;
      },
    });

    const { data: episodes } = useQuery({
      queryKey: ['patient-episodes', id],
      queryFn: async () => {
        const { data } = await api.get<{ data: Episode[] }>(`/patients/${id.value}/episodes`);
        return data.data;
      },
    });

    return () => (
      <div class="space-y-8">
        {patient.value && (
          <>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {patient.value.full_name}
                </h2>
                <div class="mt-3 flex gap-2">
                  <Badge variant="default">{patient.value.sex}</Badge>
                  <Badge variant="success">{patient.value.status}</Badge>
                </div>
              </div>
              <RouterLink to={`/hospital/patients/${id.value}/notes-cliniques`}>
                <Button class="rounded-xl shadow-lg shadow-primary/25">
                  Notes cliniques (créer observation)
                </Button>
              </RouterLink>
            </div>
            <div class="grid gap-6 md:grid-cols-2">
              <Card class="p-6">
                <h3 class="text-lg font-semibold text-slate-800">Informations</h3>
                <dl class="mt-5 space-y-4">
                  <div>
                    <dt class="text-sm font-medium text-slate-500">Date de naissance</dt>
                    <dd class="mt-1 font-medium text-slate-800">{patient.value.birth_date}</dd>
                  </div>
                  {patient.value.phone && (
                    <div>
                      <dt class="text-sm font-medium text-slate-500">Téléphone</dt>
                      <dd class="mt-1 font-medium text-slate-800">{patient.value.phone}</dd>
                    </div>
                  )}
                  {patient.value.address && (
                    <div>
                      <dt class="text-sm font-medium text-slate-500">Adresse</dt>
                      <dd class="mt-1 font-medium text-slate-800">{patient.value.address}</dd>
                    </div>
                  )}
                  {(patient.value.created_by || patient.value.updated_at) && (
                    <div class="border-t border-slate-100 pt-4 mt-4">
                      <dt class="text-xs font-medium text-slate-400">Traçabilité</dt>
                      <dd class="mt-1 text-xs text-slate-500">
                        {patient.value.created_by && (
                          <span>Créé par {patient.value.created_by.full_name} le {patient.value.created_at ? new Date(patient.value.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                        )}
                        {patient.value.updated_by && patient.value.updated_at && (
                          <span class="block mt-0.5">Modifié par {patient.value.updated_by.full_name} le {new Date(patient.value.updated_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
              <Card class="overflow-hidden p-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-800">Dernières observations médicales</h3>
                  <RouterLink
                    to={`/hospital/patients/${id.value}/episodes`}
                    class="text-sm font-medium text-primary hover:opacity-90"
                  >
                    Toutes →
                  </RouterLink>
                </div>
                <div class="mt-5 space-y-3">
                  {episodes.value?.length ? (
                    episodes.value.slice(0, 5).map((e) => (
                      <div
                        key={e.id}
                        class="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                      >
                        <div class="flex items-center justify-between">
                          <Badge variant={e.type === 'EMERGENCY' ? 'destructive' : 'default'}>
                            {episodeLabels[e.type] ?? e.type}
                          </Badge>
                          <span class="text-sm text-slate-500">{e.start_date}</span>
                        </div>
                        <p class="mt-2 text-sm font-medium text-slate-700">{e.reason ?? '—'}</p>
                        {e.provenance ? (
                          <p class="mt-1 text-xs text-slate-600">Provenance : {e.provenance}</p>
                        ) : null}
                        {e.therapeutic_pathway ? (
                          <p class="mt-1 text-xs text-slate-600">
                            Parcours : {e.therapeutic_pathway}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p class="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 py-8 text-center text-sm text-slate-500">
                      Aucune observation médicale
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    );
  },
});
