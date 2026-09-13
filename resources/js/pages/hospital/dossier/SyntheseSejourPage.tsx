import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import { DOSSIER_PAGE_STACK } from '@/components/patient/dossierPageUi';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import { BedDouble } from 'lucide-vue-next';
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
  name: 'SyntheseSejourPage',
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

    const { data: episodes, isLoading } = useQuery({
      queryKey: ['patient-episodes', id],
      queryFn: async () => {
        const { data } = await api.get<{ data: Episode[] }>(`/patients/${id.value}/episodes`);
        return data.data;
      },
    });

    const activeEpisode = computed(() =>
      episodes.value?.find((e) => !e.end_date || !e.discharge_date)
    );
    const pastEpisodes = computed(() =>
      episodes.value?.filter((e) => e.end_date || e.discharge_date).slice(0, 10) ?? []
    );

    return () => (
      <div class={DOSSIER_PAGE_STACK}>
        <PatientFormPageHero
          title="Synthèse séjour"
          description="Résumé des séjours et hospitalisations en cours ou passés"
        >
          {{
            icon: () => <BedDouble class="h-7 w-7" strokeWidth={2.25} />,
          }}
        </PatientFormPageHero>
        {patient.value && (
          <div class="grid gap-6 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <Card class="overflow-hidden border-0 bg-linear-to-br from-amber-50/90 via-white to-white p-6 shadow-lg ring-1 ring-amber-200/80">
                <div class="mb-6 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <h3 class="text-lg font-semibold text-slate-800">Séjour en cours</h3>
                  </div>
                  <RouterLink to={`/hospital/patients/${id.value}/notes-cliniques`}>
                    <Button size="sm" class="rounded-lg">
                      Notes cliniques (créer observation)
                    </Button>
                  </RouterLink>
                </div>
                {isLoading.value ? (
                  <div class="flex justify-center py-12">
                    <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : activeEpisode.value ? (
                  <div class="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
                    <div class="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">
                        {episodeLabels[activeEpisode.value.type] ?? activeEpisode.value.type}
                      </Badge>
                      <span class="text-sm font-medium text-slate-600">
                        Depuis le {activeEpisode.value.start_date}
                      </span>
                    </div>
                    <p class="mt-4 font-semibold text-slate-800">
                      {activeEpisode.value.reason ?? 'Motif non précisé'}
                    </p>
                    {activeEpisode.value.provenance ? (
                      <p class="mt-2 text-sm text-slate-600">
                        <span class="font-medium text-slate-500">Provenance :</span>{' '}
                        {activeEpisode.value.provenance}
                      </p>
                    ) : null}
                    {activeEpisode.value.therapeutic_pathway ? (
                      <p class="mt-2 text-sm text-slate-600">
                        <span class="font-medium text-slate-500">Parcours :</span>{' '}
                        {activeEpisode.value.therapeutic_pathway}
                      </p>
                    ) : null}
                    {activeEpisode.value.diagnosis && (
                      <p class="mt-2 text-sm text-slate-600">{activeEpisode.value.diagnosis}</p>
                    )}
                    {activeEpisode.value.notes && (
                      <p class="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                        {activeEpisode.value.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                    <p class="text-slate-600">Aucun séjour en cours</p>
                    <RouterLink to={`/hospital/patients/${id.value}/notes-cliniques`}>
                      <Button variant="outline" class="mt-4 rounded-lg">
                        Créer une observation médicale
                      </Button>
                    </RouterLink>
                  </div>
                )}
              </Card>
              <Card class="mt-6 overflow-hidden border-0 bg-linear-to-br from-slate-50/80 via-white to-white p-6 shadow-lg ring-1 ring-slate-200/80">
                <h3 class="mb-4 text-lg font-semibold text-slate-800">Séjours passés</h3>
                <div class="space-y-3">
                  {pastEpisodes.value.length ? (
                    pastEpisodes.value.map((e) => (
                      <div
                        key={e.id}
                        class="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <Badge variant="default" class="mb-1">
                            {episodeLabels[e.type] ?? e.type}
                          </Badge>
                          <p class="font-medium text-slate-800">{e.reason ?? '—'}</p>
                          {e.provenance ? (
                            <p class="mt-1 text-xs text-slate-600">Provenance : {e.provenance}</p>
                          ) : null}
                          {e.therapeutic_pathway ? (
                            <p class="mt-1 text-xs text-slate-600">Parcours : {e.therapeutic_pathway}</p>
                          ) : null}
                          <p class="text-xs text-slate-500">
                            {e.start_date}
                            {e.end_date && ` → ${e.end_date}`}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p class="py-8 text-center text-sm text-slate-500">Aucun séjour passé</p>
                  )}
                </div>
              </Card>
            </div>
            <div>
              <Card class="sticky top-6 overflow-hidden border-0 bg-linear-to-br from-primary/5 via-white to-white p-6 shadow-lg ring-1 ring-primary/15">
                <h3 class="mb-4 text-lg font-semibold text-slate-800">Patient</h3>
                <p class="font-semibold text-slate-900">{patient.value.full_name}</p>
                <p class="mt-1 font-mono text-sm text-slate-500">ID: {patient.value.iup}</p>
                <div class="mt-4 flex gap-2">
                  <Badge variant="success">{patient.value.status}</Badge>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  },
});
