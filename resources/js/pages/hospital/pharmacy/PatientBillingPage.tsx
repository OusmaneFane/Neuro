import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

interface InvoiceRow {
  id: number;
  number: string;
  status: string;
  total: number;
  balance_due: number;
  issued_at?: string;
}

interface Coverage {
  id: number;
  member_number?: string;
  coverage_rate: number;
  ceiling_amount?: number;
  is_primary: boolean;
  is_active: boolean;
  payer?: { id: number; name: string; code: string };
}

interface Payer {
  id: number;
  code: string;
  name: string;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon', ISSUED: 'Émise', PARTIALLY_PAID: 'Part. payée',
  PAID: 'Payée', CANCELLED: 'Annulée', CREDITED: 'Avoir',
};

export default defineComponent({
  name: 'PatientBillingPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientId = computed(() => route.params.id as string);
    const showCoverageForm = ref(false);
    const coverageForm = ref({ payer_id: '', member_number: '', coverage_rate: '80', is_primary: true });

    const { data: invoices, isLoading: loadingInvoices } = useQuery({
      queryKey: ['patient-invoices', patientId],
      queryFn: async () => {
        const { data: res } = await api.get('/invoices', { params: { patient_id: patientId.value, limit: 50 } });
        return pageItems<InvoiceRow>(res).data;
      },
    });

    const { data: coverages, isLoading: loadingCoverages } = useQuery({
      queryKey: ['patient-coverages', patientId],
      queryFn: async () => {
        const { data } = await api.get(`/patients/${patientId.value}/coverages`);
        return unwrap<Coverage[]>(data);
      },
    });

    const { data: payers } = useQuery({
      queryKey: ['payers-select'],
      queryFn: async () => {
        const { data } = await api.get('/payers', { params: { limit: 100 } });
        return pageItems<Payer>(unwrap(data)).data;
      },
    });

    const payerOptions = computed(() => (payers.value ?? []).map((p) => ({ value: String(p.id), label: p.name })));

    const addCoverage = useMutation({
      mutationFn: () => api.post(`/patients/${patientId.value}/coverages`, {
        payer_id: Number(coverageForm.value.payer_id),
        member_number: coverageForm.value.member_number || undefined,
        coverage_rate: Number(coverageForm.value.coverage_rate),
        is_primary: coverageForm.value.is_primary,
        is_active: true,
      }),
      onSuccess: () => {
        toast.add('Couverture ajoutée', 'success');
        showCoverageForm.value = false;
        queryClient.invalidateQueries({ queryKey: ['patient-coverages', patientId] });
      },
      onError: () => toast.add('Erreur', 'error'),
    });

    const totalDue = computed(() => (invoices.value ?? []).reduce((s, i) => s + (i.balance_due ?? 0), 0));

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Facturation</h2>
            <p class="mt-1 text-sm text-slate-600">Factures et couvertures du patient</p>
          </div>
          <RouterLink
            to={`/hospital/finance/invoices/new?patient_id=${patientId.value}`}
            class="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Nouvelle facture
          </RouterLink>
        </div>

        <Card class="border-emerald-200 bg-emerald-50/30 p-5">
          <p class="text-sm font-medium text-emerald-800">Solde patient total</p>
          <p class="mt-1 text-2xl font-bold text-emerald-900">{formatMoney(totalDue.value)}</p>
        </Card>

        <Card class="overflow-hidden p-0">
          <div class="border-b bg-emerald-50/50 px-6 py-3 font-semibold text-emerald-900">Factures</div>
          {loadingInvoices.value ? (
            <div class="flex justify-center py-12"><Spinner /></div>
          ) : !invoices.value?.length ? (
            <div class="p-8"><EmptyState title="Aucune facture" /></div>
          ) : (
            <table class="w-full">
              <thead>
                <tr class="border-b text-left text-sm text-slate-500">
                  <th class="px-6 py-3">N°</th>
                  <th class="px-6 py-3">Statut</th>
                  <th class="px-6 py-3">Date</th>
                  <th class="px-6 py-3 text-right">Total</th>
                  <th class="px-6 py-3 text-right">Solde</th>
                  <th class="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y">
                {invoices.value.map((inv) => (
                  <tr key={inv.id}>
                    <td class="px-6 py-3 font-mono text-sm">{inv.number}</td>
                    <td class="px-6 py-3"><Badge variant="default">{statusLabels[inv.status] ?? inv.status}</Badge></td>
                    <td class="px-6 py-3 text-sm">{inv.issued_at?.slice(0, 10) ?? '—'}</td>
                    <td class="px-6 py-3 text-right">{formatMoney(inv.total)}</td>
                    <td class="px-6 py-3 text-right font-semibold text-emerald-700">{formatMoney(inv.balance_due)}</td>
                    <td class="px-6 py-3 text-right">
                      <RouterLink to={`/hospital/finance/invoices/${inv.id}`} class="text-sm font-semibold text-emerald-700 hover:underline">Voir →</RouterLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card class="overflow-hidden p-0">
          <div class="flex items-center justify-between border-b bg-teal-50/50 px-6 py-3">
            <span class="font-semibold text-teal-900">Couvertures / tiers payants</span>
            <Button size="sm" variant="outline" onClick={() => { showCoverageForm.value = !showCoverageForm.value; }}>Ajouter</Button>
          </div>

          {showCoverageForm.value && (
            <div class="border-b bg-slate-50 p-4">
              <div class="grid gap-3 sm:grid-cols-4">
                <SearchableSelect modelValue={coverageForm.value.payer_id} onUpdate:modelValue={(v: string) => { coverageForm.value.payer_id = v; }} options={payerOptions.value} placeholder="Payeur" />
                <Input v-model={coverageForm.value.member_number} placeholder="N° adhérent" />
                <Input type="number" v-model={coverageForm.value.coverage_rate} placeholder="Taux %" min={0} max={100} />
                <Button class="bg-emerald-600" loading={addCoverage.isPending.value} disabled={!coverageForm.value.payer_id} onClick={() => addCoverage.mutate()}>Enregistrer</Button>
              </div>
            </div>
          )}

          {loadingCoverages.value ? (
            <div class="flex justify-center py-8"><Spinner /></div>
          ) : !coverages.value?.length ? (
            <div class="p-8"><EmptyState title="Aucune couverture" description="Ajoutez une couverture mutuelle ou assurance." /></div>
          ) : (
            <ul class="divide-y">
              {coverages.value.map((c) => (
                <li key={c.id} class="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
                  <div>
                    <span class="font-medium">{c.payer?.name}</span>
                    {c.is_primary && <Badge variant="success" class="ml-2">Principale</Badge>}
                    {c.member_number && <span class="ml-2 text-sm text-slate-500">N° {c.member_number}</span>}
                  </div>
                  <span class="text-sm font-semibold text-teal-700">{c.coverage_rate} %</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    );
  },
});
