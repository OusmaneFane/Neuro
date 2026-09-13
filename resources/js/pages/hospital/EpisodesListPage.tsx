import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { Episode, Paginated } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';
import { RouterLink } from 'vue-router';

const episodeLabels: Record<string, string> = {
  CONSULTATION: 'Consultation',
  HOSPITALIZATION: 'Hospitalisation',
  EMERGENCY: 'Urgence',
};

export default defineComponent({
  name: 'EpisodesListPage',
  setup() {
    const query = ref('');
    const type = ref('');
    const page = ref(1);

    const { data, isLoading } = useQuery({
      queryKey: ['episodes', query, type, page],
      queryFn: async () => {
        const { data: res } = await api.get<Paginated<Episode>>('/episodes', {
          params: {
            query: query.value || undefined,
            type: type.value || undefined,
            page: page.value,
            limit: 20,
          },
        });
        return res;
      },
    });

    return () => (
      <div class="space-y-6 sm:space-y-8">
        <div class="min-w-0">
          <h1 class="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
            Observations médicales
          </h1>
          <p class="mt-1 text-sm text-slate-600 sm:text-base">
            Vue centralisée de toutes les observations médicales (consultations, hospitalisations, urgences)
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <div class="min-w-0 flex-1 sm:max-w-md">
            <Input v-model={query.value} placeholder="Rechercher par patient (nom, ID...)" />
          </div>
          <select
            v-model={type.value}
            class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto"
          >
            <option value="">Tous</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="HOSPITALIZATION">Hospitalisation</option>
            <option value="EMERGENCY">Urgence</option>
          </select>
          <RouterLink
            to="/hospital/dashboard"
            class="w-full text-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto"
          >
            Tableau de bord
          </RouterLink>
        </div>

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data.value?.data.length ? (
            <div class="p-8 sm:p-12">
              <EmptyState title="Aucune observation médicale" description="Aucune observation ne correspond à votre recherche." />
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div class="space-y-4 p-4 md:hidden">
                {data.value?.data.map((e) => (
                  <RouterLink key={e.id} to={`/hospital/patients/${e.patient_id}`} class="block">
                    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant={e.type === 'EMERGENCY' ? 'destructive' : 'default'}>
                          {episodeLabels[e.type] ?? e.type}
                        </Badge>
                        <span class="text-sm text-slate-500">{e.start_date}</span>
                      </div>
                      {e.patient && (
                        <p class="mt-2 font-semibold text-primary">{e.patient.full_name}</p>
                      )}
                      <p class="mt-1 line-clamp-2 text-sm text-slate-600">{e.reason ?? '—'}</p>
                      {e.provenance ? (
                        <p class="mt-1 line-clamp-2 text-xs text-slate-500">Provenance : {e.provenance}</p>
                      ) : null}
                      {e.therapeutic_pathway ? (
                        <p class="mt-1 line-clamp-2 text-xs text-slate-500">Parcours : {e.therapeutic_pathway}</p>
                      ) : null}
                      <p class="mt-3 text-sm font-medium text-primary">Voir patient →</p>
                    </div>
                  </RouterLink>
                ))}
              </div>
              {/* Desktop: table */}
              <div class="hidden overflow-x-auto md:block">
                <table class="w-full min-w-[640px]">
                  <thead>
                    <tr class="border-b border-slate-200 bg-slate-50/80 text-left text-sm text-slate-600">
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Patient</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Type</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Date entrée</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Motif</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Provenance</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Parcours</th>
                      <th class="px-4 py-3 font-semibold text-right sm:px-6 sm:py-4"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {data.value?.data.map((e) => (
                      <tr key={e.id} class="transition hover:bg-slate-50/50">
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          {e.patient ? (
                            <div>
                              <RouterLink to={`/hospital/patients/${e.patient_id}`} class="font-semibold text-primary hover:opacity-90">
                                {e.patient.full_name}
                              </RouterLink>
                              <p class="font-mono text-xs text-slate-500">ID: {e.patient.iup}</p>
                            </div>
                          ) : (
                            <span class="text-slate-500">—</span>
                          )}
                        </td>
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          <Badge variant={e.type === 'EMERGENCY' ? 'destructive' : 'default'}>{episodeLabels[e.type] ?? e.type}</Badge>
                        </td>
                        <td class="px-4 py-3 text-sm font-medium text-slate-700 sm:px-6 sm:py-4">{e.start_date}</td>
                        <td class="max-w-[200px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">{e.reason ?? '—'}</td>
                        <td class="max-w-[180px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">{e.provenance ?? '—'}</td>
                        <td class="max-w-[180px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">{e.therapeutic_pathway ?? '—'}</td>
                        <td class="px-4 py-3 text-right sm:px-6 sm:py-4">
                          <RouterLink to={`/hospital/patients/${e.patient_id}`} class="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20">
                            Voir patient
                          </RouterLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  },
});
