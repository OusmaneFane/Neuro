import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';
import { RouterLink } from 'vue-router';

interface Claim {
  id: number;
  status: string;
  claimed_amount: number;
  accepted_amount?: number;
  settled_amount?: number;
  payer?: { id: number; name: string; code: string };
  invoice?: { id: number; number: string; patient?: { first_name: string; last_name: string; iup: string } };
}

interface ReceivableRow {
  payer_id: number;
  claimed: number;
  settled: number;
  outstanding: number;
  payer?: { name: string; code: string };
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon', SUBMITTED: 'Soumise', ACCEPTED: 'Acceptée',
  PARTIALLY_PAID: 'Partiellement réglée', REJECTED: 'Rejetée', SETTLED: 'Réglée',
};

const statusOptions = [
  { value: '', label: 'Tous' },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
];

export default defineComponent({
  name: 'ClaimsListPage',
  setup() {
    const status = ref('');
    const page = ref(1);

    const { data: claims, isLoading } = useQuery({
      queryKey: ['claims', status, page],
      queryFn: async () => {
        const { data: res } = await api.get('/third-party-claims', {
          params: { status: status.value || undefined, page: page.value, limit: 20 },
        });
        return pageItems<Claim>(res);
      },
    });

    const { data: receivables } = useQuery({
      queryKey: ['claims-receivables'],
      queryFn: async () => {
        const { data } = await api.get('/third-party-claims/receivables');
        return unwrap<ReceivableRow[]>(data);
      },
    });

    const totalOutstanding = () =>
      (receivables.value ?? []).reduce((s, r) => s + Number(r.outstanding ?? 0), 0);

    return () => (
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Créances tiers payants</h1>
          <p class="mt-1 text-slate-600">Suivi des dossiers et encours par organisme payeur</p>
        </div>

        {receivables.value && receivables.value.length > 0 && (
          <div class="grid gap-4 lg:grid-cols-3">
            <Card class="border-teal-200 bg-gradient-to-br from-teal-500 to-emerald-600 p-5 text-white lg:col-span-1">
              <p class="text-sm opacity-90">Encours total</p>
              <p class="mt-2 text-3xl font-bold">{formatMoney(totalOutstanding())}</p>
            </Card>
            <Card class="overflow-hidden p-0 lg:col-span-2">
              <div class="border-b bg-teal-50/50 px-4 py-2 text-sm font-semibold text-teal-900">Par payeur</div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b text-left text-slate-500">
                      <th class="px-4 py-2">Payeur</th>
                      <th class="px-4 py-2 text-right">Réclamé</th>
                      <th class="px-4 py-2 text-right">Réglé</th>
                      <th class="px-4 py-2 text-right">Encours</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    {receivables.value.map((r) => (
                      <tr key={r.payer_id}>
                        <td class="px-4 py-2 font-medium">{r.payer?.name ?? r.payer_id}</td>
                        <td class="px-4 py-2 text-right">{formatMoney(r.claimed)}</td>
                        <td class="px-4 py-2 text-right">{formatMoney(r.settled)}</td>
                        <td class="px-4 py-2 text-right font-semibold text-teal-700">{formatMoney(r.outstanding)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        <SearchableSelect
          modelValue={status.value}
          onUpdate:modelValue={(v: string) => { status.value = v; page.value = 1; }}
          options={statusOptions}
          placeholder="Filtrer par statut"
          class="max-w-xs"
        />

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16"><Spinner /></div>
          ) : !claims.value?.data.length ? (
            <div class="p-12"><EmptyState title="Aucune créance" description="Les dossiers tiers payants apparaîtront ici." /></div>
          ) : (
            <table class="w-full min-w-[640px]">
              <thead>
                <tr class="border-b bg-emerald-50/50 text-left text-sm text-slate-600">
                  <th class="px-4 py-3 sm:px-6">Payeur</th>
                  <th class="px-4 py-3 sm:px-6">Patient / Facture</th>
                  <th class="px-4 py-3 sm:px-6">Statut</th>
                  <th class="px-4 py-3 sm:px-6 text-right">Montant</th>
                  <th class="px-4 py-3 sm:px-6"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {claims.value.data.map((c) => (
                  <tr key={c.id} class="hover:bg-emerald-50/20">
                    <td class="px-4 py-3 sm:px-6">{c.payer?.name ?? '—'}</td>
                    <td class="px-4 py-3 text-sm sm:px-6">
                      {c.invoice?.patient && (
                        <span>{c.invoice.patient.last_name} {c.invoice.patient.first_name}</span>
                      )}
                      <span class="ml-2 font-mono text-slate-500">{c.invoice?.number}</span>
                    </td>
                    <td class="px-4 py-3 sm:px-6">
                      <Badge variant={c.status === 'SETTLED' ? 'success' : c.status === 'REJECTED' ? 'error' : 'warning'}>
                        {statusLabels[c.status] ?? c.status}
                      </Badge>
                    </td>
                    <td class="px-4 py-3 text-right font-medium sm:px-6">{formatMoney(c.claimed_amount)}</td>
                    <td class="px-4 py-3 text-right sm:px-6">
                      <RouterLink to={`/hospital/finance/claims/${c.id}`} class="text-sm font-semibold text-emerald-700 hover:underline">
                        Détail →
                      </RouterLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    );
  },
});
