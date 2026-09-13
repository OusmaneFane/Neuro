import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import { DOSSIER_PAGE_STACK } from '@/components/patient/dossierPageUi';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import { User } from 'lucide-vue-next';
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
  name: 'SynthesePatientPage',
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
      <div class={DOSSIER_PAGE_STACK}>
        {patient.value && (
          <>
            <PatientFormPageHero
              title="Synthèse patient"
              description="Vue d'ensemble des informations et des dernières observations médicales du patient"
            >
              {{
                icon: () => <User class="h-7 w-7" strokeWidth={2.25} />,
                extra: () => (
                  <div class="mt-4 flex flex-wrap items-center gap-3">
                    <p class="font-mono text-sm text-slate-500">ID: {patient.value!.iup}</p>
                    <Badge variant="default">{patient.value!.sex}</Badge>
                    <Badge variant="success">{patient.value!.status}</Badge>
                  </div>
                ),
                actions: () => (
                  <RouterLink to={`/hospital/patients/${id.value}/notes-cliniques`}>
                    <Button class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-base shadow-lg shadow-primary/30">
                      Notes cliniques (créer observation)
                    </Button>
                  </RouterLink>
                ),
              }}
            </PatientFormPageHero>
            <div class="grid gap-6 md:grid-cols-2">
              <Card class="overflow-hidden border-0 bg-linear-to-br from-primary/5 via-white to-white p-6 shadow-lg ring-1 ring-primary/15">
                <div class="mb-4 flex items-center gap-2">
                  <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <h3 class="text-lg font-semibold text-slate-800">Identité</h3>
                </div>
                <dl class="space-y-4">
                  <div>
                    <dt class="text-sm font-medium text-slate-500">Nom complet</dt>
                    <dd class="mt-1 font-semibold text-slate-800">{patient.value.full_name}</dd>
                  </div>
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
                  {(patient.value.emergency_contact_name || patient.value.emergency_contact_first_name || patient.value.emergency_contact_phone) && (
                    <div>
                      <dt class="text-sm font-medium text-slate-500">Personne à contacter</dt>
                      <dd class="mt-1 font-medium text-slate-800">
                        {[patient.value.emergency_contact_name, patient.value.emergency_contact_first_name].filter(Boolean).join(' ')}
                        {patient.value.emergency_contact_phone && ` · ${patient.value.emergency_contact_phone}`}
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
              <Card class="overflow-hidden border-0 bg-linear-to-br from-slate-50/80 via-white to-white p-6 shadow-lg ring-1 ring-slate-200/80">
                <div class="mb-4 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    <h3 class="text-lg font-semibold text-slate-800">Dernières observations médicales</h3>
                  </div>
                  <RouterLink
                    to={`/hospital/patients/${id.value}/episodes`}
                    class="text-sm font-medium text-primary hover:opacity-90"
                  >
                    Toutes →
                  </RouterLink>
                </div>
                <div class="mt-4 space-y-3">
                  {episodes.value?.length ? (
                    episodes.value.slice(0, 5).map((e) => (
                      <div
                        key={e.id}
                        class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div class="flex items-center justify-between">
                          <Badge variant={e.type === 'EMERGENCY' ? 'destructive' : 'default'}>
                            {episodeLabels[e.type] ?? e.type}
                          </Badge>
                          <span class="text-sm text-slate-500">{e.start_date}</span>
                        </div>
                        <p class="mt-2 text-sm font-medium text-slate-700">{e.reason ?? '—'}</p>
                        {e.provenance ? (
                          <p class="mt-1 text-xs text-slate-500">Provenance : {e.provenance}</p>
                        ) : null}
                        {e.therapeutic_pathway ? (
                          <p class="mt-1 text-xs text-slate-500">Parcours : {e.therapeutic_pathway}</p>
                        ) : null}
                        {e.diagnosis && (
                          <p class="mt-1 text-xs text-slate-500">{e.diagnosis}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p class="rounded-xl border border-dashed border-slate-200 bg-slate-50/30 py-8 text-center text-sm text-slate-500">
                      Aucune observation médicale enregistrée
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
