import PatientFormPageHero from '@/components/patient/PatientFormPageHero';
import { DOSSIER_PAGE_STACK } from '@/components/patient/dossierPageUi';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import Spinner from '@/components/ui/spinner';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { useToastStore } from '@/stores/toast';
import { api } from '@/lib/api';
import imagerieCatalogRaw from '@/data/coded-imagerie.json';
import explorationCatalogRaw from '@/data/coded-exploration-fonctionnelle.json';
import biologieCatalogRaw from '@/data/coded-biologie.json';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  PencilLine,
  Save,
  ScanSearch,
  Sparkles,
  StickyNote,
  Trash2,
  X,
} from 'lucide-vue-next';
import { defineComponent, computed, ref, watch, Teleport, type Component } from 'vue';
import { useRoute } from 'vue-router';

const AUTRE_VALUE = '__autre__';
/** Valeur du select avant choix (évite de présélectionner « Autre »). */
const UNSELECTED_VALUE = '__none__';
/** Placeholder du select résultat (aucune option métier). */
const RESULT_UNSELECTED = '__result_none__';

/**
 * Résultats prédéfinis communs (imagerie, exploration fonctionnelle, biologie).
 * Pas de saisie libre : l’utilisateur choisit une de ces valeurs.
 */
const EXAM_RESULT_PRESETS: readonly string[] = [
  'Normal / dans les limites de référence',
  'Sans anomalie notable',
  'Anormal / hors normes',
  'Anomalies ou lésions objectivées',
  'Limite / borderline',
  'Positif',
  'Négatif',
  'Taux élevé',
  'Taux bas ou diminué',
  'En attente de résultat',
  'Examen non réalisé',
  'Non interprétable ou non exploitable',
  'Inconclus / peu contributif',
];

const examResultPresetSet = new Set(EXAM_RESULT_PRESETS);

function buildExamResultSelectOptions(currentResult: string): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [
    { value: RESULT_UNSELECTED, label: '— Choisir un résultat —' },
    ...EXAM_RESULT_PRESETS.map((v) => ({ value: v, label: v })),
  ];
  const t = currentResult.trim();
  if (t && !examResultPresetSet.has(t)) {
    out.push({ value: t, label: `« ${t} » (valeur enregistrée)` });
  }
  return out;
}

interface SecondaryCoding {
  system: string;
  code: string;
  display: string;
}

interface CodingCatalogEntry {
  system: string;
  code: string;
  label_fr: string;
  label_en: string;
  legacyKeys?: string[];
  secondary_coding?: SecondaryCoding;
}

/** Entrées du catalogue biologie (fichier bilans : code interne, LOINC optionnel, groupe). */
interface BiologieCodingEntry extends CodingCatalogEntry {
  internal_code?: string;
  group?: string | null;
  statut?: string;
}

/** Une ligne d’examen codé (catalogue ou saisie libre). */
interface DynamicCodedRow {
  id: string;
  system: string;
  code: string;
  label: string;
  result: string;
  isCustom: boolean;
  /** Présent au chargement (ou après rechargement API) vs ajouté localement. */
  rowSource: 'persisted' | 'new';
  /** Ligne serveur modifiée depuis le dernier chargement (à ré-enregistrer). */
  dirty?: boolean;
  /** Précision libre optionnelle sur le résultat (cas exceptionnels). */
  resultNote?: string;
}

function readResultNoteFromSaved(r: Record<string, unknown>): string {
  const v = r.result_note ?? r.resultNote;
  return typeof v === 'string' ? v : '';
}

function touchPersistedRow<T extends DynamicCodedRow>(r: T, patch: Partial<DynamicCodedRow>): T {
  const next = { ...r, ...patch } as T;
  if (r.rowSource === 'persisted') next.dirty = true;
  return next;
}

const imagerieCatalog = imagerieCatalogRaw as CodingCatalogEntry[];
const explorationCatalog = explorationCatalogRaw as CodingCatalogEntry[];
const biologieCatalog = biologieCatalogRaw as BiologieCodingEntry[];

const TERMINOLOGY_SYSTEM_OPTIONS = [
  { value: '', label: 'Non codifié' },
  { value: 'http://snomed.info/sct', label: 'SNOMED CT' },
  { value: 'http://loinc.org', label: 'LOINC' },
  { value: 'urn:ekene:lab-bilan', label: 'Catalogue laboratoire (interne)' },
] as const;

