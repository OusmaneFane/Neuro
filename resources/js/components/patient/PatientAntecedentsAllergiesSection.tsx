import {
  DOSSIER_CARD_HEADER,
  DOSSIER_NEUTRAL_CARD_OVERFLOW_VISIBLE,
} from '@/components/patient/dossierPageUi';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import SearchableSelect from '@/components/ui/SearchableSelect';
import {
  ANTECEDENT_AUTRE,
  ANTECEDENT_CATEGORY_LABELS,
  ANTECEDENT_KEYS,
  buildAllergySelectOptions,
  buildAntecedentSelectOptions,
  emptyAntecedentsState,
  normalizeAllergiesFromAntecedentsBlob,
  normalizeAntecedents,
  type AntecedentCategory,
} from '@/lib/patientAntecedentsAllergies';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, defineComponent, ref, watch, type PropType } from 'vue';

export default defineComponent({
  name: 'PatientAntecedentsAllergiesSection',
  props: {
    patientId: { type: String as PropType<string>, required: true },
  },
  setup(props) {
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const pid = computed(() => props.patientId);

    const antecedents = ref(emptyAntecedentsState());
    const antecedentSelectValue = ref<Record<AntecedentCategory, string>>({
      medicaux: '',
      chirurgicaux: '',
      gyneco: '',
      familiaux: '',
      traitements_anterieurs: '',
    });
    const antecedentAutreDraft = ref<Record<AntecedentCategory, string>>({
      medicaux: '',
      chirurgicaux: '',
      gyneco: '',
      familiaux: '',
      traitements_anterieurs: '',
    });
    const antecedentAutreOpen = ref<Record<AntecedentCategory, boolean>>({
      medicaux: false,
      chirurgicaux: false,
      gyneco: false,
      familiaux: false,
      traitements_anterieurs: false,
    });
    const allergies = ref<string[]>([]);
    const allergySelectValue = ref('');
    const allergyAutreOpen = ref(false);
    const allergyAutreDraft = ref('');

    const { data: compData } = useQuery({
      queryKey: ['complementary-data', pid],
      queryFn: async () => {
        const { data } = await api.get<{ antecedents?: Record<string, unknown> }>(
          `/patients/${pid.value}/complementary-data`
        );
        return data;
      },
      enabled: () => Boolean(pid.value),
    });

    watch(
      () => compData.value,
      (d) => {
        if (!d) return;
        antecedents.value = normalizeAntecedents(d.antecedents);
        allergies.value = normalizeAllergiesFromAntecedentsBlob(d.antecedents);
      },
      { immediate: true }
    );

    async function persistAntecedents() {
      try {
        await api.put(`/patients/${pid.value}/complementary-data`, {
          antecedents: {
            ...antecedents.value,
            allergies: allergies.value,
          },
        });
        await queryClient.invalidateQueries({ queryKey: ['complementary-data', pid] });
      } catch {
        toast.add('Erreur lors de l\'enregistrement des antécédents', 'error');
      }
    }

    function onAntecedentPick(cat: AntecedentCategory, v: string) {
      if (!v) return;
      if (v === ANTECEDENT_AUTRE) {
        antecedentAutreOpen.value = { ...antecedentAutreOpen.value, [cat]: true };
        antecedentSelectValue.value = { ...antecedentSelectValue.value, [cat]: '' };
        return;
      }
      if (!antecedents.value[cat].includes(v)) {
        antecedents.value = { ...antecedents.value, [cat]: [...antecedents.value[cat], v] };
        void persistAntecedents();
      }
      antecedentSelectValue.value = { ...antecedentSelectValue.value, [cat]: '' };
    }

    function confirmAntecedentAutre(cat: AntecedentCategory) {
      const t = antecedentAutreDraft.value[cat]?.trim();
      if (!t) return;
      if (!antecedents.value[cat].includes(t)) {
        antecedents.value = { ...antecedents.value, [cat]: [...antecedents.value[cat], t] };
        void persistAntecedents();
      }
      antecedentAutreDraft.value = { ...antecedentAutreDraft.value, [cat]: '' };
      antecedentAutreOpen.value = { ...antecedentAutreOpen.value, [cat]: false };
    }

    function removeAntecedentItem(cat: AntecedentCategory, index: number) {
      const list = antecedents.value[cat].filter((_, i) => i !== index);
      antecedents.value = { ...antecedents.value, [cat]: list };
      void persistAntecedents();
    }

    function onAllergyPick(v: string) {
      if (!v) return;
      if (v === ANTECEDENT_AUTRE) {
        allergyAutreOpen.value = true;
        allergySelectValue.value = '';
        return;
      }
      if (!allergies.value.includes(v)) {
        allergies.value = [...allergies.value, v];
        void persistAntecedents();
      }
      allergySelectValue.value = '';
    }

    function confirmAllergyAutre() {
      const t = allergyAutreDraft.value.trim();
      if (!t) return;
      if (!allergies.value.includes(t)) {
        allergies.value = [...allergies.value, t];
        void persistAntecedents();
      }
      allergyAutreDraft.value = '';
      allergyAutreOpen.value = false;
    }

    function removeAllergyItem(index: number) {
      allergies.value = allergies.value.filter((_, i) => i !== index);
      void persistAntecedents();
    }

    return () => (
      <div class="min-w-0 space-y-6 overflow-visible">
        <Card class={DOSSIER_NEUTRAL_CARD_OVERFLOW_VISIBLE}>
          <div class={DOSSIER_CARD_HEADER}>
            <h3 class="text-lg font-semibold text-slate-800">Antécédents</h3>
            <p class="mt-1 text-xs font-normal text-slate-500">
              Listes codifiées (neurologie et comorbidités fréquentes), enregistrées dans le dossier
              complémentaire. Recherche, ajout et retrait synchronisés automatiquement.
            </p>
          </div>
          <div class="p-4">
            {ANTECEDENT_KEYS.map((key) => (
              <div key={key} class="mb-5 last:mb-0">
                <p class="mb-2 text-sm font-medium text-slate-600">{ANTECEDENT_CATEGORY_LABELS[key]}</p>
                {antecedents.value[key].length ? (
                  <ul class="mb-2 space-y-1.5">
                    {antecedents.value[key].map((item, i) => (
                      <li
                        key={`${key}-${i}`}
                        class="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-sm text-slate-800"
                      >
                        <span class="min-w-0 flex-1 leading-snug">{item}</span>
                        <Button
                          size="sm"
                          type="button"
                          variant="ghost"
                          class="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeAntecedentItem(key, i)}
                        >
                          Retirer
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p class="mb-2 text-xs text-slate-400">Aucun élément renseigné.</p>
                )}
                <SearchableSelect
                  modelValue={antecedentSelectValue.value[key]}
                  onUpdate:modelValue={(v: string) => onAntecedentPick(key, v)}
                  options={buildAntecedentSelectOptions(key)}
                  placeholder={`Ajouter un antécédent ${ANTECEDENT_CATEGORY_LABELS[key].toLowerCase()}…`}
                  class="w-full"
                />
                {antecedentAutreOpen.value[key] ? (
                  <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <input
                      type="text"
                      value={antecedentAutreDraft.value[key]}
                      onInput={(e) => {
                        antecedentAutreDraft.value = {
                          ...antecedentAutreDraft.value,
                          [key]: (e.target as HTMLInputElement).value,
                        };
                      }}
                      placeholder="Préciser l’antécédent (saisie libre)…"
                      class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div class="flex gap-2">
                      <Button size="sm" type="button" onClick={() => confirmAntecedentAutre(key)}>
                        Ajouter
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          antecedentAutreOpen.value = { ...antecedentAutreOpen.value, [key]: false };
                          antecedentAutreDraft.value = { ...antecedentAutreDraft.value, [key]: '' };
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
        <Card class={DOSSIER_NEUTRAL_CARD_OVERFLOW_VISIBLE}>
          <div class={DOSSIER_CARD_HEADER}>
            <h3 class="text-lg font-semibold text-slate-800">Allergies</h3>
            <p class="mt-1 text-xs font-normal text-slate-500">
              Liste codifiée (médicaments, aliments, latex, produits de contraste…), enregistrée avec les
              antécédents dans le dossier complémentaire. Même logique de recherche et d’ajout.
            </p>
          </div>
          <div class="p-4">
            {allergies.value.length ? (
              <ul class="mb-3 space-y-1.5">
                {allergies.value.map((item, i) => (
                  <li
                    key={`allergy-${i}`}
                    class="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-1.5 text-sm text-slate-800"
                  >
                    <span class="min-w-0 flex-1 leading-snug">{item}</span>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      class="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeAllergyItem(i)}
                    >
                      Retirer
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p class="mb-3 text-xs text-slate-400">Aucune allergie renseignée.</p>
            )}
            <SearchableSelect
              modelValue={allergySelectValue.value}
              onUpdate:modelValue={(v: string) => onAllergyPick(v)}
              options={buildAllergySelectOptions()}
              placeholder="Rechercher ou ajouter une allergie codifiée…"
              class="w-full"
            />
            {allergyAutreOpen.value ? (
              <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                <input
                  type="text"
                  value={allergyAutreDraft.value}
                  onInput={(e) => {
                    allergyAutreDraft.value = (e.target as HTMLInputElement).value;
                  }}
                  placeholder="Préciser l’allergie ou l’intolérance (saisie libre)…"
                  class="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div class="flex gap-2">
                  <Button size="sm" type="button" onClick={() => confirmAllergyAutre()}>
                    Ajouter
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      allergyAutreOpen.value = false;
                      allergyAutreDraft.value = '';
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  },
});
