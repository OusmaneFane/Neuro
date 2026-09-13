import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';
import { useRoute } from 'vue-router';

interface Prescription {
  id: number;
  status: string;
  prescribed_at?: string;
  notes?: string;
  prescriber?: { full_name: string };
  items?: { id: number; quantity: number; dosage_instructions?: string; product?: { code: string; name: string } }[];
}

interface Product {
  id: number;
  code: string;
  name: string;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon', ACTIVE: 'Active', PARTIALLY_DISPENSED: 'Part. dispensée',
  DISPENSED: 'Dispensée', CANCELLED: 'Annulée',
};

export default defineComponent({
  name: 'PatientPrescriptionsPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientId = computed(() => route.params.id as string);
    const showForm = ref(false);
    const notes = ref('');
    const rxItems = ref([{ product_id: '', quantity: '1', dosage_instructions: '' }]);

    const { data: prescriptions, isLoading } = useQuery({
      queryKey: ['patient-prescriptions', patientId],
      queryFn: async () => {
        const { data } = await api.get(`/patients/${patientId.value}/prescriptions`);
        return unwrap<Prescription[]>(data);
      },
    });

    const { data: products } = useQuery({
      queryKey: ['products-rx'],
      queryFn: async () => {
        const { data: res } = await api.get('/products', { params: { active_only: true, limit: 200 } });
        return pageItems<Product>(res).data;
      },
    });

    const productOptions = computed(() =>
      (products.value ?? []).map((p) => ({ value: String(p.id), label: `${p.code} — ${p.name}` }))
    );

    const createRx = useMutation({
      mutationFn: () => api.post(`/patients/${patientId.value}/prescriptions`, {
        notes: notes.value || undefined,
        activate: true,
        items: rxItems.value
          .filter((i) => i.product_id)
          .map((i) => ({
            product_id: Number(i.product_id),
            quantity: Number(i.quantity),
            dosage_instructions: i.dosage_instructions || undefined,
          })),
      }),
      onSuccess: () => {
        toast.add('Ordonnance créée', 'success');
        showForm.value = false;
        notes.value = '';
        rxItems.value = [{ product_id: '', quantity: '1', dosage_instructions: '' }];
        queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', patientId] });
      },
      onError: () => toast.add('Erreur création ordonnance', 'error'),
    });

    return () => (
      <div class="space-y-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Ordonnances</h2>
            <p class="mt-1 text-sm text-slate-600">Prescriptions et dispensations du patient</p>
          </div>
          <Button class="bg-cyan-600" onClick={() => { showForm.value = !showForm.value; }}>
            {showForm.value ? 'Annuler' : 'Nouvelle ordonnance'}
          </Button>
        </div>

        {showForm.value && (
          <Card class="border-cyan-100 p-6">
            <h3 class="mb-4 font-semibold text-cyan-900">Prescrire</h3>
            <Input v-model={notes.value} placeholder="Notes (optionnel)" class="mb-4" />
            <div class="space-y-3">
              {rxItems.value.map((item, i) => (
                <div key={i} class="grid gap-2 sm:grid-cols-4">
                  <SearchableSelect
                    modelValue={item.product_id}
                    onUpdate:modelValue={(v: string) => { item.product_id = v; }}
                    options={productOptions.value}
                    placeholder="Médicament"
                  />
                  <Input type="number" v-model={item.quantity} placeholder="Quantité" min={0.01} step={0.01} />
                  <Input v-model={item.dosage_instructions} placeholder="Posologie" class="sm:col-span-2" />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => rxItems.value.push({ product_id: '', quantity: '1', dosage_instructions: '' })}>
                + Ligne
              </Button>
            </div>
            <Button class="mt-4 bg-cyan-600" loading={createRx.isPending.value} onClick={() => createRx.mutate()}>
              Enregistrer et activer
            </Button>
          </Card>
        )}

        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16"><Spinner /></div>
          ) : !prescriptions.value?.length ? (
            <div class="p-12"><EmptyState title="Aucune ordonnance" description="Créez une première prescription pour ce patient." /></div>
          ) : (
            <div class="divide-y">
              {prescriptions.value.map((rx) => (
                <div key={rx.id} class="p-6">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-semibold text-cyan-800">#{rx.id}</span>
                    <Badge variant={rx.status === 'DISPENSED' ? 'success' : 'default'}>{statusLabels[rx.status] ?? rx.status}</Badge>
                    <span class="text-sm text-slate-500">{rx.prescribed_at?.slice(0, 10) ?? '—'}</span>
                    {rx.prescriber && <span class="text-sm text-slate-500">· Dr {rx.prescriber.full_name}</span>}
                  </div>
                  {rx.notes && <p class="mt-2 text-sm text-slate-600">{rx.notes}</p>}
                  <ul class="mt-3 space-y-1 text-sm">
                    {(rx.items ?? []).map((it) => (
                      <li key={it.id}>
                        <span class="font-mono text-cyan-700">{it.product?.code}</span> {it.product?.name}
                        <span class="text-slate-500"> × {it.quantity}</span>
                        {it.dosage_instructions && <span class="text-slate-400"> — {it.dosage_instructions}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
});
