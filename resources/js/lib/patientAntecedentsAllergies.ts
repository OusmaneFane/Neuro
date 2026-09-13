import type { SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { NEURO_ALLERGIES_CODED } from '@/data/allergies-neuro';
import {
  ANTECEDENT_CATEGORY_LABELS,
  NEURO_ANTECEDENTS_BY_CATEGORY,
  type AntecedentCategory,
} from '@/data/antecedents-neuro';

export const ANTECEDENT_KEYS: AntecedentCategory[] = [
  'medicaux',
  'chirurgicaux',
  'gyneco',
  'familiaux',
  'traitements_anterieurs',
];

export const ANTECEDENT_AUTRE = '__autre_ant__';

export function emptyAntecedentsState(): Record<AntecedentCategory, string[]> {
  return {
    medicaux: [],
    chirurgicaux: [],
    gyneco: [],
    familiaux: [],
    traitements_anterieurs: [],
  };
}

export function normalizeAntecedents(raw: unknown): Record<AntecedentCategory, string[]> {
  const e = emptyAntecedentsState();
  if (!raw || typeof raw !== 'object') return e;
  const o = raw as Record<string, unknown>;
  ANTECEDENT_KEYS.forEach((k) => {
    const arr = o[k];
    e[k] = Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  });
  return e;
}

export function buildAntecedentSelectOptions(cat: AntecedentCategory): SearchableSelectOption[] {
  return [
    ...NEURO_ANTECEDENTS_BY_CATEGORY[cat].map((l) => ({ value: l, label: l })),
    { value: ANTECEDENT_AUTRE, label: '— Autre (saisie libre) —' },
  ];
}

export function buildAllergySelectOptions(): SearchableSelectOption[] {
  return [
    ...NEURO_ALLERGIES_CODED.map((l) => ({ value: l, label: l })),
    { value: ANTECEDENT_AUTRE, label: '— Autre (saisie libre) —' },
  ];
}

export function normalizeAllergiesFromAntecedentsBlob(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return [];
  const o = raw as Record<string, unknown>;
  const arr = o.allergies;
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
}

export { ANTECEDENT_CATEGORY_LABELS };
export type { AntecedentCategory };