function genRowId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function catalogValue(c: Pick<CodingCatalogEntry, 'system' | 'code'>): string {
  return `${c.system}|${c.code}`;
}

function parseCatalogValue(v: string): { system: string; code: string } | null {
  const i = v.indexOf('|');
  if (i <= 0 || i >= v.length - 1) return null;
  return { system: v.slice(0, i), code: v.slice(i + 1) };
}

function catalogOptionLabel(c: CodingCatalogEntry): string {
  let s = `${c.code} — ${c.label_fr}`;
  if (c.secondary_coding) {
    s += ` · LOINC ${c.secondary_coding.code}`;
  }
  return s;
}

function buildCatalogSelectOptions(catalog: CodingCatalogEntry[]): SearchableSelectOption[] {
  return [
    { value: UNSELECTED_VALUE, label: '— Choisir un examen —' },
    ...catalog.map((c) => ({
      value: catalogValue(c),
      label: catalogOptionLabel(c),
    })),
    { value: AUTRE_VALUE, label: '— Autre (saisie libre) —' },
  ];
}

function biologieCatalogOptionLabel(c: BiologieCodingEntry): string {
  const loinc = c.secondary_coding?.code;
  const ic = c.internal_code ? String(c.internal_code) : '';
  let s = loinc ? `${loinc} — ${c.label_fr}` : `${ic || c.code} — ${c.label_fr}`;
  if (loinc && ic) s += ` · ${ic}`;
  if (c.group) s += ` · ${c.group}`;
  if (c.statut) s += ` · ${c.statut}`;
  return s;
}

function buildBiologieSelectOptions(catalog: BiologieCodingEntry[]): SearchableSelectOption[] {
  return [
    { value: UNSELECTED_VALUE, label: '— Choisir un examen —' },
    ...catalog.map((c) => ({
      value: catalogValue(c),
      label: biologieCatalogOptionLabel(c),
    })),
    { value: AUTRE_VALUE, label: '— Autre (saisie libre) —' },
  ];
}

const imagerieSelectOptions = buildCatalogSelectOptions(imagerieCatalog);
const explorationSelectOptions = buildCatalogSelectOptions(explorationCatalog);
const biologieSelectOptions = buildBiologieSelectOptions(biologieCatalog);

/** Ancien format API biologie : seulement { label, result }. */
function normalizeBiologieSaved(saved: unknown): unknown {
  if (!Array.isArray(saved)) return saved ?? [];
  return saved.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const r = raw as Record<string, unknown>;
    const hasSys = typeof r.system === 'string' && r.system.length > 0;
    const hasCode = typeof r.code === 'string' && r.code.length > 0;
    if (hasSys && hasCode) return raw;
    if (r.custom === true) return raw;
    return {
      custom: true,
      label: String(r.label ?? ''),
      result: String(r.result ?? ''),
      result_note: readResultNoteFromSaved(r),
    };
  });
}

function rowSelectValue(row: DynamicCodedRow, catalog: CodingCatalogEntry[]): string {
  if (row.isCustom) return AUTRE_VALUE;
  if (row.system && row.code && catalog.some((c) => c.system === row.system && c.code === row.code)) {
    return catalogValue(row);
  }
  return UNSELECTED_VALUE;
}

