/**
 * Parcours thérapeutique envisagé ou en cours, adapté à la neurologie (liste indicative + « Autre »).
 * Stocké dans `therapeutic_pathway` sur l’épisode (max 255 côté API).
 */
export const NEURO_THERAPEUTIC_PATHWAYS: readonly string[] = [
  // Ambulatoire et suivi
  'Surveillance ambulatoire simple (rendez-vous de contrôle)',
  'Rendez-vous de suivi à court terme (< 1 mois)',
  'Rendez-vous de suivi à moyen terme',
  'Consultations de liaison / téléconsultation',
  'Arrêt de travail et suivi de réadaptation professionnelle',

  // Bilans et explorations
  'Bilan complémentaire en cours (imagerie, neurophysio, biologie)',
  'Bilan pré-thérapeutique avant décision',
  'File d’attente examen spécialisé (EEG vidéo, potentiels évoqués, etc.)',

  // Traitement médicamenteux
  'Optimisation du traitement symptomatique',
  'Introduction ou adaptation d’un traitement de fond',
  'Sevrage ou réduction thérapeutique encadrée',
  'Protocole immunomodulateur / immunosuppresseur (ex. SEP)',
  'Anticoagulation ou antiagrégants (prévention vasculaire secondaire)',
  'Traitement antépileptique (introduction, titration, substitution)',

  // Hospitalisation
  'Hospitalisation programmée en secteur neurologique',
  'Hospitalisation en urgence / passage aux urgences neuro',
  'Unité neurovasculaire / prise en charge AVC aigu',
  'Unité de soins intensifs neuro ou surveillance rapprochée',
  'Hospitalisation de jour ou séances spécialisées',

  // Rééducation et SSR
  'Orientation vers SSR neurologique ou rééducation motrice',
  'Kinésithérapie / ergothérapie ambulatoire prescrite',
  'Rééducation vestibulaire ou de la marche',
  'Prise en charge neuropsychologique ou cognitive',

  // Interventions et avis
  'Évaluation préopératoire neurochirurgicale',
  'Chirurgie programmée (date à fixer)',
  'Demande d’avis neurochirurgical ou autre spécialité',
  'Acte interventionnel programmé (ex. infiltration, EMG-guidé)',

  // Oncologie et pathologies chroniques complexes
  'Protocole oncologique (chimiothérapie, radiothérapie) sous coordination',
  'Coordination avec centre de référence maladie rare',

  // Soins de support
  'Prise en charge de la douleur neuropathique ou spasticité',
  'Soins palliatifs ou accompagnement spécialisé',
  'Évaluation et orientation aide à domicile / équipe mobile',

  // Sorties et réseau
  'Sortie avec orientation vers un autre établissement ou ville',
  'Passage de relais médecin traitant / médecin coordonnateur',
  'Mise en place ou suivi d’un réseau soins (SEP, épilepsie, mémoire…)',

  // Situations particulières
  'Refus ou contre-indication thérapeutique (information documentée)',
  'Attente de décision partagée ou second avis',
  'Sortie sans suite thérapeutique spécifique après bilan rassurant',
];
