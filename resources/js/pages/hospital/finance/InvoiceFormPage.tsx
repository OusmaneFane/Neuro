import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { pageItems, unwrap } from '@/lib/unwrap';
import { useToastStore } from '@/stores/toast';
import type { Patient } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

interface TariffItem {
  id: number;
  code: string;
  label: string;
  unit_price: number;
  cost_center_id?: number;
}

interface InvoiceLine {
  label: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tariff_item_id?: number;
  cost_center_id?: number;
}

export default defineComponent({
  name: 'InvoiceFormPage',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientSearch = ref('');
    const patientId = ref('');
    const notes = ref('');
    const lines = ref<InvoiceLine[]>([]);
    const selectedTariff = ref('');

    const { data: patients, isLoading: loadingPatients } = useQuery({
      queryKey: ['patients-invoice', patientSearch],
      queryFn: async () => {
        const { data: res } = await api.get('/patients', {
          params: { query: patientSearch.value || undefined, limit: 30, page: 1 },
        });
        return pageItems<Patient>(res).data;
      },
    });

    const { data: tariffItems } = useQuery({
      queryKey: ['tariff-items-active'],
      queryFn: async () => {
        const { data: res } = await api.get('/tariff-items', { params: { active_only: true, limit: 200 } });
        const page = pageItems<TariffItem>(unwrap(res));
        return page.data;
      },
    });

    const patientOptions = computed(() =>
      (patients.value ?? []).map((p) => ({
        value: String(p.id),
        label: `${p.last_name} ${p.first_name} (${p.iup})`,
      }))
    );

    const tariffOptions = computed(() =>
      (tariffItems.value ?? []).map((t) => ({
        value: String(t.id),
        label: `${t.code} — ${t.label} (${formatMoney(t.unit_price)})`,
      }))
    );

    function addTariffLine() {
      const item = tariffItems.value?.find((t) => String(t.id) === selectedTariff.value);
      if (!item) return;
      lines.value.push({
        label: item.label,
        quantity: 1,
        unit_price: item.unit_price,
        discount: 0,
        tariff_item_id: item.id,
        cost_center_id: item.cost_center_id,
      });
      selectedTariff.value = '';
    }

    function addBlankLine() {
      lines.value.push({ label: '', quantity: 1, unit_price: 0, discount: 0 });
    }

    function removeLine(i: number) {
      lines.value.splice(i, 1);
    }

    const total = computed(() =>
      lines.value.reduce((s, l) => s + Math.max(0, l.quantity * l.unit_price - l.discount), 0)
    );

    onMounted(() => {
      const qPatient = route.query.patient_id as string | undefined;
      if (qPatient) patientId.value = qPatient;
    });

    const createInvoice = useMutation({
      mutationFn: async () => {
        const { data } = await api.post('/invoices', {
          patient_id: Number(patientId.value),
          notes: notes.value || undefined,
          lines: lines.value.map((l) => ({
            label: l.label,
            quantity: l.quantity,
            unit_price: l.unit_price,
            discount: l.discount || undefined,
            tariff_item_id: l.tariff_item_id,
            cost_center_id: l.cost_center_id,
          })),
        });
        return unwrap<{ id: number }>(data);
      },
      onSuccess: (inv) => {
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        toast.add('Facture créée', 'success');
        router.push(`/hospital/finance/invoices/${inv.id}`);
      },
      onError: () => toast.add('Erreur lors de la création', 'error'),
    });

    return () => (
      <div class="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Nouvelle facture</h1>
          <p class="mt-1 text-slate-600">Sélectionnez un patient et ajoutez les lignes tarifaires</p>
        </div>

        <Card class="space-y-4 p-6">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Patient *</label>
            <div class="mb-2">
              <Input v-model={patientSearch.value} placeholder="Rechercher un patient..." />
            </div>
            {loadingPatients.value ? <Spinner /> : (
              <SearchableSelect
                modelValue={patientId.value}
                onUpdate:modelValue={(v: string) => { patientId.value = v; }}
                options={patientOptions.value}
                placeholder="Choisir un patient"
              />
            )}
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <Input v-model={notes.value} placeholder="Notes internes (optionnel)" />
          </div>
        </Card>

        <Card class="p-6">
          <div class="mb-4 flex flex-wrap items-end gap-3">
            <div class="min-w-[240px] flex-1">
              <label class="mb-1 block text-sm font-medium text-slate-700">Ajouter depuis le tarif</label>
              <SearchableSelect
                modelValue={selectedTariff.value}
                onUpdate:modelValue={(v: string) => { selectedTariff.value = v; }}
                options={tariffOptions.value}
                placeholder="Prestation tarifaire..."
              />
            </div>
            <Button variant="outline" onClick={addTariffLine} disabled={!selectedTariff.value}>Ajouter</Button>
            <Button variant="secondary" onClick={addBlankLine}>Ligne libre</Button>
          </div>

          {lines.value.length === 0 ? (
            <p class="py-8 text-center text-sm text-slate-500">Ajoutez au moins une ligne</p>
          ) : (
            <div class="space-y-3">
              {lines.value.map((line, i) => (
                <div key={i} class="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-12 sm:items-end">
                  <div class="sm:col-span-4">
                    <label class="text-xs text-slate-500">Libellé</label>
                    <Input v-model={line.label} />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="text-xs text-slate-500">Qté</label>
                    <Input type="number" v-model={line.quantity} min={0.01} step={0.01} />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="text-xs text-slate-500">P.U. (F CFA)</label>
                    <Input type="number" v-model={line.unit_price} min={0} />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="text-xs text-slate-500">Remise</label>
                    <Input type="number" v-model={line.discount} min={0} />
                  </div>
                  <div class="sm:col-span-2 flex items-end justify-between gap-2">
                    <span class="text-sm font-semibold text-emerald-700">
                      {formatMoney(line.quantity * line.unit_price - line.discount)}
                    </span>
                    <button type="button" onClick={() => removeLine(i)} class="text-sm text-red-600 hover:underline">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <span class="text-lg font-bold text-slate-800">Total : {formatMoney(total.value)}</span>
            <Button
              loading={createInvoice.isPending.value}
              disabled={!patientId.value || lines.value.length === 0}
              class="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => createInvoice.mutate()}
            >
              Enregistrer le brouillon
            </Button>
          </div>
        </Card>
      </div>
    );
  },
});
