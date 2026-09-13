import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';
import { RouterLink } from 'vue-router';

interface Prescription {
  id: number;
  status: string;
  prescribed_at?: string;
  notes?: string;
  patient?: { id: number; iup: string; first_name: string; last_name: string };
  prescriber?: { full_name: string };
  items?: { id: number; quantity: number; dosage_instructions?: string; product?: { id: number; code: string; name: string } }[];
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon', ACTIVE: 'Active', PARTIALLY_DISPENSED: 'Part. dispensée',
  DISPENSED: 'Dispensée', CANCELLED: 'Annulée',
};

const statusOptions = [
  { value: '', label: 'Tous' },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
];

export default defineComponent({
  name: 'DispensationsPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const status = ref('ACTIVE');
    const dispenseId = ref<number | null>(null);
    const dispenseQty = ref<Record<number, string>>({});

    const { data: prescriptions, isLoading } = useQuery({
      queryKey: ['prescriptions', status],
      queryFn: async () => {
        const { data: res } = await api.get('/prescriptions', {
          params: { status: status.value || undefined, limit: 30 },
        });
        return pageItems<Prescription>(res).data;
      },
    });

    const dispense = useMutation({
      mutationFn: (rx: Prescription) => {
        const items = (rx.items ?? [])
          .filter((it) => dispenseQty.value[it.id] && Number(dispenseQty.value[it.id]) > 0)
          .map((it) => ({
            prescription_item_id: it.id,
            quantity: Number(dispenseQty.value[it.id]),
          }));
        return api.post(`/prescriptions/${rx.id}/dispense`, { items, bill_to_invoice: true });
      },
      onSuccess: () => {
        toast.add('Dispensation enregistrée', 'success');
        dispenseId.value = null;
        dispenseQty.value = {};
        queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      },
      onError: () => toast.add('Dispensation impossible', 'error'),
    });

    return () => (
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Dispensations</h1>
          <p class="mt-1 text-slate-600">Ordonnances à servir et historique</p>
        </div>

        <SearchableSelect
          modelValue={status.value}
          onUpdate:modelValue={(v: string) => { status.value = v; }}
          options={statusOptions}
          class="max-w-xs"
        />

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16"><Spinner /></div>
          ) : !prescriptions.value?.length ? (
            <div class="p-12"><EmptyState title="Aucune ordonnance" /></div>
          ) : (
            <div class="divide-y">
              {prescriptions.value.map((rx) => (
                <div key={rx.id} class="p-6">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span class="font-semibold text-cyan-800">Ordonnance #{rx.id}</span>
                      <Badge variant="default" class="ml-2">{statusLabels[rx.status] ?? rx.status}</Badge>
                      {rx.patient && (
                        <RouterLink to={`/hospital/patients/${rx.patient.id}/ordonnances`} class="ml-2 text-sm text-slate-600 hover:text-cyan-700">
                          {rx.patient.last_name} {rx.patient.first_name}
                        </RouterLink>
                      )}
                      <p class="mt-1 text-xs text-slate-500">
                        {rx.prescribed_at?.slice(0, 10) ?? '—'} · Dr {rx.prescriber?.full_name ?? '—'}
                      </p>
                    </div>
                    {['ACTIVE', 'PARTIALLY_DISPENSED'].includes(rx.status) && (
                      <Button size="sm" variant="outline" onClick={() => { dispenseId.value = dispenseId.value === rx.id ? null : rx.id; }}>
                        {dispenseId.value === rx.id ? 'Annuler' : 'Dispenser'}
                      </Button>
                    )}
                  </div>

                  <ul class="mt-3 space-y-1 text-sm">
                    {(rx.items ?? []).map((it) => (
                      <li key={it.id} class="flex flex-wrap items-center gap-2">
                        <span class="font-mono text-cyan-700">{it.product?.code}</span>
                        <span>{it.product?.name}</span>
                        <span class="text-slate-500">× {it.quantity}</span>
                        {it.dosage_instructions && <span class="text-slate-400">({it.dosage_instructions})</span>}
                      </li>
                    ))}
                  </ul>

                  {dispenseId.value === rx.id && (
                    <div class="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/30 p-4">
                      <h4 class="mb-3 text-sm font-semibold text-cyan-900">Quantités à dispenser</h4>
                      {(rx.items ?? []).map((it) => (
                        <div key={it.id} class="mb-2 flex items-center gap-3">
                          <span class="min-w-[200px] text-sm">{it.product?.name}</span>
                          <input
                            type="number"
                            class="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            placeholder={String(it.quantity)}
                            value={dispenseQty.value[it.id] ?? ''}
                            onInput={(e: Event) => { dispenseQty.value[it.id] = (e.target as HTMLInputElement).value; }}
                            step={0.01}
                          />
                        </div>
                      ))}
                      <Button size="sm" class="mt-2 bg-cyan-600" loading={dispense.isPending.value} onClick={() => dispense.mutate(rx)}>
                        Valider la dispensation
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
});
