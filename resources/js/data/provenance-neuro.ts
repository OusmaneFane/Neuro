/**
 * Provenance / mode d’orientation du patient vers la prise en charge neurologique.
 * Stocké dans `provenance` sur l’épisode (max 255 côté API).
 */
export const NEURO_PROVENANCES: readonly string[] = [
  'Consultation spontanée / venue directe aux urgences ou au cabinet',
  'Médecin traitant ou généraliste',
  'Autre médecin spécialiste (non neurologue)',
  'Neurologue libéral ou autre établissement (avis / orientation)',
  'Service des urgences du même établissement',
  'Service des urgences d’un autre établissement',
  'SAMU / SMUR / régulation',
  'Transfert inter-hospitalier (rapatriement, lits, spécialisé)',
  'Patient déjà hospitalisé dans le service (évolution, complication)',
  'Hospitalisation programmée (entrée directe service ou J-1)',
  'Convocation filière / consultation spécialisée (ex. AVC, épilepsie, SEP)',
  'SSR ou établissement de soins de suite (retour, réorientation)',
  'EHPAD ou établissement médico-social',
  'Structure psychiatrique ou CMP (orientation conjointe)',
  'Travailleur médico-social / coordination de ville',
  'Assurance maladie / médecin conseil / médecin du travail',
  'Patient en déplacement / résidence hors secteur habituel',
  'Étranger / prise en charge transfrontalière',
  'Justice / garde à vue / expertise médico-légale',
  'Téléconsultation ou télé-expertise préalable',
];
