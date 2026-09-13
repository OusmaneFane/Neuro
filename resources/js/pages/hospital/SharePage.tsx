import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import type { ShareToken } from '@/types';
import { useMutation } from '@tanstack/vue-query';
import { defineComponent, computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import QrcodeVue from 'qrcode.vue';

export default defineComponent({
  name: 'SharePage',
  setup() {
    const route = useRoute();
    const patientId = computed(() => route.params.id as string);
    const scope = ref<'SUMMARY' | 'FULL'>('SUMMARY');
    const expiresIn = ref<'1h' | '24h' | '7d'>('24h');
    const lastToken = ref<ShareToken | null>(null);

    const createToken = useMutation({
      mutationFn: async () => {
        const { data } = await api.post<ShareToken>(`/patients/${patientId.value}/share-tokens`, {
          scope: scope.value,
          expires_in: expiresIn.value,
        });
        return data;
      },
      onSuccess: (data) => {
        lastToken.value = data;
      },
    });

    return () => (
      <div class="space-y-8">
        <div>
          <h2 class="text-2xl font-bold tracking-tight text-slate-900">Partage</h2>
          <p class="mt-1 text-slate-600">Générez un lien de partage sécurisé du dossier patient</p>
        </div>
        <Card class="p-6">
          <div class="space-y-6">
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Portée</label>
              <select
                v-model={scope.value}
                class="w-full max-w-xs rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="SUMMARY">Résumé</option>
                <option value="FULL">Complet</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-700">Expiration</label>
              <select
                v-model={expiresIn.value}
                class="w-full max-w-xs rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="1h">1 heure</option>
                <option value="24h">24 heures</option>
                <option value="7d">7 jours</option>
              </select>
            </div>
            <Button
              loading={createToken.isPending.value}
              onClick={() => createToken.mutate()}
              class="rounded-xl shadow-lg shadow-teal-600/25"
            >
              Générer le lien
            </Button>
          </div>
        </Card>
        {lastToken.value && (
          <Card class="overflow-hidden p-6">
            <h3 class="text-lg font-semibold text-slate-800">Lien de partage</h3>
            <p class="mt-3 break-all font-mono text-sm text-slate-600">
              {lastToken.value.share_url}
            </p>
            <div class="mt-6 flex flex-col gap-6 rounded-xl border border-slate-200 bg-slate-50/50 p-6 sm:flex-row sm:items-center">
              <QrcodeVue value={lastToken.value.share_url} size={140} />
              <div class="flex-1">
                <p class="text-sm text-slate-500">
                  Expire le {new Date(lastToken.value.expires_at).toLocaleString('fr-FR')}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(lastToken.value!.share_url)}
                  class="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                >
                  Copier le lien
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  },
});
