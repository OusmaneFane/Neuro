import Badge from '@/components/ui/badge';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { pageItems } from '@/lib/unwrap';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';
import { RouterLink } from 'vue-router';

interface InvoiceRow {
  id: number;
  number: string;
  status: string;
  total: number;
  balance_due: number;
  issued_at?: string;
  patient?: { id: number; iup: string; first_name: string; last_name: string };
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  ISSUED: 'Émise',
  PARTIALLY_PAID: 'Partiellement payée',
  PAID: 'Payée',
  CANCELLED: 'Annulée',
  CREDITED: 'Avoir',
};

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  DRAFT: 'default',
  ISSUED: 'warning',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  CANCELLED: 'error',
  CREDITED: 'default',
};

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
];

export default defineComponent({
  name: 'InvoicesListPage',
  setup() {
    const query = ref('');
    const status = ref('');
    const page = ref(1);

    const { data, isLoading } = useQuery({
      queryKey: ['invoices', query, status, page],
      queryFn: async () => {
        const { data: res } = await api.get('/invoices', {
          params: { query: query.value || undefined, status: status.value || undefined, page: page.value, limit: 20 },
        });
        return pageItems<InvoiceRow>(res);
      },
    });

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Factures</h1>
            <p class="mt-1 text-slate-600">Liste des factures patients et encaissements</p>
          </div>
          <RouterLink
            to="/hospital/finance/invoices/new"
            class="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700"
          >
            Nouvelle facture
          </RouterLink>
        </div>

        <div class="flex flex-wrap gap-3">
          <div class="min-w-[200px] flex-1 sm:max-w-xs">
            <Input v-model={query.value} placeholder="N° facture, patient, IUP..." />
          </div>
          <div class="min-w-[180px]">
            <SearchableSelect
              modelValue={status.value}
              onUpdate:modelValue={(v: string) => { status.value = v; page.value = 1; }}
              options={statusOptions}
              placeholder="Statut"
            />
          </div>
        </div>

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16"><Spinner /></div>
          ) : !data.value?.data.length ? (
            <div class="p-12"><EmptyState title="Aucune facture" description="Créez une première facture." /></div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full min-w-[720px]">
                <thead>
                  <tr class="border-b border-slate-200 bg-emerald-50/50 text-left text-sm text-slate-600">
                    <th class="px-4 py-3 font-semibold sm:px-6">N°</th>
                    <th class="px-4 py-3 font-semibold sm:px-6">Patient</th>
                    <th class="px-4 py-3 font-semibold sm:px-6">Statut</th>
                    <th class="px-4 py-3 font-semibold sm:px-6">Émise le</th>
                    <th class="px-4 py-3 font-semibold sm:px-6 text-right">Total</th>
                    <th class="px-4 py-3 font-semibold sm:px-6 text-right">Solde</th>
                    <th class="px-4 py-3 sm:px-6"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {data.value.data.map((inv) => (
                    <tr key={inv.id} class="hover:bg-emerald-50/30">
                      <td class="px-4 py-3 font-mono text-sm font-medium sm:px-6">{inv.number ?? `#${inv.id}`}</td>
                      <td class="px-4 py-3 sm:px-6">
                        {inv.patient ? (
                          <div>
                            <span class="font-medium text-slate-800">{inv.patient.last_name} {inv.patient.first_name}</span>
                            <span class="ml-2 font-mono text-xs text-slate-500">{inv.patient.iup}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td class="px-4 py-3 sm:px-6">
                        <Badge variant={statusVariant[inv.status] ?? 'default'}>{statusLabels[inv.status] ?? inv.status}</Badge>
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-600 sm:px-6">{inv.issued_at?.slice(0, 10) ?? '—'}</td>
                      <td class="px-4 py-3 text-right text-sm font-medium sm:px-6">{formatMoney(inv.total)}</td>
                      <td class="px-4 py-3 text-right text-sm font-semibold text-emerald-700 sm:px-6">{formatMoney(inv.balance_due)}</td>
                      <td class="px-4 py-3 text-right sm:px-6">
                        <RouterLink to={`/hospital/finance/invoices/${inv.id}`} class="text-sm font-semibold text-emerald-700 hover:underline">
                          Détail →
                        </RouterLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {data.value && data.value.last_page > 1 && (
          <div class="flex justify-center gap-2">
            <button
              type="button"
              disabled={page.value <= 1}
              onClick={() => { page.value--; }}
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Précédent
            </button>
            <span class="px-4 py-2 text-sm text-slate-600">Page {data.value.current_page} / {data.value.last_page}</span>
            <button
              type="button"
              disabled={page.value >= data.value.last_page}
              onClick={() => { page.value++; }}
              class="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    );
  },
});