function savedToDynamicRows(saved: unknown, catalog: CodingCatalogEntry[]): DynamicCodedRow[] {
  const out: DynamicCodedRow[] = [];
  const catalogKeys = new Set(catalog.map(catalogValue));

  if (Array.isArray(saved)) {
    for (const raw of saved) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      const sys = String(r.system ?? '');
      const cod = String(r.code ?? '');
      const custom = r.custom === true;
      const result = String(r.result ?? '');
      const label = String(r.label ?? '');
      const resultNote = readResultNoteFromSaved(r);
      const inCatalog = catalogKeys.has(`${sys}|${cod}`) && !custom;
      const entry = catalog.find((c) => c.system === sys && c.code === cod);
      out.push({
        id: genRowId(),
        system: sys,
        code: cod,
        label: inCatalog && entry ? entry.label_fr : label,
        result,
        isCustom: custom || !inCatalog,
        rowSource: 'persisted',
        dirty: false,
        resultNote,
      });
    }
    return out;
  }

  if (saved && typeof saved === 'object') {
    const leg = saved as Record<string, unknown>;
    const reserved = new Set<string>();
    catalog.forEach((c) => c.legacyKeys?.forEach((lk) => reserved.add(lk)));

    for (const c of catalog) {
      if (!c.legacyKeys?.length) continue;
      for (const lk of c.legacyKeys) {
        const v = leg[lk];
        if (v !== undefined && v !== null && String(v) !== '') {
          out.push({
            id: genRowId(),
            system: c.system,
            code: c.code,
            label: c.label_fr,
            result: String(v),
            isCustom: false,
            rowSource: 'persisted',
            dirty: false,
            resultNote: '',
          });
          break;
        }
      }
    }
    for (const [key, val] of Object.entries(leg)) {
      if (reserved.has(key)) continue;
      if (val === undefined || val === null || String(val) === '') continue;
      out.push({
        id: genRowId(),
        system: '',
        code: '',
        label: key,
        result: String(val),
        isCustom: true,
        rowSource: 'persisted',
        dirty: false,
        resultNote: '',
      });
    }
  }

  return out;
}

function serializeDynamicRows(rows: DynamicCodedRow[], catalog: CodingCatalogEntry[]) {
  return rows
    .filter((r) => {
      const noPick = !r.isCustom && !r.system && !r.code;
      if (noPick && !r.result.trim() && !r.label.trim()) return false;
      return (
        r.result.trim() !== '' ||
        r.label.trim() !== '' ||
        (!r.isCustom && r.system && r.code) ||
        (r.isCustom && (r.label.trim() !== '' || (r.system.trim() !== '' && r.code.trim() !== '')))
      );
    })
    .map((row) => {
      const inCatalog =
        !row.isCustom && catalog.some((c) => c.system === row.system && c.code === row.code);
      if (inCatalog) {
        const entry = catalog.find((c) => c.system === row.system && c.code === row.code)!;
        const o: Record<string, unknown> = {
          system: row.system,
          code: row.code,
          label: row.label.trim() || entry.label_fr,
          result: row.result,
        };
        if (entry.secondary_coding) o.secondary_coding = entry.secondary_coding;
        if (row.resultNote?.trim()) o.result_note = row.resultNote.trim();
        return o;
      }
      const o: Record<string, unknown> = {
        custom: true,
        label: row.label,
        result: row.result,
      };
      if (row.system.trim()) o.system = row.system.trim();
      if (row.code.trim()) o.code = row.code.trim();
      if (row.resultNote?.trim()) o.result_note = row.resultNote.trim();
      return o;
    });
}

type RowStatusUi = 'saved' | 'edited' | 'fresh';

function rowStatusUi(row: DynamicCodedRow): RowStatusUi {
  if (row.rowSource === 'new') return 'fresh';
  if (row.rowSource === 'persisted' && row.dirty) return 'edited';
  return 'saved';
}

const ROW_STATUS_CONFIG: Record<
  RowStatusUi,
  { wrap: string; badge: string; label: string; Icon: Component }
> = {
  saved: {
    wrap: 'border-slate-200/90 border-l-4 border-l-emerald-500 bg-linear-to-br from-emerald-50/60 via-white to-slate-50/50 shadow-emerald-100/40',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200/80',
    label: 'Enregistré',
    Icon: CheckCircle2,
  },
  edited: {
    wrap: 'border-slate-200/90 border-l-4 border-l-amber-500 bg-linear-to-br from-amber-50/55 via-white to-slate-50/50 shadow-amber-100/40',
    badge: 'bg-amber-100 text-amber-900 ring-amber-200/80',
    label: 'Modifié · à enregistrer',
    Icon: PencilLine,
  },
  fresh: {
    wrap: 'border-slate-200/90 border-l-4 border-l-violet-500 bg-linear-to-br from-violet-50/50 via-white to-slate-50/50 shadow-violet-100/40',
    badge: 'bg-violet-100 text-violet-900 ring-violet-200/80',
    label: 'Nouvelle ligne',
    Icon: Sparkles,
  },
};

