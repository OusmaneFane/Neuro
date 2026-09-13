import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { useToastStore } from '@/stores/toast';
import type { Paginated, User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';

interface UserStats {
  total: number;
  by_role: Record<string, number>;
}

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  DOCTOR: 'Médecin',
  INTERN: 'Interne',
  NURSE: 'Infirmier(ère)',
  DS: 'Directeur de soins',
  ARCHIVIST: 'Archiviste',
  SECRETARY: 'Secrétaire',
  CASHIER: 'Caissier(ère)',
  ACCOUNTANT: 'Comptable',
  PHARMACIST: 'Pharmacien(ne)',
  STOREKEEPER: 'Magasinier(ère)',
  PATIENT: 'Patient',
};

const roleColors: Record<string, string> = {
  ADMIN: 'from-rose-500 to-red-600',
  DOCTOR: 'from-teal-500 to-emerald-600',
  INTERN: 'from-sky-500 to-blue-600',
  NURSE: 'from-violet-500 to-purple-600',
  DS: 'from-amber-500 to-orange-500',
  ARCHIVIST: 'from-slate-600 to-slate-700',
  SECRETARY: 'from-cyan-500 to-teal-600',
  CASHIER: 'from-emerald-500 to-green-600',
  ACCOUNTANT: 'from-lime-500 to-emerald-600',
  PHARMACIST: 'from-cyan-500 to-sky-600',
  STOREKEEPER: 'from-blue-500 to-indigo-600',
  PATIENT: 'from-indigo-500 to-violet-600',
};

const roleOrder = ['ADMIN', 'DOCTOR', 'INTERN', 'NURSE', 'DS', 'ARCHIVIST', 'SECRETARY', 'CASHIER', 'ACCOUNTANT', 'PHARMACIST', 'STOREKEEPER', 'PATIENT'];

