import Badge from '@/components/ui/badge';
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

interface Product {
  id: number;
  code: string;
  name: string;
  dci?: string;
  unit: string;
  sale_price: number;
  min_stock?: number;
  is_active: boolean;
  stock_total?: number;
  category?: { id: number; code: string; name: string };
}

interface Category {
  id: number;
  code: string;
  name: string;
}

const unitLabels: Record<string, string> = {
  BOX: 'Boîte', UNIT: 'Unité', ML: 'ml', G: 'g', TABLET: 'Comprimé', VIAL: 'Flacon', OTHER: 'Autre',
};

export default defineComponent({
  name: 'ProductsPage',
  setup() {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const tab = ref('products');
    const search = ref('');
    const productForm = ref({
      code: '', name: '', dci: '', unit: 'UNIT', sale_price: '', min_stock: '0', product_category_id: '',
    });
    const categoryForm = ref({ code: '', name: '' });

    const tabs = [
      { value: 'products', label: 'Produits' },
      { value: 'categories', label: 'Catégories' },
    ];

    const { data: products, isLoading } = useQuery({
      queryKey: ['products', search],
      queryFn: async () => {
        const { data: res } = await api.get('/products', { params: { query: search.value || undefined, limit: 50 } });
        return pageItems<Product>(res).data;
      },
    });

    const { data: categories } = useQuery({
      queryKey: ['product-categories'],
      queryFn: async () => {
        const { data } = await api.get('/product-categories');
        return unwrap<Category[]>(data);
      },
    });

    const categoryOptions = computed(() =>
      (categories.value ?? []).map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name}` }))
    );

    const createProduct = useMutation({
      mutationFn: () => api.post('/products', {
        ...productForm.value,
        sale_price: Number(productForm.value.sale_price),
        min_stock: Number(productForm.value.min_stock) || 0,
        product_category_id: productForm.value.product_category_id ? Number(productForm.value.product_category_id) : undefined,
        is_active: true,
      }),
      onSuccess: () => {
        toast.add('Produit créé', 'success');
        productForm.value = { code: '', name: '', dci: '', unit: 'UNIT', sale_price: '', min_stock: '0', product_category_id: '' };
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
      onError: () => toast.add('Erreur création produit', 'error'),
    });

    const createCategory = useMutation({
      mutationFn: () => api.post('/product-categories', { ...categoryForm.value, is_active: true }),
      onSuccess: () => {
        toast.add('Catégorie créée', 'success');
        categoryForm.value = { code: '', name: '' };
        queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      },
      onError: () => toast.add('Erreur', 'error'),
    });

    return () => (
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 sm:text-3xl">Produits & catégories</h1>
          <p class="mt-1 text-slate-600">Référentiel pharmacie et prix de vente</p>
        </div>

        <Tabs modelValue={tab.value} onUpdate:modelValue={(v: string) => { tab.value = v; }} tabs={tabs} />

        {tab.value === 'products' && (
          <>
            <Card class="border-cyan-100 p-6">
              <h3 class="mb-4 font-semibold text-cyan-900">Nouveau produit</h3>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input v-model={productForm.value.code} placeholder="Code" />
                <Input v-model={productForm.value.name} placeholder="Nom" class="sm:col-span-2" />
                <Input v-model={productForm.value.dci} placeholder="DCI" />
                <select v-model={productForm.value.unit} class="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {Object.entries(unitLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <Input type="number" v-model={productForm.value.sale_price} placeholder="Prix vente F CFA" />
                <Input type="number" v-model={productForm.value.min_stock} placeholder="Stock min" />
                <SearchableSelect
                  modelValue={productForm.value.product_category_id}
                  onUpdate:modelValue={(v: string) => { productForm.value.product_category_id = v; }}
                  options={[{ value: '', label: '— Catégorie —' }, ...categoryOptions.value]}
                />
              </div>
              <Button class="mt-4 bg-cyan-600 hover:bg-cyan-700" loading={createProduct.isPending.value} onClick={() => createProduct.mutate()}>
                Créer le produit
              </Button>
            </Card>

            <Input v-model={search.value} placeholder="Rechercher code, nom, DCI..." class="max-w-md" />

            <Card class="overflow-hidden p-0">
              {isLoading.value ? <div class="flex justify-center py-12"><Spinner /></div> : !products.value?.length ? (
                <div class="p-12"><EmptyState title="Aucun produit" /></div>
              ) : (
                <table class="w-full min-w-[640px]">
                  <thead>
                    <tr class="border-b bg-cyan-50/50 text-left text-sm text-slate-600">
                      <th class="px-4 py-3">Code</th>
                      <th class="px-4 py-3">Nom</th>
                      <th class="px-4 py-3">Catégorie</th>
                      <th class="px-4 py-3">Stock</th>
                      <th class="px-4 py-3 text-right">Prix</th>
                      <th class="px-4 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y">
                    {products.value.map((p) => (
                      <tr key={p.id} class="hover:bg-cyan-50/20">
                        <td class="px-4 py-3 font-mono text-sm text-cyan-800">{p.code}</td>
                        <td class="px-4 py-3">
                          <div class="font-medium">{p.name}</div>
                          {p.dci && <div class="text-xs text-slate-500">{p.dci}</div>}
                        </td>
                        <td class="px-4 py-3 text-sm">{p.category?.name ?? '—'}</td>
                        <td class="px-4 py-3 text-sm">{p.stock_total ?? 0} {unitLabels[p.unit] ?? p.unit}</td>
                        <td class="px-4 py-3 text-right font-semibold">{formatMoney(p.sale_price)}</td>
                        <td class="px-4 py-3">
                          <Badge variant={p.is_active ? 'success' : 'default'}>{p.is_active ? 'Actif' : 'Inactif'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </>
        )}

        {tab.value === 'categories' && (
          <>
            <Card class="p-6">
              <h3 class="mb-4 font-semibold">Nouvelle catégorie</h3>
              <div class="flex flex-wrap gap-3">
                <Input v-model={categoryForm.value.code} placeholder="Code" class="w-32" />
                <Input v-model={categoryForm.value.name} placeholder="Nom" class="min-w-[200px] flex-1" />
                <Button class="bg-cyan-600" loading={createCategory.isPending.value} onClick={() => createCategory.mutate()}>Ajouter</Button>
              </div>
            </Card>
            <Card class="overflow-hidden p-0">
              <table class="w-full">
                <thead><tr class="border-b bg-slate-50 text-left text-sm"><th class="px-4 py-3">Code</th><th class="px-4 py-3">Nom</th></tr></thead>
                <tbody class="divide-y">
                  {(categories.value ?? []).map((c) => (
                    <tr key={c.id}><td class="px-4 py-3 font-mono">{c.code}</td><td class="px-4 py-3">{c.name}</td></tr>
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
