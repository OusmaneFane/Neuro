import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import Tabs from '@/components/ui/Tabs';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed } from 'vue';

interface TariffItem {
  id: number;
  code: string;
  label: string;
  category: string;
  unit_price: number;
  is_active: boolean;
  cost_center?: { id: number; code: string; name: string };
  cost_center_id?: number;
}

interface CostCenter {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

interface Payer {
  id: number;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
}

const categoryLabels: Record<string, string> = {
  CONSULTATION: 'Consultation', HOSPITALIZATION: 'Hospitalisation', ACT: 'Acte',
  LAB: 'Laboratoire', IMAGING: 'Imagerie', DRUG: 'Médicament', OTHER: 'Autre',
};

const payerTypeLabels: Record<string, string> = {
  INSURANCE: 'Assurance', MUTUAL: 'Mutuelle', COMPANY: 'Entreprise', STATE: 'État', OTHER: 'Autre',
};

export default defineComponent({
  name: 'TariffsPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const tab = ref('tariffs');
    const tariffQuery = ref('');

    const tariffForm = ref({ code: '', label: '', category: 'CONSULTATION', unit_price: '', cost_center_id: '' });
    const costCenterForm = ref({ code: '', name: '' });
    const payerForm = ref({ code: '', name: '', type: 'INSURANCE' });

    const tabs = [
      { value: 'tariffs', label: 'Tarifs' },
      { value: 'cost-centers', label: 'Centres de coût' },
      { value: 'payers', label: 'Payeurs' },
    ];

    const { data: tariffs, isLoading: loadingTariffs } = useQuery({
      queryKey: ['tariff-items', tariffQuery],
      queryFn: async () => {
        const { data: res } = await api.get('/tariff-items', { params: { query: tariffQuery.value || undefined, limit: 100 } });
        return pageItems<TariffItem>(unwrap(res)).data;
      },
    });

    const { data: costCenters } = useQuery({
      queryKey: ['cost-centers'],
      queryFn: async () => {
        const { data } = await api.get('/cost-centers');
        return unwrap<CostCenter[]>(data);
      },
    });

    const { data: payers } = useQuery({
      queryKey: ['payers'],
      queryFn: async () => {
        const { data } = await api.get('/payers', { params: { limit: 100 } });
        return pageItems<Payer>(unwrap(data)).data;
      },
    });

    const costCenterOptions = computed(() =>
      (costCenters.value ?? []).map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` }))
    );

    const createTariff = useMutation({
      mutationFn: () => api.post('/tariff-items', {
        code: tariffForm.value.code,
        label: tariffForm.value.label,
        category: tariffForm.value.category,
        unit_price: Number(tariffForm.value.unit_price),
        cost_center_id: tariffForm.value.cost_center_id ? Number(tariffForm.value.cost_center_id) : undefined,
        is_active: true,
      }),
      onSuccess: () => {
        toast.add('Tarif créé', 'success');
        tariffForm.value = { code: '', label: '', category: 'CONSULTATION', unit_price: '', cost_center_id: '' };
        queryClient.invalidateQueries({ queryKey: ['tariff-items'] });
      },
      onError: () => toast.add('Erreur création tarif', 'error'),
    });

    const createCostCenter = useMutation({
      mutationFn: () => api.post('/cost-centers', costCenterForm.value),
      onSuccess: () => {
        toast.add('Centre de coût créé', 'success');
        costCenterForm.value = { code: '', name: '' };
        queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      },
      onError: () => toast.add('Erreur', 'error'),
    });

    const createPayer = useMutation({
      mutationFn: () => api.post('/payers', { ...payerForm.value, is_active: true }),
      onSuccess: () => {
        toast.add('Payeur créé', 'success');
        payerForm.value = { code: '', name: '', type: 'INSURANCE' };
        queryClient.invalidateQueries({ queryKey: ['payers'] });
      },
      onError: () => toast.add('Erreur', 'error'),
    });

    return () => (
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Référentiels financiers</h1>
          <p class="mt-1 text-slate-600">Tarifs, centres de coût et organismes payeurs</p>
        </div>

        <Tabs modelValue={tab.value} onUpdate:modelValue={(v: string) => { tab.value = v; }} tabs={tabs} />

        {tab.value === 'tariffs' && (
          <>
            <Card class="p-6">
              <h3 class="mb-4 font-semibold text-emerald-900">Nouveau tarif</h3>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <Input v-model={tariffForm.value.code} placeholder="Code" />
                <Input v-model={tariffForm.value.label} placeholder="Libellé" class="sm:col-span-2" />
                <select v-model={tariffForm.value.category} class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Input type="number" v-model={tariffForm.value.unit_price} placeholder="Prix F CFA" />
                <SearchableSelect
                  modelValue={tariffForm.value.cost_center_id}
                  onUpdate:modelValue={(v: string) => { tariffForm.value.cost_center_id = v; }}
                  options={[{ value: '', label: '— Centre —' }, ...costCenterOptions.value]}
                />
              </div>
              <Button class="mt-4 bg-emerald-600" loading={createTariff.isPending.value} onClick={() => createTariff.mutate()}>Ajouter</Button>
            </Card>

            <Input v-model={tariffQuery.value} placeholder="Rechercher un tarif..." class="max-w-md" />

            <Card class="overflow-hidden p-0">
              {loadingTariffs.value ? <div class="flex justify-center py-12"><Spinner /></div> : !tariffs.value?.length ? (
                <div class="p-12"><EmptyState title="Aucun tarif" /></div>
              ) : (
                <table class="w-full">
                  <thead>
                    <tr class="border-b bg-emerald-50/50 text-left text-sm text-slate-600">
                      <th class="px-4 py-3">Code</th>
                      <th class="px-4 py-3">Libellé</th>
                      <th class="px-4 py-3">Catégorie</th>
                      <th class="px-4 py-3">Centre</th>
                      <th class="px-4 py-3 text-right">Prix</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    {tariffs.value.map((t) => (
                      <tr key={t.id}>
                        <td class="px-4 py-3 font-mono text-sm">{t.code}</td>
                        <td class="px-4 py-3">{t.label}</td>
                        <td class="px-4 py-3 text-sm">{categoryLabels[t.category] ?? t.category}</td>
                        <td class="px-4 py-3 text-sm text-slate-500">{t.cost_center?.code ?? '—'}</td>
                        <td class="px-4 py-3 text-right font-semibold text-emerald-700">{formatMoney(t.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}

        {tab.value === 'cost-centers' && (
          <>
            <Card class="p-6">
              <h3 class="mb-4 font-semibold">Nouveau centre de coût</h3>
              <div class="flex flex-wrap gap-3">
                <Input v-model={costCenterForm.value.code} placeholder="Code" class="w-32" />
                <Input v-model={costCenterForm.value.name} placeholder="Nom" class="min-w-[200px] flex-1" />
                <Button class="bg-emerald-600" loading={createCostCenter.isPending.value} onClick={() => createCostCenter.mutate()}>Ajouter</Button>
              </div>
            </Card>
            <Card class="overflow-hidden p-0">
              <table class="w-full">
                <thead><tr class="border-b bg-slate-50 text-left text-sm"><th class="px-4 py-3">Code</th><th class="px-4 py-3">Nom</th></tr></thead>
                <tbody class="divide-y">
                  {(costCenters.value ?? []).map((c) => (
                    <tr key={c.id}><td class="px-4 py-3 font-mono">{c.code}</td><td class="px-4 py-3">{c.name}</td></tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {tab.value === 'payers' && (
          <>
            <Card class="p-6">
              <h3 class="mb-4 font-semibold">Nouveau payeur</h3>
              <div class="flex flex-wrap gap-3">
                <Input v-model={payerForm.value.code} placeholder="Code" class="w-32" />
                <Input v-model={payerForm.value.name} placeholder="Nom" class="min-w-[200px] flex-1" />
                <select v-model={payerForm.value.type} class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {Object.entries(payerTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Button class="bg-emerald-600" loading={createPayer.isPending.value} onClick={() => createPayer.mutate()}>Ajouter</Button>
              </div>
            </Card>
            <Card class="overflow-hidden p-0">
              <table class="w-full">
                <thead><tr class="border-b bg-slate-50 text-left text-sm"><th class="px-4 py-3">Code</th><th class="px-4 py-3">Nom</th><th class="px-4 py-3">Type</th></tr></thead>
                <tbody class="divide-y">
                  {(payers.value ?? []).map((p) => (
                    <tr key={p.id}>
                      <td class="px-4 py-3 font-mono">{p.code}</td>
                      <td class="px-4 py-3">{p.name}</td>
                      <td class="px-4 py-3 text-sm">{payerTypeLabels[p.type] ?? p.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    );
  },
});
