import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { api } from '@/lib/api';
import type { ShareToken } from '@/types';
import { defineComponent, ref } from 'vue';
import QrcodeVue from 'qrcode.vue';

export default defineComponent({
  name: 'PatientShare',
  setup() {
    const scope = ref<'SUMMARY' | 'FULL'>('SUMMARY');
    const expiresIn = ref<'1h' | '24h' | '7d'>('24h');
    const lastToken = ref<ShareToken | null>(null);
    const loading = ref(false);

    async function generate() {
      loading.value = true;
      try {
        const { data } = await api.post<ShareToken>('/patient/me/share-tokens', {
          scope: scope.value,
          expires_in: expiresIn.value,
        });
        lastToken.value = data;
      } finally {
        loading.value = false;
      }
    }

    return () => (
      <div class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-800">Partager mon dossier</h2>
        <Card>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium">Portée</label>
              <select
                v-model={scope.value}
                class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="SUMMARY">Résumé</option>
                <option value="FULL">Complet</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium">Expiration</label>
              <select
                v-model={expiresIn.value}
                class="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="1h">1 heure</option>
                <option value="24h">24 heures</option>
                <option value="7d">7 jours</option>
              </select>
            </div>
            <Button loading={loading.value} onClick={generate}>
              Générer le lien
            </Button>
          </div>
        </Card>
        {lastToken.value && (
          <Card>
            <h3 class="font-medium">Lien de partage</h3>
            <p class="mt-2 break-all font-mono text-sm text-slate-600">
              {lastToken.value.share_url}
            </p>
            <div class="mt-4 flex items-center gap-4">
              <QrcodeVue value={lastToken.value.share_url} size={120} />
              <div>
                <p class="text-sm text-slate-500">
                  Expire le {new Date(lastToken.value.expires_at).toLocaleString()}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(lastToken.value!.share_url)}
                  class="mt-2 text-sm text-teal-600 hover:text-teal-700"
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
