import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { downloadBlob } from '@/lib/download';
import { formatMoney } from '@/lib/money';
import { unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

interface InvoiceDetail {
  id: number;
  number: string;
  status: string;
  total: number;
  balance_due: number;
  patient_share: number;
  third_party_share: number;
  notes?: string;
  issued_at?: string;
  patient?: { id: number; iup: string; first_name: string; last_name: string };
  lines?: { id: number; label: string; quantity: number; unit_price: number; line_total: number }[];
  payments?: { id: number; amount: number; mode: string; paid_at: string; reference?: string }[];
  claims?: { id: number; status: string; claimed_amount: number; payer?: { name: string } }[];
  credit_notes?: { id: number; number: string; total: number }[];
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon', ISSUED: 'Émise', PARTIALLY_PAID: 'Partiellement payée',
  PAID: 'Payée', CANCELLED: 'Annulée', CREDITED: 'Avoir',
};

const paymentModes = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'CARD', label: 'Carte' },
  { value: 'BANK_TRANSFER', label: 'Virement' },
  { value: 'CHEQUE', label: 'Chèque' },
];

export default defineComponent({
  name: 'InvoiceDetailPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const invoiceId = computed(() => route.params.id as string);
    const payAmount = ref('');
    const payMode = ref('CASH');
    const payReference = ref('');

    const { data: invoice, isLoading } = useQuery({
      queryKey: ['invoice', invoiceId],
      queryFn: async () => {
        const { data } = await api.get(`/invoices/${invoiceId.value}`);
        return unwrap<InvoiceDetail>(data);
      },
    });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    };

    const issue = useMutation({
      mutationFn: () => api.post(`/invoices/${invoiceId.value}/issue`),
      onSuccess: () => { toast.add('Facture émise', 'success'); invalidate(); },
      onError: () => toast.add('Émission impossible', 'error'),
    });

    const cancel = useMutation({
      mutationFn: () => api.post(`/invoices/${invoiceId.value}/cancel`),
      onSuccess: () => { toast.add('Facture annulée', 'success'); invalidate(); },
      onError: () => toast.add('Annulation impossible', 'error'),
    });

    const credit = useMutation({
      mutationFn: () => api.post(`/invoices/${invoiceId.value}/credit-notes`, {}),
      onSuccess: () => { toast.add('Avoir créé', 'success'); invalidate(); },
      onError: () => toast.add('Avoir impossible', 'error'),
    });

    const pay = useMutation({
      mutationFn: () => api.post('/payments', {
        invoice_id: Number(invoiceId.value),
        amount: Number(payAmount.value),
        mode: payMode.value,
        reference: payReference.value || undefined,
      }),
      onSuccess: () => {
        toast.add('Paiement enregistré', 'success');
        payAmount.value = '';
        payReference.value = '';
        invalidate();
      },
      onError: () => toast.add('Paiement refusé', 'error'),
    });

    async function downloadPdf() {
      try {
        await downloadBlob(`/invoices/${invoiceId.value}/pdf`, `facture-${invoice.value?.number ?? invoiceId.value}.pdf`);
      } catch {
        toast.add('Téléchargement PDF impossible', 'error');
      }
    }

    return () => (
      <div class="space-y-6">
        {isLoading.value ? (
          <div class="flex justify-center py-24"><Spinner /></div>
        ) : invoice.value ? (
          <>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <RouterLink to="/hospital/finance/invoices" class="text-sm font-medium text-emerald-700 hover:underline">← Factures</RouterLink>
                <h1 class="mt-2 text-2xl font-bold text-slate-900">{invoice.value.number ?? `Facture #${invoice.value.id}`}</h1>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={invoice.value.status === 'PAID' ? 'success' : 'warning'}>
                    {statusLabels[invoice.value.status] ?? invoice.value.status}
                  </Badge>
                  {invoice.value.patient && (
                    <RouterLink to={`/hospital/patients/${invoice.value.patient.id}/facturation`} class="text-sm text-slate-600 hover:text-emerald-700">
                      {invoice.value.patient.last_name} {invoice.value.patient.first_name} · {invoice.value.patient.iup}
                    </RouterLink>
                  )}
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                {invoice.value.status === 'DRAFT' && (
                  <Button class="bg-emerald-600" loading={issue.isPending.value} onClick={() => issue.mutate()}>Émettre</Button>
                )}
                {['DRAFT', 'ISSUED'].includes(invoice.value.status) && (
                  <Button variant="destructive" loading={cancel.isPending.value} onClick={() => cancel.mutate()}>Annuler</Button>
                )}
                {['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(invoice.value.status) && (
                  <Button variant="outline" loading={credit.isPending.value} onClick={() => credit.mutate()}>Créer un avoir</Button>
                )}
                {invoice.value.status !== 'DRAFT' && (
                  <Button variant="secondary" onClick={downloadPdf}>PDF</Button>
                )}
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-4">
              <Card class="border-emerald-100 bg-emerald-50/40 p-4">
                <p class="text-xs font-medium text-emerald-800">Total</p>
                <p class="text-xl font-bold text-emerald-900">{formatMoney(invoice.value.total)}</p>
              </Card>
              <Card class="p-4">
                <p class="text-xs font-medium text-slate-500">Part patient</p>
                <p class="text-xl font-bold">{formatMoney(invoice.value.patient_share)}</p>
              </Card>
              <Card class="p-4">
                <p class="text-xs font-medium text-slate-500">Part tiers</p>
                <p class="text-xl font-bold">{formatMoney(invoice.value.third_party_share)}</p>
              </Card>
              <Card class="border-amber-100 bg-amber-50/40 p-4">
                <p class="text-xs font-medium text-amber-800">Solde dû</p>
                <p class="text-xl font-bold text-amber-900">{formatMoney(invoice.value.balance_due)}</p>
              </Card>
            </div>

            <Card class="overflow-hidden p-0">
              <div class="border-b border-slate-100 bg-slate-50/80 px-6 py-3">
                <h3 class="font-semibold text-slate-800">Lignes</h3>
              </div>
              <table class="w-full">
                <thead>
                  <tr class="border-b text-left text-sm text-slate-500">
                    <th class="px-6 py-3">Libellé</th>
                    <th class="px-6 py-3">Qté</th>
                    <th class="px-6 py-3 text-right">P.U.</th>
                    <th class="px-6 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {(invoice.value.lines ?? []).map((l) => (
                    <tr key={l.id}>
                      <td class="px-6 py-3">{l.label}</td>
                      <td class="px-6 py-3">{l.quantity}</td>
                      <td class="px-6 py-3 text-right">{formatMoney(l.unit_price)}</td>
                      <td class="px-6 py-3 text-right font-medium">{formatMoney(l.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {(invoice.value.payments?.length ?? 0) > 0 && (
              <Card class="p-6">
                <h3 class="mb-3 font-semibold text-slate-800">Paiements</h3>
                <ul class="space-y-2">
                  {invoice.value.payments!.map((p) => (
                    <li key={p.id} class="flex justify-between text-sm">
                      <span>{p.paid_at?.slice(0, 16)} · {p.mode}{p.reference ? ` (${p.reference})` : ''}</span>
                      <span class="font-semibold text-emerald-700">{formatMoney(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {invoice.value.balance_due > 0 && ['ISSUED', 'PARTIALLY_PAID'].includes(invoice.value.status) && (
              <Card class="border-emerald-200 bg-emerald-50/20 p-6">
                <h3 class="mb-4 font-semibold text-emerald-900">Enregistrer un paiement</h3>
                <div class="grid gap-3 sm:grid-cols-4">
                  <Input type="number" v-model={payAmount.value} placeholder={`Max ${invoice.value.balance_due}`} />
                  <SearchableSelect modelValue={payMode.value} onUpdate:modelValue={(v: string) => { payMode.value = v; }} options={paymentModes} />
                  <Input v-model={payReference.value} placeholder="Référence (optionnel)" />
                  <Button loading={pay.isPending.value} disabled={!payAmount.value} class="bg-emerald-600" onClick={() => pay.mutate()}>
                    Encaisser
                  </Button>
                </div>
              </Card>
            )}
          </>
        ) : null}
      </div>
    );
  },
});
