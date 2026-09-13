/**
 * Motifs de consultation typiques en service de neurologie (liste indicative, saisie complétée par « Autre »).
 * Les libellés sont enregistrés tels quels dans le champ `reason` de l'épisode (max 255 côté API).
 */
export const NEURO_CONSULTATION_MOTIFS: readonly string[] = [
  // Céphalées et douleurs
  'Céphalée chronique / migraine',
  'Céphalée aiguë sévère (thunderclap) / suspicion hémorragie méningée',
  'Migraine avec ou sans aura',
  'Céphalée de tension',
  'Céphalée orthostatique',
  'Céphalées post-traumatiques',

  // Vertiges et équilibre
  'Vertige rotatoire / syndrome vestibulaire périphérique',
  'Vertige non rotatoire / sensation de malaise / pré-syncope',
  'Troubles de l’équilibre / instabilité posturale',
  'Maladie de Ménière ou vertiges récurrents (suivi)',

  // Conscience et vigilance
  'Syncope / perte de connaissance brève',
  'Lipothymie / malaises répétés',
  'Confusion aiguë / trouble de vigilance',

  // Épilepsie et crises
  'Premier épisode convulsif / suspicion d’épilepsie',
  'Crises convulsives généralisées (suivi)',
  'Crises focales / épilepsie partielle (suivi)',
  'Absences / crises non convulsives (évaluation)',

  // Symptômes moteurs focaux et déficits
  'Hémiparésie / faiblesse d’un côté du corps (suspicion AVC)',
  'Faiblesse des membres progressive ou fluctuante',
  'Paralysie faciale (périphérique ou centrale)',
  'Troubles de la déglutition d’origine neuro',

  // Marche, coordination, extra-pyramidal
  'Trouble de la marche / ataxie',
  'Parkinsonisme / maladie de Parkinson (diagnostic ou suivi)',
  'Tremblement au repos ou d’action',
  'Mouvements involontaires / dyskinésies / dystonie',
  'Suspicion ou suivi SLA (sclérose latérale amyotrophique)',

  // Symptômes sensitifs et douleur
  'Paresthésies des membres',
  'Syndrome radiculaire (cervical, dorsal ou lombaire) — avis neuro',
  'Douleur neuropathique (brûlure, choc électrique, allodynie)',
  'Névralgie du trijumeau ou faciale',

  // Langage, parole, cognition
  'Trouble du langage / aphasie',
  'Dysarthrie ou trouble de l’articulation',
  'Troubles de la mémoire ou de l’attention',
  'Trouble neurocognitif / suspicion de démence (bilan)',
  'Encéphalopathie / brouillard cognitif (étiologie à préciser)',

  // Neuro-ophtalmologie
  'Trouble du champ visuel / amputation du champ',
  'Diplopie / paralysie oculomotrice',
  'Perte visuelle aiguë ou progressive (origine neuro à évaluer)',

  // Démyélinisation
  'Suspicion de sclérose en plaques / bilan démyélinisant',
  'Poussée de sclérose en plaques',
  'Suivi de sclérose en plaques',
  'Autre démyélinisation (NMO, MOG, etc.) — bilan ou suivi',

  // Vasculaire cérébral
  'Suspicion d’AIT (accident ischémique transitoire)',
  'Suivi post-AVC ischémique ou hémorragique',
  'Céphalée et sténose des axes supra-aortiques (avis)',

  // Moelle et canal
  'Syndrome médullaire / déficit sensitivo-moteur sous lésion',
  'Suspicion de compression médullaire',
  'Malformation de Chiari / syringomyélie (suivi)',

  // Neuropathies périphériques
  'Neuropathie périphérique (diabétique, toxique, etc.)',
  'Syndrome de Guillain-Barré ou polyradiculonévrite (suspicion ou suivi)',
  'Syndrome canalaire (ex. canal carpien) — avis neuro',

  // Muscle
  'Faiblesse musculaire proximale / suspicion de myopathie',
  'Douleurs musculaires et fatigue avec faiblesse (bilan)',

  // Sommeil
  'Hypersomnie / narcolepsie (suspicion)',
  'Syndrome des jambes sans repos',
  'Troubles du sommeil avec symptômes neurologiques (orientation)',

  // Infectieux / inflammatoire / autres pathologies
  'Suivi ambulatoire post-méningite ou encéphalite',
  'Suspicion de processus inflammatoire ou infectieux du SNC',

  // Tumeurs et neurochirurgie
  'Suspicion de tumeur du système nerveux central',
  'Suivi post-opératoire neurochirurgical',
  'Suivi post-radiothérapie intracrânienne',

  // Traumatisme
  'Commotion cérébrale / traumatisme crânien léger',
  'Syndrome post-commotionnel prolongé',

  // Demande formelle
  'Demande d’avis neurologique (médecin traitant ou autre spécialiste)',
  'Bilan neurologique préopératoire ou pré-anesthésie',
  'Rapport / certificat médical (contexte neurologique)',
];
