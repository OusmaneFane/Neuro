import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { Paginated, User } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';

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
};

export default defineComponent({
  name: 'PersonnelPage',
  setup() {
    const query = ref('');
    const role = ref('');
    const page = ref(1);

    const { data, isLoading } = useQuery({
      queryKey: ['users', query, role, page],
      queryFn: async () => {
        const { data: res } = await api.get<Paginated<User>>('/users', {
          params: { query: query.value || undefined, role: role.value || undefined, page: page.value, limit: 20 },
        });
        return res;
      },
    });

    return () => (
      <div class="space-y-6 sm:space-y-8">
        <div class="min-w-0">
          <h1 class="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
            Personnel
          </h1>
          <p class="mt-1 text-sm text-slate-600 sm:text-base">
            Liste des utilisateurs hospitaliers (médecins, infirmiers, secrétaires, etc.)
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <div class="min-w-0 flex-1 sm:max-w-md">
            <Input v-model={query.value} placeholder="Rechercher par nom ou email" />
          </div>
          <select
            v-model={role.value}
            class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-auto"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="DOCTOR">Médecin</option>
            <option value="INTERN">Interne</option>
            <option value="NURSE">Infirmier(ère)</option>
            <option value="DS">Directeur de soins</option>
            <option value="ARCHIVIST">Archiviste</option>
            <option value="SECRETARY">Secrétaire</option>
            <option value="CASHIER">Caissier(ère)</option>
            <option value="ACCOUNTANT">Comptable</option>
            <option value="PHARMACIST">Pharmacien(ne)</option>
            <option value="STOREKEEPER">Magasinier(ère)</option>
          </select>
        </div>
        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data.value?.data?.length ? (
            <div class="p-8 sm:p-12">
              <EmptyState title="Aucun utilisateur" description="Aucun membre du personnel ne correspond à votre recherche." />
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div class="space-y-4 p-4 md:hidden">
                {data.value?.data.map((u) => (
                  <div key={u.id} class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p class="font-semibold text-slate-800">{u.full_name}</p>
                    <p class="mt-1 truncate text-sm text-slate-600">{u.email}</p>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={u.role === 'ADMIN' ? 'destructive' : 'default'}>{roleLabels[u.role] ?? u.role}</Badge>
                      {u.hospital?.name && <span class="text-xs text-slate-500">{u.hospital.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <div class="hidden overflow-x-auto md:block">
                <table class="w-full min-w-[640px]">
                  <thead>
                    <tr class="border-b border-slate-200 bg-slate-50/80 text-left text-sm text-slate-600">
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Nom</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Email</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Rôle</th>
                      <th class="px-4 py-3 font-semibold sm:px-6 sm:py-4">Établissement</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {data.value?.data.map((u) => (
                      <tr key={u.id} class="transition hover:bg-slate-50/50">
                        <td class="px-4 py-3 font-semibold text-slate-800 sm:px-6 sm:py-4">{u.full_name}</td>
                        <td class="max-w-[200px] truncate px-4 py-3 text-sm text-slate-600 sm:px-6 sm:py-4">{u.email}</td>
                        <td class="px-4 py-3 sm:px-6 sm:py-4">
                          <Badge variant={u.role === 'ADMIN' ? 'destructive' : 'default'}>{roleLabels[u.role] ?? u.role}</Badge>
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
      </div>
    );
  },
});
