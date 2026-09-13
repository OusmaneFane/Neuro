import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

interface ClaimDetail {
  id: number;
  status: string;
  claimed_amount: number;
  accepted_amount?: number;
  settled_amount?: number;
  rejection_reason?: string;
  submitted_at?: string;
  payer?: { id: number; name: string; code: string };
  invoice?: { id: number; number: string; total: number; patient?: { first_name: string; last_name: string } };
  settlements?: { id: number; amount: number; reference?: string; settled_at: string }[];
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon', SUBMITTED: 'Soumise', ACCEPTED: 'Acceptée',
  PARTIALLY_PAID: 'Partiellement réglée', REJECTED: 'Rejetée', SETTLED: 'Réglée',
};

export default defineComponent({
  name: 'ClaimDetailPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const claimId = computed(() => route.params.id as string);
    const acceptedAmount = ref('');
    const rejectReason = ref('');
    const settleAmount = ref('');
    const settleRef = ref('');

    const { data: claim, isLoading } = useQuery({
      queryKey: ['claim', claimId],
      queryFn: async () => {
        const { data } = await api.get(`/third-party-claims/${claimId.value}`);
        return unwrap<ClaimDetail>(data);
      },
    });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    };

    const submit = useMutation({
      mutationFn: () => api.post(`/third-party-claims/${claimId.value}/submit`),
      onSuccess: () => { toast.add('Dossier soumis', 'success'); invalidate(); },
      onError: () => toast.add('Soumission impossible', 'error'),
    });

    const accept = useMutation({
      mutationFn: () => api.post(`/third-party-claims/${claimId.value}/accept`, { accepted_amount: Number(acceptedAmount.value) }),
      onSuccess: () => { toast.add('Montant accepté', 'success'); invalidate(); },
      onError: () => toast.add('Acceptation impossible', 'error'),
    });

    const reject = useMutation({
      mutationFn: () => api.post(`/third-party-claims/${claimId.value}/reject`, { rejection_reason: rejectReason.value }),
      onSuccess: () => { toast.add('Dossier rejeté', 'success'); invalidate(); },
      onError: () => toast.add('Rejet impossible', 'error'),
    });

    const settle = useMutation({
      mutationFn: () => api.post(`/third-party-claims/${claimId.value}/settle`, {
        amount: Number(settleAmount.value),
        reference: settleRef.value || undefined,
      }),
      onSuccess: () => { toast.add('Règlement enregistré', 'success'); settleAmount.value = ''; invalidate(); },
      onError: () => toast.add('Règlement impossible', 'error'),
    });

    return () => (
      <div class="space-y-6">
        {isLoading.value ? (
          <div class="flex justify-center py-24"><Spinner /></div>
        ) : claim.value ? (
          <>
            <div>
              <RouterLink to="/hospital/finance/claims" class="text-sm font-medium text-emerald-700 hover:underline">← Créances</RouterLink>
              <h1 class="mt-2 text-2xl font-bold text-slate-900">Dossier #{claim.value.id}</h1>
              <div class="mt-2 flex flex-wrap gap-2">
                <Badge variant="warning">{statusLabels[claim.value.status] ?? claim.value.status}</Badge>
                <span class="text-slate-600">{claim.value.payer?.name}</span>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-4">
              <Card class="p-4"><p class="text-xs text-slate-500">Réclamé</p><p class="text-xl font-bold">{formatMoney(claim.value.claimed_amount)}</p></Card>
              <Card class="p-4"><p class="text-xs text-slate-500">Accepté</p><p class="text-xl font-bold">{formatMoney(claim.value.accepted_amount ?? 0)}</p></Card>
              <Card class="p-4"><p class="text-xs text-slate-500">Réglé</p><p class="text-xl font-bold text-emerald-700">{formatMoney(claim.value.settled_amount ?? 0)}</p></Card>
              <Card class="p-4">
                <p class="text-xs text-slate-500">Facture</p>
                {claim.value.invoice && (
                  <RouterLink to={`/hospital/finance/invoices/${claim.value.invoice.id}`} class="text-lg font-bold text-emerald-700 hover:underline">
                    {claim.value.invoice.number}
                  </RouterLink>
                )}
              </Card>
            </div>

            <div class="flex flex-wrap gap-2">
              {claim.value.status === 'DRAFT' && (
                <Button class="bg-emerald-600" loading={submit.isPending.value} onClick={() => submit.mutate()}>Soumettre</Button>
              )}
            </div>

            {['SUBMITTED', 'DRAFT'].includes(claim.value.status) && (
              <Card class="p-6">
                <h3 class="mb-3 font-semibold">Accepter le dossier</h3>
                <div class="flex flex-wrap gap-3">
                  <Input type="number" v-model={acceptedAmount.value} placeholder="Montant accepté F CFA" class="w-48" />
                  <Button loading={accept.isPending.value} disabled={!acceptedAmount.value} onClick={() => accept.mutate()}>Accepter</Button>
                </div>
              </Card>
            )}

            {!['REJECTED', 'SETTLED'].includes(claim.value.status) && (
              <Card class="border-red-100 p-6">
                <h3 class="mb-3 font-semibold text-red-800">Rejeter</h3>
                <div class="flex flex-wrap gap-3">
                  <Input v-model={rejectReason.value} placeholder="Motif du rejet" class="min-w-[240px] flex-1" />
                  <Button variant="destructive" loading={reject.isPending.value} disabled={!rejectReason.value} onClick={() => reject.mutate()}>Rejeter</Button>
                </div>
              </Card>
            )}

            {['ACCEPTED', 'PARTIALLY_PAID'].includes(claim.value.status) && (
              <Card class="border-emerald-200 bg-emerald-50/20 p-6">
                <h3 class="mb-3 font-semibold text-emerald-900">Enregistrer un règlement</h3>
                <div class="flex flex-wrap gap-3">
                  <Input type="number" v-model={settleAmount.value} placeholder="Montant F CFA" class="w-40" />
                  <Input v-model={settleRef.value} placeholder="Référence" class="w-48" />
                  <Button class="bg-emerald-600" loading={settle.isPending.value} disabled={!settleAmount.value} onClick={() => settle.mutate()}>Régler</Button>
                </div>
              </Card>
            )}

            {(claim.value.settlements?.length ?? 0) > 0 && (
              <Card class="p-6">
                <h3 class="mb-3 font-semibold">Historique des règlements</h3>
                <ul class="space-y-2 text-sm">
                  {claim.value.settlements!.map((s) => (
                    <li key={s.id} class="flex justify-between">
                      <span>{s.settled_at?.slice(0, 10)}{s.reference ? ` · ${s.reference}` : ''}</span>
                      <span class="font-semibold">{formatMoney(s.amount)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        ) : null}
      </div>
    );
  },
});
