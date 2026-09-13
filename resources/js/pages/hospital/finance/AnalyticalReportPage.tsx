import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import Tabs from '@/components/ui/Tabs';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download';
import { formatMoney } from '@/lib/money';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';


interface CostCenterRow {
  id: number;
  code: string;
  name: string;
  total: number;
}

interface JournalEntry {
  id: number;
  entry_date: string;
  account_code: string;
  label: string;
  debit: number;
  credit: number;
  cost_center?: { code: string; name: string };
}

export default defineComponent({
  name: 'AnalyticalReportPage',
  setup() {
    const tab = ref('cost-center');
    const from = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
    const to = ref(new Date().toISOString().slice(0, 10));
    const journalPage = ref(1);

    const tabs = [
      { value: 'cost-center', label: 'Par centre de coût' },
      { value: 'journal', label: 'Journal comptable' },
    ];

    const { data: costCenterReport, isLoading: loadingCc } = useQuery({
      queryKey: ['analytics-cost-center', from, to],
      queryFn: async () => {
        const { data } = await api.get('/analytics/by-cost-center', { params: { from: from.value, to: to.value } });
        return unwrap<CostCenterRow[]>(data);
      },
      enabled: () => tab.value === 'cost-center',
    });

    const { data: journal, isLoading: loadingJournal } = useQuery({
      queryKey: ['accounting-journal', from, to, journalPage],
      queryFn: async () => {
        const { data: res } = await api.get('/accounting/journal', {
          params: { from: from.value, to: to.value, page: journalPage.value, limit: 50 },
        });
        return pageItems<JournalEntry>(res);
      },
      enabled: () => tab.value === 'journal',
    });

    async function exportCsv() {
      await downloadBlob(
        `/analytics/by-cost-center/export?from=${encodeURIComponent(from.value)}&to=${encodeURIComponent(to.value)}`,
        `analytique-${from.value}-${to.value}.csv`,
      );
    }

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Rapport analytique</h1>
            <p class="mt-1 text-slate-600">Répartition par centre de coût et journal des écritures</p>
          </div>
          {tab.value === 'cost-center' && (
            <button
              type="button"
              onClick={exportCsv}
              class="inline-flex rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Export CSV
            </button>
          )}
        </div>

        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="mb-1 block text-sm text-slate-600">Du</label>
            <Input type="date" v-model={from.value} class="w-40" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-slate-600">Au</label>
            <Input type="date" v-model={to.value} class="w-40" />
          </div>
        </div>

        <Tabs modelValue={tab.value} onUpdate:modelValue={(v: string) => { tab.value = v; }} tabs={tabs} />

        {tab.value === 'cost-center' && (
          <Card class="overflow-hidden p-0">
            {loadingCc.value ? (
              <div class="flex justify-center py-16"><Spinner /></div>
            ) : !costCenterReport.value?.length ? (
              <div class="p-12"><EmptyState title="Aucune donnée" description="Aucune allocation sur la période." /></div>
            ) : (
              <>
                <div class="border-b bg-emerald-50/50 px-6 py-3 text-sm text-emerald-900">
                  Période : {from.value} → {to.value}
                </div>
                <table class="w-full">
                  <thead>
                    <tr class="border-b text-left text-sm text-slate-600">
                      <th class="px-6 py-3">Code</th>
                      <th class="px-6 py-3">Centre de coût</th>
                      <th class="px-6 py-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    {costCenterReport.value.map((r) => (
                      <tr key={r.id} class="hover:bg-emerald-50/20">
                        <td class="px-6 py-3 font-mono text-sm">{r.code}</td>
                        <td class="px-6 py-3">{r.name}</td>
                        <td class="px-6 py-3 text-right font-semibold text-emerald-700">{formatMoney(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr class="border-t bg-slate-50 font-bold">
                      <td class="px-6 py-3" colSpan={2}>Total</td>
                      <td class="px-6 py-3 text-right text-emerald-800">
                        {formatMoney(costCenterReport.value.reduce((s, r) => s + Number(r.total), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </Card>
        )}

        {tab.value === 'journal' && (
          <Card class="overflow-hidden p-0">
            {loadingJournal.value ? (
              <div class="flex justify-center py-16"><Spinner /></div>
            ) : !journal.value?.data.length ? (
              <div class="p-12"><EmptyState title="Journal vide" /></div>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr class="border-b bg-slate-50 text-left text-slate-600">
                      <th class="px-4 py-3">Date</th>
                      <th class="px-4 py-3">Compte</th>
                      <th class="px-4 py-3">Libellé</th>
                      <th class="px-4 py-3">Centre</th>
                      <th class="px-4 py-3 text-right">Débit</th>
                      <th class="px-4 py-3 text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    {journal.value.data.map((e) => (
                      <tr key={e.id}>
                        <td class="px-4 py-2">{e.entry_date?.slice(0, 10)}</td>
                        <td class="px-4 py-2 font-mono">{e.account_code}</td>
                        <td class="px-4 py-2">{e.label}</td>
                        <td class="px-4 py-2 text-slate-500">{e.cost_center?.code ?? '—'}</td>
                        <td class="px-4 py-2 text-right">{e.debit ? formatMoney(e.debit) : '—'}</td>
                        <td class="px-4 py-2 text-right">{e.credit ? formatMoney(e.credit) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  },
});
