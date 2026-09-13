import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/spinner';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import type { Document } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { defineComponent, computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const docTypeLabels: Record<string, string> = {
  LAB: 'Biologie',
  IMAGING: 'Imagerie',
  PRESCRIPTION: 'Ordonnance',
  DISCHARGE: 'Sortie',
  ADMIN: 'Administratif',
  OTHER: 'Autre',
};

export default defineComponent({
  name: 'DocumentsPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const patientId = computed(() => route.params.id as string);
    const queryClient = useQueryClient();
    const fileInput = ref<HTMLInputElement | null>(null);
    const fileInputCamera = ref<HTMLInputElement | null>(null);
    const uploading = ref(false);
    const loadingDocId = ref<number | null>(null);
    const selectedType = ref<keyof typeof docTypeLabels | ''>('');

    async function openDocument(doc: Document, disposition: 'inline' | 'attachment' = 'inline') {
      loadingDocId.value = doc.id;
      try {
        const { data } = await api.get<Blob>(`/patients/${patientId.value}/documents/${doc.id}`, {
          responseType: 'blob',
          params: { disposition },
        });
        const url = URL.createObjectURL(data);
        if (disposition === 'attachment') {
          const a = document.createElement('a');
          a.href = url;
          a.download = doc.filename;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          window.open(url, '_blank', 'noopener');
        }
      } catch {
        toast.add('Impossible d\'ouvrir le document', 'error');
      } finally {
        loadingDocId.value = null;
      }
    }

    const { data, isLoading } = useQuery({
      queryKey: ['patient-documents', patientId],
      queryFn: async () => {
        const { data: res } = await api.get<{ data: Document[] }>(`/patients/${patientId.value}/documents`);
        return res.data;
      },
    });

    async function upload(e: Event) {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const type = selectedType.value || 'OTHER';
      uploading.value = true;
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', type);
        await api.post(`/patients/${patientId.value}/documents`, fd);
        toast.add('Document téléversé', 'success');
        queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
        const msg = ax.response?.data?.errors
          ? Object.values(ax.response.data.errors).flat().join(' ')
          : ax.response?.data?.message ?? ax.message ?? 'Erreur lors du téléversement';
        toast.add(msg, 'error');
      } finally {
        uploading.value = false;
        target.value = '';
      }
    }

    function triggerUpload(source: 'file' | 'camera') {
      if (!selectedType.value) {
        toast.add('Veuillez sélectionner le type de document d\'abord', 'error');
        return;
      }
      if (source === 'file') fileInput.value?.click();
      else fileInputCamera.value?.click();
    }

    return () => (
      <div class="space-y-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-slate-900">Documents</h2>
            <p class="mt-1 text-slate-600">Téléversez et consultez les documents du patient</p>
          </div>
          <div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-end sm:gap-3">
            <div class="min-w-0 flex-1 sm:w-52">
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Type de document</label>
              <select
                v-model={selectedType.value}
                class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">— Choisir le type —</option>
                {Object.entries(docTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <p class="mt-1 text-xs text-slate-500">Sélectionnez le type avant d'ajouter un fichier</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.gif"
                class="hidden"
                onChange={upload}
              />
              <input
                ref={fileInputCamera}
                type="file"
                accept="image/*"
                capture="environment"
                class="hidden"
                onChange={upload}
              />
              <Button
                variant="outline"
                loading={uploading.value}
                disabled={!selectedType.value}
                onClick={() => triggerUpload('file')}
                class="rounded-xl"
              >
                Choisir un fichier
              </Button>
              <Button
                loading={uploading.value}
                disabled={!selectedType.value}
                onClick={() => triggerUpload('camera')}
                class="rounded-xl shadow-lg shadow-primary/25"
              >
                Prendre une photo
              </Button>
            </div>
          </div>
        </div>
        <Card class="overflow-hidden p-0">
          {isLoading.value ? (
            <div class="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !data.value?.length ? (
            <div class="p-12">
              <EmptyState
                title="Aucun document"
                description="Glissez-déposez ou cliquez pour téléverser."
              />
            </div>
          ) : (
            <div class="divide-y divide-slate-100">
              {data.value.map((doc) => (
                <div
                  key={doc.id}
                  class="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-slate-800 truncate">{doc.filename}</p>
                    <p class="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {docTypeLabels[doc.type] ?? doc.type}
                      </span>
                      <span>{doc.size.toLocaleString()} octets</span>
                    </p>
                    {doc.created_by && (
                      <p class="mt-1 text-xs text-slate-400">
                        Ajouté par {doc.created_by.full_name} le {doc.created_at ? new Date(doc.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </p>
                    )}
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    {doc.is_viewable && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingDocId.value === doc.id}
                        onClick={() => openDocument(doc)}
                      >
                        {loadingDocId.value === doc.id ? '…' : 'Voir'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={loadingDocId.value === doc.id}
                      onClick={() => openDocument(doc, 'attachment')}
                    >
                      {loadingDocId.value === doc.id ? '…' : 'Télécharger'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  },
});
