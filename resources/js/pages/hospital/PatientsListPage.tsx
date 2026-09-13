import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { SearchableSelectOption } from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { CLINICAL_WRITE_ROLES, hasRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/auth';
import type { Paginated, Patient } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { computed, defineComponent, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

const statusOptions: SearchableSelectOption[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
];

interface PatientStats {
  total: number;
  active: number;
  this_month: number;
  evolution: { Favorable: number; Chronique: number; Décès: number };
  mode_sortie: Record<string, number>;
}

function ageFromBirthDate(birthDate: string | undefined): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? `${age} ans` : '—';
}

export default defineComponent({
  name: 'PatientsListPage',
  setup() {
    const auth = useAuthStore();
    const route = useRoute();
    const router = useRouter();
    const query = ref((route.query.query as string) ?? '');
    const status = ref((route.query.status as string) ?? '');
    const page = ref(1);
    const advancedOpen = ref(false);
    const canCreatePatient = computed(() => hasRole(auth.user?.role, CLINICAL_WRITE_ROLES));

    watch(
      () => route.query.query,
      (q) => { query.value = (q as string) ?? ''; },
      { immediate: true }
    );
    watch(
      () => route.query.status,
      (s) => { status.value = (s as string) ?? ''; },
      { immediate: true }
    );

    function applySearch() {
      const q: Record<string, string> = {};
      if (query.value) q.query = query.value;
      if (status.value) q.status = status.value;
      router.push({ path: route.path, query: q });
    }

    const { data: stats } = useQuery({
      queryKey: ['patients-stats'],
      queryFn: async () => {
        const { data } = await api.get<PatientStats>('/patients/stats');
        return data;
      },
    });

    const { data, isLoading } = useQuery({
      queryKey: ['patients', query, status, page],
      queryFn: async () => {
        const { data: res } = await api.get<Paginated<Patient>>('/patients', {
          params: {
            query: query.value || undefined,
            status: status.value || undefined,
            page: page.value,
            limit: 15,
          },
        });
        return res;
      },
    });

    return () => (
      <div class="space-y-6 sm:space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <h1 class="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
              Patients
            </h1>
            <p class="mt-1 text-sm text-slate-600 sm:text-base">
              Gérez les dossiers patients et accédez aux informations médicales
            </p>
          </div>
          {canCreatePatient.value ? (
            <RouterLink
              to="/hospital/patients/new"
              class="shrink-0 text-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:opacity-90 sm:px-5"
            >
              Nouveau patient
            </RouterLink>
          ) : null}
        </div>

        {stats.value && (
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-5 text-white shadow-lg shadow-primary/20">
              <p class="text-sm font-medium opacity-90">Total patients</p>
              <p class="mt-1 text-3xl font-bold tracking-tight">{stats.value.total.toLocaleString('fr-FR')}</p>
              <p class="mt-1 text-xs opacity-80">Dossiers enregistrés</p>
            </div>
            <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20">
              <p class="text-sm font-medium opacity-90">Patients actifs</p>
              <p class="mt-1 text-3xl font-bold tracking-tight">{stats.value.active.toLocaleString('fr-FR')}</p>
              <p class="mt-1 text-xs opacity-80">Statut actif</p>
            </div>
            <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-500/20">
              <p class="text-sm font-medium opacity-90">Ce mois</p>
              <p class="mt-1 text-3xl font-bold tracking-tight">{stats.value.this_month.toLocaleString('fr-FR')}</p>
              <p class="mt-1 text-xs opacity-80">Nouveaux inscrits</p>
            </div>
            <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-lg shadow-violet-500/20">
              <p class="text-sm font-medium opacity-90">Évolution</p>
              <p class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-lg font-bold tracking-tight">
                <span>Fav. {stats.value.evolution.Favorable}</span>
                <span>Chron. {stats.value.evolution.Chronique}</span>
                <span>Décès {stats.value.evolution.Décès}</span>
              </p>
              <p class="mt-1 text-xs opacity-80">Favorable · Chronique · Décès</p>
            </div>
          </div>
        )}

        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-3">
            <Input
              v-model={query.value}
              placeholder="Rechercher par nom, prénom, IUP..."
              onKeydown={(e: KeyboardEvent) => e.key === 'Enter' && applySearch()}
            />
            <button
              type="button"
              onClick={() => { advancedOpen.value = !advancedOpen.value; }}
              class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {advancedOpen.value ? 'Masquer' : 'Recherche avancée'}
            </button>
            <button
              type="button"
              onClick={applySearch}
              class="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Appliquer
            </button>
          </div>
          {advancedOpen.value && (
            <div class="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div class="min-w-[200px]">
                <label class="mb-1 block text-sm font-medium text-slate-700">Statut</label>
                <SearchableSelect
                  modelValue={status.value}
                  onUpdate:modelValue={(v: string) => { status.value = v; }}
                  options={statusOptions}
                  placeholder="Tous les statuts"
                />
              </div>
              <div class="min-w-0 flex-1 sm:max-w-xs">
                <label class="mb-1 block text-sm font-medium text-slate-700">Recherche texte</label>
                <Input
                  v-model={query.value}
                  placeholder="Nom, prénom, IUP..."
                />
              </div>
            </div>
          )}
        </div>

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data.value?.data.length ? (
            <div class="p-8 sm:p-12">
              <EmptyState
                title="Aucun patient"
                description="Créez un premier patient pour commencer."
              />
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div class="space-y-4 p-4 md:hidden">
                {data.value?.data.map((p) => (
                  <RouterLink
                    key={p.id}
                    to={`/hospital/patients/${p.id}`}
                    class="block"
                  >
                    <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0 flex-1">
                          <p class="font-semibold text-primary truncate">{p.full_name}</p>
                          <p class="mt-1 font-mono text-xs text-slate-500">ID: {p.iup}</p>
                          <dl class="mt-2 space-y-0.5 text-sm text-slate-600">
                            <span class="mr-3">Naiss. {p.birth_date}</span>
                            <span class="mr-3">Âge {ageFromBirthDate(p.birth_date)}</span>
                            <span>Sexe {p.sex}</span>
                            {p.phone && <span class="block mt-0.5">Tél. {p.phone}</span>}
                            {p.treating_doctor && <span class="block mt-0.5 text-slate-500">Dr {p.treating_doctor}</span>}
                            {(p.evolution || p.mode_sortie) && (
                              <span class="block mt-1 text-slate-500">
                                {p.evolution && <span>Évolution: {p.evolution}</span>}
                                {p.evolution && p.mode_sortie && ' · '}
                                {p.mode_sortie && <span>Sortie: {p.mode_sortie}</span>}
                              </span>
                            )}
                          </dl>
                        </div>
                        <Badge variant={p.status === 'active' ? 'success' : 'default'} class="shrink-0">
                          {p.status}
                        </Badge>
                      </div>
                      <p class="mt-3 text-sm font-medium text-primary">Voir le dossier →</p>
                    </div>
                  </RouterLink>
                ))}
              </div>
              {/* Desktop: table */}
              <div class="hidden overflow-x-auto md:block">
                <table class="w-full min-w-[800px]">
                  <thead>
                    <tr class="border-b border-slate-200 bg-slate-50/80 text-left text-sm text-slate-600">
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">ID</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Nom · Prénom</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Naiss. · Âge</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Sexe</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Téléphone</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Médecin traitant</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Évolution</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Mode sortie</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Statut</th>
                      <th class="px-4 py-3 font-semibold text-right sm:px-6 sm:py-4"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {data.value?.data.map((p) => (
                      <tr key={p.id} class="transition hover:bg-slate-50/50">
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          <span class="font-mono text-sm font-medium text-slate-800">{p.iup}</span>
                        </td>
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          <RouterLink
                            to={`/hospital/patients/${p.id}`}
                            class="font-semibold text-primary hover:opacity-90"
                          >
                            {p.last_name} {p.first_name}
                          </RouterLink>
                        </td>
                        <td class="px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">
                          <span>{p.birth_date}</span>
                          <span class="ml-1 text-slate-500">· {ageFromBirthDate(p.birth_date)}</span>
                        </td>
                        <td class="px-4 py-3 text-sm text-slate-700 sm:px-6 sm:py-4">{p.sex}</td>
                        <td class="px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">{p.phone ?? '—'}</td>
                        <td class="max-w-[140px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4" title={p.treating_doctor ?? undefined}>
                          {p.treating_doctor ?? '—'}
                        </td>
                        <td class="max-w-[100px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4" title={p.evolution ?? undefined}>
                          {p.evolution ?? '—'}
                        </td>
                        <td class="max-w-[120px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4" title={p.mode_sortie ?? undefined}>
                          {p.mode_sortie ?? '—'}
                        </td>
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          <Badge variant={p.status === 'active' ? 'success' : 'default'}>{p.status}</Badge>
                        </td>
                        <td class="px-4 py-3 text-right sm:px-6 sm:py-4">
                          <RouterLink
                            to={`/hospital/patients/${p.id}`}
                            class="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/20"
                          >
                            Voir le dossier
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
