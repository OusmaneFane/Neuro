import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';

interface CashSession {
  id: number;
  status: string;
  opening_float: number;
  expected_cash?: number;
  closing_amount?: number;
  variance?: number;
  opened_at: string;
  closed_at?: string;
  opener?: { full_name: string };
  closer?: { full_name: string };
  payments?: { id: number; amount: number; mode: string; paid_at: string; invoice?: { id: number; number: string } }[];
}

const paymentModes = [
  { value: 'CASH', label: 'Espèces' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'CARD', label: 'Carte' },
];

export default defineComponent({
  name: 'CashRegisterPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const openingFloat = ref('0');
    const closingAmount = ref('');
    const payInvoiceId = ref('');
    const payAmount = ref('');
    const payMode = ref('CASH');

    const { data: session, isLoading } = useQuery({
      queryKey: ['cash-session-current'],
      queryFn: async () => {
        const { data } = await api.get('/cash-sessions/current');
        return unwrap<CashSession | null>(data);
      },
    });

    const openSession = useMutation({
      mutationFn: () => api.post('/cash-sessions/open', { opening_float: Number(openingFloat.value) || 0 }),
      onSuccess: () => { toast.add('Session ouverte', 'success'); queryClient.invalidateQueries({ queryKey: ['cash-session-current'] }); },
      onError: () => toast.add('Ouverture impossible', 'error'),
    });

    const closeSession = useMutation({
      mutationFn: () => api.post(`/cash-sessions/${session.value!.id}/close`, { closing_amount: Number(closingAmount.value) }),
      onSuccess: () => { toast.add('Session clôturée', 'success'); closingAmount.value = ''; queryClient.invalidateQueries({ queryKey: ['cash-session-current'] }); },
      onError: () => toast.add('Clôture impossible', 'error'),
    });

    const recordPayment = useMutation({
      mutationFn: () => api.post('/payments', {
        invoice_id: Number(payInvoiceId.value),
        amount: Number(payAmount.value),
        mode: payMode.value,
        cash_session_id: session.value?.id,
      }),
      onSuccess: () => {
        toast.add('Paiement enregistré', 'success');
        payInvoiceId.value = '';
        payAmount.value = '';
        queryClient.invalidateQueries({ queryKey: ['cash-session-current'] });
      },
      onError: () => toast.add('Paiement refusé', 'error'),
    });

    const sessionTotal = () =>
      (session.value?.payments ?? []).reduce((s, p) => s + p.amount, 0);

    return () => (
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Caisse</h1>
          <p class="mt-1 text-slate-600">Session de caisse et encaissements du jour</p>
        </div>

        {isLoading.value ? (
          <div class="flex justify-center py-16"><Spinner /></div>
        ) : !session.value ? (
          <Card class="border-emerald-200 bg-emerald-50/30 p-8">
            <h2 class="text-lg font-semibold text-emerald-900">Aucune session ouverte</h2>
            <p class="mt-1 text-sm text-emerald-800">Ouvrez une session pour enregistrer les encaissements espèces.</p>
            <div class="mt-4 flex flex-wrap items-end gap-3">
              <div class="w-48">
                <label class="mb-1 block text-sm text-slate-600">Fonds de caisse (F CFA)</label>
                <Input type="number" v-model={openingFloat.value} min={0} />
              </div>
              <Button class="bg-emerald-600" loading={openSession.isPending.value} onClick={() => openSession.mutate()}>
                Ouvrir la session
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div class="grid gap-4 sm:grid-cols-3">
              <Card class="border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white">
                <p class="text-sm opacity-90">Session ouverte</p>
                <p class="mt-1 text-lg font-bold">{session.value.opener?.full_name ?? '—'}</p>
                <p class="mt-1 text-xs opacity-80">Depuis {session.value.opened_at?.slice(0, 16)}</p>
                <Badge variant="success" class="mt-2 bg-white/20 text-white">Ouverte</Badge>
              </Card>
              <Card class="p-5">
                <p class="text-sm text-slate-500">Fonds initial</p>
                <p class="text-2xl font-bold text-slate-900">{formatMoney(session.value.opening_float)}</p>
              </Card>
              <Card class="p-5">
                <p class="text-sm text-slate-500">Encaissements session</p>
                <p class="text-2xl font-bold text-emerald-700">{formatMoney(sessionTotal())}</p>
              </Card>
            </div>

            <Card class="p-6">
              <h3 class="mb-4 font-semibold text-slate-800">Nouveau paiement</h3>
              <div class="grid gap-3 sm:grid-cols-4">
                <Input v-model={payInvoiceId.value} placeholder="ID facture" />
                <Input type="number" v-model={payAmount.value} placeholder="Montant F CFA" />
                <SearchableSelect modelValue={payMode.value} onUpdate:modelValue={(v: string) => { payMode.value = v; }} options={paymentModes} />
                <Button class="bg-emerald-600" loading={recordPayment.isPending.value} disabled={!payInvoiceId.value || !payAmount.value} onClick={() => recordPayment.mutate()}>
                  Encaisser
                </Button>
              </div>
            </Card>

            <Card class="overflow-hidden p-0">
              <div class="border-b border-slate-100 bg-slate-50/80 px-6 py-3">
                <h3 class="font-semibold">Paiements de la session</h3>
              </div>
              {!session.value.payments?.length ? (
                <div class="p-12"><EmptyState title="Aucun paiement" description="Les encaissements apparaîtront ici." /></div>
              ) : (
                <table class="w-full">
                  <thead>
                    <tr class="border-b text-left text-sm text-slate-500">
                      <th class="px-6 py-3">Heure</th>
                      <th class="px-6 py-3">Facture</th>
                      <th class="px-6 py-3">Mode</th>
                      <th class="px-6 py-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {session.value.payments.map((p) => (
                      <tr key={p.id}>
                        <td class="px-6 py-3 text-sm">{p.paid_at?.slice(0, 16)}</td>
                        <td class="px-6 py-3 text-sm">{p.invoice?.number ?? `#${p.invoice?.id}`}</td>
                        <td class="px-6 py-3 text-sm">{p.mode}</td>
                        <td class="px-6 py-3 text-right font-semibold text-emerald-700">{formatMoney(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card class="border-amber-200 bg-amber-50/30 p-6">
              <h3 class="font-semibold text-amber-900">Clôturer la session</h3>
              <div class="mt-3 flex flex-wrap items-end gap-3">
                <div class="w-48">
                  <label class="mb-1 block text-sm text-slate-600">Montant compté (F CFA)</label>
                  <Input type="number" v-model={closingAmount.value} min={0} />
                </div>
                <Button variant="destructive" loading={closeSession.isPending.value} disabled={!closingAmount.value} onClick={() => closeSession.mutate()}>
                  Clôturer
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    );
  },
});