/** Bloc une ligne : select catalogue + résultat, style aligné biologie avec enveloppe légère. */
function CodedExamLineBlock({
  row,
  options,
  catalog,
  onSelectCatalog,
  onResult,
  onCustomPatch,
  onRemove,
  selectListMaxClass,
}: {
  row: DynamicCodedRow;
  options: SearchableSelectOption[];
  catalog: CodingCatalogEntry[];
  onSelectCatalog: (v: string) => void;
  onResult: (v: string) => void;
  onCustomPatch: (patch: Partial<DynamicCodedRow>) => void;
  onRemove: () => void;
  selectListMaxClass?: string;
}) {
  const sel = rowSelectValue(row, catalog);
  const isAutre = sel === AUTRE_VALUE;
  const st = rowStatusUi(row);
  const cfg = ROW_STATUS_CONFIG[st];
  const StatusIcon = cfg.Icon;

  return (
    <div
      class={`group relative z-0 overflow-visible rounded-xl border p-4 shadow-md transition hover:shadow-lg ${cfg.wrap}`}
    >
      <div
        class={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${cfg.badge}`}
      >
        <StatusIcon class="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        {cfg.label}
      </div>
      <button
        type="button"
        class="absolute right-2 top-2 rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
        onClick={onRemove}
        title="Retirer cette ligne"
      >
        <Trash2 class="h-4 w-4" strokeWidth={2} />
      </button>
      <div class="flex flex-col gap-3 pr-12 sm:pr-10">
        <div class="min-w-0 flex-1">
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Examen codé
          </label>
          <SearchableSelect
            modelValue={sel}
            onUpdate:modelValue={(v: string) => onSelectCatalog(v)}
            options={options}
            placeholder="Rechercher par code ou libellé..."
            listMaxHeightClass={selectListMaxClass ?? 'max-h-80'}
          />
        </div>
        {isAutre ? (
          <div class="grid grid-cols-1 gap-2 rounded-lg border border-dashed border-slate-200 bg-white/90 p-3 sm:grid-cols-2">
            <input
              type="text"
              value={row.label}
              onInput={(e) => onCustomPatch({ label: (e.target as HTMLInputElement).value })}
              placeholder="Libellé de l'examen"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:col-span-2"
            />
            <select
              value={row.system}
              onChange={(e) => onCustomPatch({ system: (e.target as HTMLSelectElement).value })}
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {TERMINOLOGY_SYSTEM_OPTIONS.map((o) => (
                <option key={o.value || 'x'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={row.code}
              onInput={(e) => onCustomPatch({ code: (e.target as HTMLInputElement).value })}
              placeholder="Code terminologique"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ) : null}
        <div>
          <label class="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Résultat
          </label>
          <select
            value={row.result.trim() === '' ? RESULT_UNSELECTED : row.result}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              onResult(v === RESULT_UNSELECTED ? '' : v);
            }}
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {buildExamResultSelectOptions(row.result).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <details class="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/35 transition-colors open:border-slate-300/90 open:bg-slate-50/60">
          <summary class="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-500 outline-none select-none [&::-webkit-details-marker]:hidden">
            <StickyNote class="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2.25} />
            <span class="text-slate-600">Note optionnelle</span>
            <span class="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
              exceptionnel
            </span>
            {row.resultNote?.trim() ? (
              <span class="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Renseignée
              </span>
            ) : (
              <span class="ml-auto text-[10px] font-normal text-slate-400">Déplier si besoin</span>
            )}
          </summary>
          <div class="space-y-1.5 border-t border-slate-200/70 px-3 pb-3 pt-2">
            <p class="text-[11px] leading-snug text-slate-500">
              À utiliser seulement pour une précision rare ; le résultat codé suffit dans la majorité des cas.
            </p>
            <textarea
              value={row.resultNote ?? ''}
              maxlength={2000}
              rows={3}
              placeholder="Ex. valeur numérique, contexte, référence au compte rendu papier…"
              onInput={(e) =>
                onCustomPatch({ resultNote: (e.target as HTMLTextAreaElement).value })
              }
              class="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </details>
      </div>
    </div>
  );
}

type ExamSection = 'imagerie' | 'exploration' | 'biologie';

interface ComplementaryData {
  imagerie?: Record<string, string> | Array<Record<string, unknown>>;
  exploration?: Record<string, string> | Array<Record<string, unknown>>;
  biologie?: Array<Record<string, unknown>>;
  traitement_entree?: string;
  traitement_sortie?: string;
  evolution?: string;
  evolution_justification?: string;
  mode_sortie?: string;
}

export default defineComponent({
  name: 'ExamensComplementairesPage',
  setup() {
    const route = useRoute();
    const toast = useToastStore();
    const queryClient = useQueryClient();
    const patientId = computed(() => route.params.id as string);

    const imagerieRows = ref<DynamicCodedRow[]>([]);
    const explorationRows = ref<DynamicCodedRow[]>([]);
    const biologieRows = ref<DynamicCodedRow[]>([]);
    const saving = ref(false);
    const deleteConfirm = ref<{ section: ExamSection; id: string; examLabel: string } | null>(null);

    const { data, isLoading } = useQuery({
      queryKey: ['complementary-data', patientId],
      queryFn: async () => {
        const { data: res } = await api.get<ComplementaryData>(`/patients/${patientId.value}/complementary-data`);
        return res;
      },
    });

    watch(data, (val) => {
      if (!val) return;
      imagerieRows.value = savedToDynamicRows(val.imagerie ?? {}, imagerieCatalog);
      explorationRows.value = savedToDynamicRows(val.exploration ?? {}, explorationCatalog);
      biologieRows.value = savedToDynamicRows(
        normalizeBiologieSaved(val.biologie ?? []),
        biologieCatalog
      );
    }, { immediate: true });

    function addImagerieRow() {
      imagerieRows.value = [
        ...imagerieRows.value,
        {
          id: genRowId(),
          system: '',
          code: '',
          label: '',
          result: '',
          resultNote: '',
          isCustom: false,
          rowSource: 'new',
        },
      ];
    }

    function addExplorationRow() {
      explorationRows.value = [
        ...explorationRows.value,
        {
          id: genRowId(),
          system: '',
          code: '',
          label: '',
          result: '',
          resultNote: '',
          isCustom: false,
          rowSource: 'new',
        },
      ];
    }

    function addBiologieRow() {
      biologieRows.value = [
        ...biologieRows.value,
        {
          id: genRowId(),
          system: '',
          code: '',
          label: '',
          result: '',
          resultNote: '',
          isCustom: false,
          rowSource: 'new',
        },
      ];
    }

    function requestDelete(section: ExamSection, id: string) {
      const rows =
        section === 'imagerie'
          ? imagerieRows.value
          : section === 'exploration'
            ? explorationRows.value
            : biologieRows.value;
      const row = rows.find((x) => x.id === id);
      const examLabel =
        row?.label?.trim() ||
        (row?.isCustom ? 'Examen personnalisé' : '') ||
        (row?.code ? `Code ${row.code}` : '') ||
        'cette ligne d’examen';
      deleteConfirm.value = { section, id, examLabel };
    }

    function cancelDeleteConfirm() {
      deleteConfirm.value = null;
    }

    function confirmDeleteRow() {
      const p = deleteConfirm.value;
      if (!p) return;
      if (p.section === 'imagerie') removeImagerieRow(p.id);
      else if (p.section === 'exploration') removeExplorationRow(p.id);
      else removeBiologieRow(p.id);
      deleteConfirm.value = null;
    }

    function handleBiologieCatalogSelect(rowId: string, v: string) {
      biologieRows.value = biologieRows.value.map((r) => {
        if (r.id !== rowId) return r;
        if (v === UNSELECTED_VALUE) {
          return touchPersistedRow(r, { isCustom: false, system: '', code: '', label: '', result: r.result });
        }
        if (v === AUTRE_VALUE) {
          return touchPersistedRow(r, { isCustom: true, system: '', code: '', label: r.label });
        }
        const parsed = parseCatalogValue(v);
        if (!parsed) return touchPersistedRow(r, { isCustom: true });
        const entry = biologieCatalog.find((c) => c.system === parsed.system && c.code === parsed.code);
        return touchPersistedRow(r, {
          isCustom: false,
          system: parsed.system,
          code: parsed.code,
          label: entry?.label_fr ?? r.label,
        });
      });
    }

    function removeBiologieRow(id: string) {
      biologieRows.value = biologieRows.value.filter((r) => r.id !== id);
    }

    function handleImagerieCatalogSelect(rowId: string, v: string) {
      imagerieRows.value = imagerieRows.value.map((r) => {
        if (r.id !== rowId) return r;
        if (v === UNSELECTED_VALUE) {
          return touchPersistedRow(r, { isCustom: false, system: '', code: '', label: '', result: r.result });
        }
        if (v === AUTRE_VALUE) {
          return touchPersistedRow(r, { isCustom: true, system: '', code: '', label: r.label });
        }
        const parsed = parseCatalogValue(v);
        if (!parsed) return touchPersistedRow(r, { isCustom: true });
        const entry = imagerieCatalog.find((c) => c.system === parsed.system && c.code === parsed.code);
        return touchPersistedRow(r, {
          isCustom: false,
          system: parsed.system,
          code: parsed.code,
          label: entry?.label_fr ?? r.label,
        });
      });
    }

    function handleExplorationCatalogSelect(rowId: string, v: string) {
      explorationRows.value = explorationRows.value.map((r) => {
        if (r.id !== rowId) return r;
        if (v === UNSELECTED_VALUE) {
          return touchPersistedRow(r, { isCustom: false, system: '', code: '', label: '', result: r.result });
        }
        if (v === AUTRE_VALUE) {
          return touchPersistedRow(r, { isCustom: true, system: '', code: '', label: r.label });
        }
        const parsed = parseCatalogValue(v);
        if (!parsed) return touchPersistedRow(r, { isCustom: true });
        const entry = explorationCatalog.find((c) => c.system === parsed.system && c.code === parsed.code);
        return touchPersistedRow(r, {
          isCustom: false,
          system: parsed.system,
          code: parsed.code,
          label: entry?.label_fr ?? r.label,
        });
      });
    }

    function removeImagerieRow(id: string) {
      imagerieRows.value = imagerieRows.value.filter((r) => r.id !== id);
    }

    function removeExplorationRow(id: string) {
      explorationRows.value = explorationRows.value.filter((r) => r.id !== id);
    }

    async function save() {
      saving.value = true;
      try {
        await api.put(`/patients/${patientId.value}/complementary-data`, {
          imagerie: serializeDynamicRows(imagerieRows.value, imagerieCatalog),
          exploration: serializeDynamicRows(explorationRows.value, explorationCatalog),
          biologie: serializeDynamicRows(biologieRows.value, biologieCatalog),
        });
        toast.add('Examens complémentaires enregistrés', 'success');
        queryClient.invalidateQueries({ queryKey: ['complementary-data', patientId] });
      } catch {
        toast.add('Erreur lors de l\'enregistrement', 'error');
      } finally {
        saving.value = false;
      }
    }

    const addBtnSky =
      'inline-flex items-center gap-1.5 rounded-xl border border-sky-400/45 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-900 shadow-sm transition hover:bg-sky-500/25 hover:shadow-md';
    const addBtnEmerald =
      'inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-500/25 hover:shadow-md';
    const addBtnRose =
      'inline-flex items-center gap-1.5 rounded-xl border border-rose-400/45 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-950 shadow-sm transition hover:bg-rose-500/25 hover:shadow-md';

    return () => (
      <div class={DOSSIER_PAGE_STACK}>
        <PatientFormPageHero
          title="Examens complémentaires"
          description="Imagerie, explorations et biologie : catalogues codés, résultats standardisés. Les couleurs des cartes indiquent si la ligne vient du dossier ou est nouvelle / modifiée."
        >
          {{
            icon: () => <ClipboardList class="h-7 w-7" strokeWidth={2.25} />,
            actions: () => (
              <Button
                onClick={save}
                loading={saving.value}
                class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 text-base shadow-lg shadow-primary/30"
              >
                <Save class="h-5 w-5" strokeWidth={2.25} />
                Enregistrer
              </Button>
            ),
          }}
        </PatientFormPageHero>

        {isLoading.value ? (
          <div class="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            <div class="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm sm:p-5">
              <p class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Sparkles class="h-4 w-4 text-violet-500" strokeWidth={2.25} />
                Légende des lignes
              </p>
              <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
                <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <CheckCircle2 class="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <span>
                    <span class="text-emerald-800">Enregistré</span>
                    <span class="block text-xs font-normal text-slate-500">Déjà sauvegardé au dossier</span>
                  </span>
                </span>
                <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                    <PencilLine class="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <span>
                    <span class="text-amber-900">Modifié</span>
                    <span class="block text-xs font-normal text-slate-500">À ré-enregistrer</span>
                  </span>
                </span>
                <span class="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
                    <Sparkles class="h-4 w-4" strokeWidth={2.5} />
                  </span>
                  <span>
                    <span class="text-violet-900">Nouvelle ligne</span>
                    <span class="block text-xs font-normal text-slate-500">Ajoutée localement</span>
                  </span>
                </span>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2 lg:items-start">
              <Card class="overflow-visible border-0 bg-linear-to-br from-sky-50/40 via-white to-white p-0 shadow-lg shadow-sky-500/10 ring-1 ring-sky-200/80">
                <div class="flex flex-wrap items-start gap-3 border-b border-sky-100 bg-linear-to-r from-sky-100/60 to-transparent px-5 py-4 sm:px-6">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/30">
                    <ScanSearch class="h-6 w-6" strokeWidth={2.25} />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-semibold text-slate-900">Imagerie</h3>
                    <p class="mt-0.5 text-xs text-slate-600">
                      <strong class="text-sky-900">SNOMED CT</strong> — recherche dans le catalogue.
                    </p>
                  </div>
                  <button type="button" onClick={addImagerieRow} class={addBtnSky}>
                    <Sparkles class="h-4 w-4" strokeWidth={2.25} />
                    Ajouter une ligne
                  </button>
                </div>
                <div class="p-5 sm:p-6">
                  {imagerieRows.value.length === 0 ? (
                    <p class="rounded-xl border border-dashed border-sky-200 bg-sky-50/40 px-4 py-8 text-center text-sm text-slate-600">
                      Aucune ligne. Ajoutez une ligne puis choisissez un examen.
                    </p>
                  ) : (
                    <div class="space-y-4">
                      {imagerieRows.value.map((row) => (
                        <CodedExamLineBlock
                          key={row.id}
                          row={row}
                          options={imagerieSelectOptions}
                          catalog={imagerieCatalog}
                          onSelectCatalog={(v) => handleImagerieCatalogSelect(row.id, v)}
                          onResult={(v) => {
                            imagerieRows.value = imagerieRows.value.map((r) =>
                              r.id === row.id ? touchPersistedRow(r, { result: v }) : r
                            );
                          }}
                          onCustomPatch={(patch) => {
                            imagerieRows.value = imagerieRows.value.map((r) =>
                              r.id === row.id ? touchPersistedRow(r, patch) : r
                            );
                          }}
                          onRemove={() => requestDelete('imagerie', row.id)}
                          selectListMaxClass="max-h-[min(70vh,28rem)]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card class="overflow-visible border-0 bg-linear-to-br from-emerald-50/35 via-white to-white p-0 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-200/80">
                <div class="flex flex-wrap items-start gap-3 border-b border-emerald-100 bg-linear-to-r from-emerald-100/55 to-transparent px-5 py-4 sm:px-6">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                    <Activity class="h-6 w-6" strokeWidth={2.25} />
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-semibold text-slate-900">Exploration fonctionnelle</h3>
                    <p class="mt-0.5 text-xs text-slate-600">
                      <strong class="text-emerald-900">SNOMED CT</strong> ; <strong>LOINC</strong> indiqué quand présent.
                    </p>
                  </div>
                  <button type="button" onClick={addExplorationRow} class={addBtnEmerald}>
                    <Sparkles class="h-4 w-4" strokeWidth={2.25} />
                    Ajouter une ligne
                  </button>
                </div>
                <div class="p-5 sm:p-6">
                  {explorationRows.value.length === 0 ? (
                    <p class="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-8 text-center text-sm text-slate-600">
                      Aucune ligne. Ajoutez une exploration depuis le catalogue.
                    </p>
                  ) : (
                    <div class="space-y-4">
                      {explorationRows.value.map((row) => (
                        <CodedExamLineBlock
                          key={row.id}
                          row={row}
                          options={explorationSelectOptions}
                          catalog={explorationCatalog}
                          onSelectCatalog={(v) => handleExplorationCatalogSelect(row.id, v)}
                          onResult={(v) => {
                            explorationRows.value = explorationRows.value.map((r) =>
                              r.id === row.id ? touchPersistedRow(r, { result: v }) : r
                            );
                          }}
                          onCustomPatch={(patch) => {
                            explorationRows.value = explorationRows.value.map((r) =>
                              r.id === row.id ? touchPersistedRow(r, patch) : r
                            );
                          }}
                          onRemove={() => requestDelete('exploration', row.id)}
                          selectListMaxClass="max-h-[min(70vh,28rem)]"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <Card class="overflow-visible border-0 bg-linear-to-br from-rose-50/35 via-white to-white p-0 shadow-lg shadow-rose-500/10 ring-1 ring-rose-200/80">
              <div class="flex flex-wrap items-start gap-3 border-b border-rose-100 bg-linear-to-r from-rose-100/55 to-transparent px-5 py-4 sm:px-6">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md shadow-rose-600/30">
                  <FlaskConical class="h-6 w-6" strokeWidth={2.25} />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-lg font-semibold text-slate-900">Biologie</h3>
                  <p class="mt-0.5 text-xs text-slate-600">
                    Catalogue bilans — <strong class="text-rose-900">LOINC</strong> lorsqu&apos;il est renseigné.
                  </p>
                </div>
                <button type="button" onClick={addBiologieRow} class={addBtnRose}>
                  <Sparkles class="h-4 w-4" strokeWidth={2.25} />
                  Ajouter une ligne
                </button>
              </div>
              <div class="p-5 sm:p-6">
                {biologieRows.value.length === 0 ? (
                  <p class="rounded-xl border border-dashed border-rose-200 bg-rose-50/40 px-4 py-8 text-center text-sm text-slate-600">
                    Aucune ligne. Choisissez un examen du catalogue bilans.
                  </p>
                ) : (
                  <div class="space-y-4">
                    {biologieRows.value.map((row) => (
                      <CodedExamLineBlock
                        key={row.id}
                        row={row}
                        options={biologieSelectOptions}
                        catalog={biologieCatalog}
                        onSelectCatalog={(v) => handleBiologieCatalogSelect(row.id, v)}
                        onResult={(v) => {
                          biologieRows.value = biologieRows.value.map((r) =>
                            r.id === row.id ? touchPersistedRow(r, { result: v }) : r
                          );
                        }}
                        onCustomPatch={(patch) => {
                          biologieRows.value = biologieRows.value.map((r) =>
                            r.id === row.id ? touchPersistedRow(r, patch) : r
                          );
                        }}
                        onRemove={() => requestDelete('biologie', row.id)}
                        selectListMaxClass="max-h-[min(70vh,28rem)]"
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {deleteConfirm.value ? (
              <Teleport to="body">
                <div class="fixed inset-0 z-200 flex items-end justify-center p-4 pb-10 sm:items-center sm:p-6">
                  <button
                    type="button"
                    class="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
                    aria-label="Fermer la boîte de dialogue"
                    onClick={cancelDeleteConfirm}
                  />
                  <div
                    class="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-red-100/90 bg-white shadow-2xl shadow-red-900/15 ring-1 ring-red-200/50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-exam-title"
                  >
                    <div class="relative bg-linear-to-br from-red-50 via-orange-50/50 to-amber-50/40 px-6 pb-5 pt-6">
                      <button
                        type="button"
                        class="absolute right-3 top-3 rounded-xl p-2 text-slate-500 transition hover:bg-white/90 hover:text-slate-800"
                        onClick={cancelDeleteConfirm}
                        aria-label="Fermer"
                      >
                        <X class="h-4 w-4" strokeWidth={2.5} />
                      </button>
                      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-600/40">
                        <AlertTriangle class="h-7 w-7" strokeWidth={2.25} />
                      </div>
                      <h3
                        id="delete-exam-title"
                        class="mt-5 pr-10 text-xl font-bold tracking-tight text-slate-900"
                      >
                        Retirer cette ligne ?
                      </h3>
                      <p class="mt-3 text-sm leading-relaxed text-slate-600">
                        L&apos;examen{' '}
                        <span class="font-semibold text-slate-800">
                          « {deleteConfirm.value.examLabel} »
                        </span>{' '}
                        sera retiré de la liste locale. Enregistrez ensuite pour mettre à jour le dossier.
                      </p>
                    </div>
                    <div class="flex flex-col-reverse gap-2 border-t border-slate-100 bg-linear-to-b from-slate-50/95 to-slate-100/80 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
                      <Button
                        variant="secondary"
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 shadow-sm"
                        onClick={cancelDeleteConfirm}
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="destructive"
                        type="button"
                        class="rounded-xl font-semibold shadow-lg shadow-red-500/25"
                        onClick={confirmDeleteRow}
                      >
                        Oui, retirer
                      </Button>
                    </div>
                  </div>
                </div>
              </Teleport>
            ) : null}
          </>
        )}
      </div>
    );
  },
});
