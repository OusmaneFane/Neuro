import Card from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/spinner';
import { api } from '@/lib/api';
import type { Document } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PatientDocuments',
  setup() {
    const { data, isLoading } = useQuery({
      queryKey: ['patient-documents'],
      queryFn: async () => {
        const { data: res } = await api.get<{ data: Document[] }>('/patient/me/documents');
        return res.data;
      },
    });

    return () => (
      <div class="space-y-6">
        <h2 class="text-2xl font-semibold text-slate-800">Mes documents</h2>
        {isLoading.value ? (
          <div class="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !data.value?.length ? (
          <EmptyState
            title="Aucun document"
            description="Vos documents médicaux apparaîtront ici."
          />
        ) : (
          <div class="space-y-2">
            {data.value.map((doc) => (
              <Card key={doc.id} class="flex items-center justify-between">
                <div>
                  <p class="font-medium">{doc.filename}</p>
                  <p class="text-sm text-slate-500">{doc.type}</p>
                </div>
                <div class="flex gap-2">
                  {doc.is_viewable && (
                    <button
                      type="button"
                      class="text-teal-600 hover:text-teal-700 disabled:opacity-50"
                      disabled={loadingDocId.value === doc.id}
                      onClick={() => openDocument(doc)}
                    >
                      {loadingDocId.value === doc.id ? '…' : 'Voir'}
                    </button>
                  )}
                  <button
                    type="button"
                    class="text-teal-600 hover:text-teal-700 disabled:opacity-50"
                    disabled={loadingDocId.value === doc.id}
                    onClick={() => openDocument(doc, 'attachment')}
                  >
                    {loadingDocId.value === doc.id ? '…' : 'Télécharger'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  },
});