export default defineComponent({
  name: 'UsersManagementPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const query = ref('');
    const role = ref('');
    const page = ref(1);
    const includePatients = ref(true);
    const modalOpen = ref(false);
    const form = ref({
      email: '',
      password: '',
      password_confirmation: '',
      full_name: '',
      role: 'NURSE' as string,
      hospital_id: '' as string | number,
    });

    const { data: hospitals } = useQuery({
      queryKey: ['hospitals'],
      queryFn: async () => {
        const { data } = await api.get<{ data: { id: number; name: string }[] }>('/hospitals');
        return data.data;
      },
    });

    const createUser = useMutation({
      mutationFn: async () => {
        const payload: Record<string, unknown> = {
          email: form.value.email,
          password: form.value.password,
          password_confirmation: form.value.password_confirmation,
          full_name: form.value.full_name,
          role: form.value.role,
        };
        if (form.value.role !== 'PATIENT' && form.value.hospital_id) {
          payload.hospital_id = Number(form.value.hospital_id);
        }
        const { data } = await api.post<User>('/users', payload);
        return data;
      },
      onSuccess: () => {
        toast.add('Utilisateur créé avec succès', 'success');
        modalOpen.value = false;
        form.value = { email: '', password: '', password_confirmation: '', full_name: '', role: 'NURSE', hospital_id: '' };
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['users-stats'] });
      },
      onError: (err: unknown) => {
        const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const msg = ax.response?.data?.errors
          ? Object.values(ax.response.data.errors).flat().join(' ')
          : ax.response?.data?.message ?? 'Erreur lors de la création';
        toast.add(msg, 'error');
      },
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
      queryKey: ['users-stats'],
      queryFn: async () => {
        const { data } = await api.get<UserStats>('/users/stats');
        return data;
      },
    });

    const { data, isLoading } = useQuery({
      queryKey: ['users', query, role, page, includePatients],
      queryFn: async () => {
        const { data: res } = await api.get<Paginated<User>>('/users', {
          params: {
            query: query.value || undefined,
            role: role.value || undefined,
            page: page.value,
            limit: 20,
            include_patients: includePatients.value || undefined,
          },
        });
        return res;
      },
    });

    const roleStats = computed(() =>
      roleOrder
        .filter((r) => (stats.value?.by_role[r] ?? 0) > 0)
        .map((r) => ({ role: r, count: stats.value!.by_role[r], label: roleLabels[r] ?? r }))
    );

    return () => (
      <div class="space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Gestion des utilisateurs
            </h1>
            <p class="mt-1 text-slate-600">
              Consulter et gérer tous les utilisateurs du système
            </p>
          </div>
          <Button
            class="rounded-xl shadow-lg shadow-teal-600/25"
            onClick={() => { modalOpen.value = true; }}
          >
            Nouvel utilisateur
          </Button>
        </div>

        {statsLoading.value ? (
          <div class="flex justify-center py-12">
            <Spinner />
          </div>
        ) : stats.value ? (
          <>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div class="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-teal-500 to-emerald-600 p-6 text-white shadow-xl shadow-teal-500/25">
                <div class="flex items-center gap-4">
                  <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                    <svg class="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                  <div>
                    <p class="text-sm font-medium text-teal-100">Total utilisateurs</p>
                    <p class="text-3xl font-bold tracking-tight">{stats.value.total.toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              {roleStats.value.slice(0, 3).map(({ role: r, count, label }) => (
                <div
                  key={r}
                  class={[
                    'overflow-hidden rounded-2xl border-0 p-6 text-white shadow-xl',
                    `bg-gradient-to-br ${roleColors[r] ?? roleColors.PATIENT}`,
                  ]}
                >
                  <div class="flex items-center gap-4">
                    <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                      <span class="text-lg font-bold">{count}</span>
                    </span>
                    <div>
                      <p class="text-sm font-medium opacity-90">{label}</p>
                      <p class="text-2xl font-bold">{count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div class="flex flex-wrap gap-2">
              {roleOrder.map((r) => (
                <button
                  key={r}
                  onClick={() => { role.value = role.value === r ? '' : r; }}
                  class={[
                    'rounded-xl px-4 py-2 text-sm font-medium transition',
                    role.value === r
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                  ]}
                >
                  {roleLabels[r] ?? r}
                </button>
              ))}
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  v-model={includePatients.value}
                  class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span class="text-sm font-medium text-slate-700">Inclure les patients</span>
              </label>
            </div>
          </>
        ) : null}

        <div class="flex flex-col gap-4 sm:flex-row">
          <div class="min-w-0 flex-1 sm:max-w-md">
            <Input v-model={query.value} placeholder="Rechercher par nom ou email..." />
          </div>
        </div>

        <Card class="overflow-hidden shadow-lg">
          <div class="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <h3 class="text-lg font-semibold text-slate-800">Liste des utilisateurs</h3>
            <p class="mt-1 text-sm text-slate-500">
              {role.value ? `Filtré par : ${roleLabels[role.value] ?? role.value}` : 'Tous les utilisateurs'}
            </p>
          </div>
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data.value?.data?.length ? (
            <div class="p-12">
              <EmptyState
                title="Aucun utilisateur"
                description="Aucun utilisateur ne correspond à votre recherche."
              />
            </div>
          ) : (
            <>
              <div class="space-y-4 p-4 md:hidden">
                {data.value?.data.map((u) => (
                  <div
                    key={u.id}
                    class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div class="flex items-start gap-4">
                      <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg font-bold text-slate-600">
                        {u.full_name?.charAt(0) ?? '?'}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-semibold text-slate-800">{u.full_name}</p>
                        <p class="mt-1 truncate text-sm text-slate-600">{u.email}</p>
                        <div class="mt-3 flex flex-wrap items-center gap-2">
                          <Badge variant={u.role === 'ADMIN' ? 'destructive' : u.role === 'PATIENT' ? 'warning' : 'default'}>
                            {roleLabels[u.role] ?? u.role}
                          </Badge>
                          {u.hospital?.name && (
                            <span class="text-xs text-slate-500">{u.hospital.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div class="hidden overflow-x-auto md:block">
                <table class="w-full min-w-[640px]">
                  <thead>
                    <tr class="border-b border-slate-200 bg-slate-50/80 text-left text-sm text-slate-600">
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Utilisateur</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Email</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Rôle</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Établissement</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {data.value?.data.map((u) => (
                      <tr key={u.id} class="transition hover:bg-slate-50/50">
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          <div class="flex items-center gap-3">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-semibold text-slate-600">
                              {u.full_name?.charAt(0) ?? '?'}
                            </div>
                            <span class="font-semibold text-slate-800">{u.full_name}</span>
                          </div>
                        </td>
                        <td class="max-w-[200px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">{u.email}</td>
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          <Badge variant={u.role === 'ADMIN' ? 'destructive' : u.role === 'PATIENT' ? 'warning' : 'default'}>
                            {roleLabels[u.role] ?? u.role}
                          </Badge>
                        </td>
                        <td class="px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">{u.hospital?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {modalOpen.value && (
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => { modalOpen.value = false; }}>
            <div class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e: Event) => e.stopPropagation()}>
              <h3 class="text-lg font-semibold text-slate-800">Nouvel utilisateur</h3>
              <form
                class="mt-6 space-y-4"
                onSubmit={(e: Event) => { e.preventDefault(); createUser.mutate(); }}
              >
                <Input v-model={form.value.full_name} label="Nom complet" required />
                <Input v-model={form.value.email} label="Email" type="email" required />
                <Input v-model={form.value.password} label="Mot de passe" type="password" required />
                <Input v-model={form.value.password_confirmation} label="Confirmer le mot de passe" type="password" required />
                <div>
                  <label class="mb-1 block text-sm font-medium text-slate-700">Rôle</label>
                  <select
                    v-model={form.value.role}
                    class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {roleOrder.map((r) => (
                      <option key={r} value={r}>{roleLabels[r] ?? r}</option>
                    ))}
                  </select>
                </div>
                {form.value.role !== 'PATIENT' && (
                  <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Établissement</label>
                    <select
                      v-model={form.value.hospital_id}
                      class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="">— Sélectionner —</option>
                      {hospitals.value?.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div class="flex gap-3 pt-4">
                  <Button type="submit" loading={createUser.isPending.value} class="rounded-xl">
                    Créer
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { modalOpen.value = false; }} class="rounded-xl">
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  },
});
