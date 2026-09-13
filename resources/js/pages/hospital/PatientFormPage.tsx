import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Input from '@/components/ui/input';
import { api } from '@/lib/api';
import { useToastStore } from '@/stores/toast';
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'PatientFormPage',
  setup() {
    const router = useRouter();
    const toast = useToastStore();
    const loading = ref(false);
    const form = ref({
      first_name: '',
      last_name: '',
      birth_date: '',
      sex: 'M',
      laterality: '' as '' | 'droitiere' | 'gauchere' | 'ambidextre',
      phone: '',
      address: '',
      education_level: '',
      profession: '',
      marital_status: '',
      treating_doctor: '',
      usual_treatment: '',
      emergency_contact_name: '',
      emergency_contact_first_name: '',
      emergency_contact_phone: '',
    });

    const ageDisplay = computed(() => {
      if (!form.value.birth_date) return null;
      const birth = new Date(form.value.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 0 ? `${age} ans` : null;
    });

    async function submit() {
      loading.value = true;
      try {
        const payload = {
          ...form.value,
          laterality: form.value.laterality || undefined,
          education_level: form.value.education_level || undefined,
          profession: form.value.profession || undefined,
          marital_status: form.value.marital_status || undefined,
          treating_doctor: form.value.treating_doctor || undefined,
          usual_treatment: form.value.usual_treatment || undefined,
          emergency_contact_name: form.value.emergency_contact_name || undefined,
          emergency_contact_first_name: form.value.emergency_contact_first_name || undefined,
          emergency_contact_phone: form.value.emergency_contact_phone || undefined,
        };
        const { data } = await api.post('/patients', payload);
        toast.add('Patient créé', 'success');
        router.push(`/hospital/patients/${data.id}`);
      } catch {
        toast.add('Erreur lors de la création', 'error');
      } finally {
        loading.value = false;
      }
    }

    return () => (
      <div class="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Nouveau patient
          </h1>
          <p class="mt-1 text-slate-600">Créer un nouveau dossier patient</p>
        </div>
        <Card class="p-6">
          <form onSubmit={(e: Event) => { e.preventDefault(); submit(); }} class="space-y-6">
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:col-span-2">
              L’identifiant patient (IUP) sera <span class="font-semibold text-slate-800">généré automatiquement</span> à la création.
            </div>
            <div class="grid gap-6 sm:grid-cols-2">
              <Input v-model={form.value.first_name} label="Prénom" required />
              <Input v-model={form.value.last_name} label="Nom" required />
              <Input v-model={form.value.birth_date} label="Date de naissance" type="date" required />
              {ageDisplay.value && (
                <div class="flex items-end pb-2 text-sm text-slate-600">
                  <span class="font-medium">Âge :</span>
                  <span class="ml-2 font-semibold text-slate-800">{ageDisplay.value}</span>
                </div>
              )}
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Sexe</label>
                <select
                  v-model={form.value.sex}
                  class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">Latéralité</label>
                <select
                  v-model={form.value.laterality}
                  class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Choisir —</option>
                  <option value="droitiere">Droitière</option>
                  <option value="gauchere">Gauchère</option>
                  <option value="ambidextre">Ambidextre</option>
                </select>
              </div>
              <Input v-model={form.value.phone} label="Téléphone" />
              <Input v-model={form.value.address} label="Adresse" class="sm:col-span-2" />
              <Input v-model={form.value.education_level} label="Niveau d'études" />
              <Input v-model={form.value.profession} label="Profession" />
              <div class="sm:col-span-2">
                <label class="mb-2 block text-sm font-medium text-slate-700">Situation maritale</label>
                <input
                  v-model={form.value.marital_status}
                  type="text"
                  placeholder="Ex. Célibataire, Marié(e), etc."
                  class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Input v-model={form.value.treating_doctor} label="Médecin traitant" class="sm:col-span-2" />
              <div class="sm:col-span-2">
                <label class="mb-2 block text-sm font-medium text-slate-700">Traitement habituel</label>
                <textarea
                  v-model={form.value.usual_treatment}
                  rows={3}
                  class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div class="border-t border-slate-200 pt-4 sm:col-span-2">
                <p class="mb-3 text-sm font-semibold text-slate-700">Personne à contacter</p>
                <div class="grid gap-4 sm:grid-cols-3">
                  <Input v-model={form.value.emergency_contact_name} label="Nom" />
                  <Input v-model={form.value.emergency_contact_first_name} label="Prénom" />
                  <Input v-model={form.value.emergency_contact_phone} label="Téléphone" />
                </div>
              </div>
            </div>
            <div class="flex gap-3 pt-4">
              <Button
                type="submit"
                loading={loading.value}
                class="rounded-xl shadow-lg shadow-primary/25"
              >
                Créer le patient
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                class="rounded-xl"
              >
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  },
});
