import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import { DOSSIER_PAGE_STACK } from '@/components/patient/dossierPageUi';
import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import { LayoutDashboard } from 'lucide-vue-next';
import type { Document, Episode, Patient } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';
import { RouterLink } from 'vue-router';

const episodeLabels: Record<string, string> = {
  CONSULTATION: 'Consultation',
  HOSPITALIZATION: 'Hospitalisation',
  EMERGENCY: 'Urgence',
};

const docTypeLabels: Record<string, string> = {
  LAB: 'Biologie',
  IMAGING: 'Imagerie',
  PRESCRIPTION: 'Ordonnance',
  DISCHARGE: 'Sortie',
  ADMIN: 'Administratif',
  OTHER: 'Autre',
};

export default defineComponent({
  name: 'SyntheseGeneralePage',
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

    const { data: documents } = useQuery({
      queryKey: ['patient-documents', id],
      queryFn: async () => {
        const { data } = await api.get<{ data: Document[] }>(`/patients/${id.value}/documents`);
        return data.data;
      },
    });

    const stats = computed(() => ({
      episodes: episodes.value?.length ?? 0,
      documents: documents.value?.length ?? 0,
      activeEpisodes: episodes.value?.filter((e) => !e.end_date).length ?? 0,
    }));

    return () => (
      <div class={DOSSIER_PAGE_STACK}>
        <PatientFormPageHero
          title="Synthèse générale"
          description="Vue d'ensemble du parcours de soins et des documents du patient"
        >
          {{
            icon: () => <LayoutDashboard class="h-7 w-7" strokeWidth={2.25} />,
          }}
        </PatientFormPageHero>
        {patient.value && (
          <>
            <div class="grid gap-4 sm:grid-cols-3">
              <Card class="overflow-hidden border-0 bg-linear-to-br from-primary to-blue-700 p-6 text-white shadow-lg ring-1 ring-primary/30">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-white/90">Observations médicales</p>
                    <p class="text-3xl font-bold">{stats.value.episodes}</p>
                    <p class="text-xs text-white/80">
                      {stats.value.activeEpisodes} en cours
                    </p>
                  </div>
                </div>
              </Card>
              <Card class="overflow-hidden border-0 bg-linear-to-br from-slate-600 to-slate-700 p-6 text-white shadow-lg ring-1 ring-slate-500/40">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-slate-200">Documents</p>
                    <p class="text-3xl font-bold">{stats.value.documents}</p>
                  </div>
                </div>
              </Card>
              <Card class="overflow-hidden border-0 bg-linear-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg ring-1 ring-amber-400/50">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-amber-100">Statut</p>
                    <p class="text-xl font-bold">{patient.value.status}</p>
                  </div>
                </div>
              </Card>
            </div>
            <div class="grid gap-6 lg:grid-cols-2">
              <Card class="overflow-hidden border-0 bg-linear-to-br from-slate-50/80 via-white to-white p-6 shadow-lg ring-1 ring-slate-200/80">
                <div class="mb-4 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-800">Dernières observations médicales</h3>
                  <RouterLink
                    to={`/hospital/patients/${id.value}/episodes`}
                    class="text-sm font-medium text-primary hover:opacity-90"
                  >
                    Voir tout →
                  </RouterLink>
                </div>
                <div class="space-y-3">
                  {episodes.value?.length ? (
                    episodes.value.slice(0, 5).map((e) => (
                      <div
                        key={e.id}
                        class="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                      >
                        <div>
                          <Badge variant={e.type === 'EMERGENCY' ? 'destructive' : 'default'}>
                            {episodeLabels[e.type] ?? e.type}
                          </Badge>
                          <p class="mt-1 text-sm font-medium text-slate-800">{e.reason ?? '—'}</p>
                          {e.provenance ? (
                            <p class="mt-0.5 text-xs text-slate-500">Provenance : {e.provenance}</p>
                          ) : null}
                          {e.therapeutic_pathway ? (
                            <p class="mt-0.5 text-xs text-slate-500">Parcours : {e.therapeutic_pathway}</p>
                          ) : null}
                          <p class="text-xs text-slate-500">{e.start_date}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p class="py-6 text-center text-sm text-slate-500">Aucune observation médicale</p>
                  )}
                </div>
              </Card>
              <Card class="overflow-hidden border-0 bg-linear-to-br from-slate-50/80 via-white to-white p-6 shadow-lg ring-1 ring-slate-200/80">
                <div class="mb-4 flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-800">Documents récents</h3>
                  <RouterLink
                    to={`/hospital/patients/${id.value}/documents`}
                    class="text-sm font-medium text-primary hover:opacity-90"
                  >
                    Voir tout →
                  </RouterLink>
                </div>
                <div class="space-y-3">
                  {documents.value?.length ? (
                    documents.value.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        class="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:bg-slate-50"
                      >
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-medium text-slate-800">{doc.filename}</p>
                          <span class="text-xs text-slate-500">
                            {docTypeLabels[doc.type] ?? doc.type}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p class="py-6 text-center text-sm text-slate-500">Aucun document</p>
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
