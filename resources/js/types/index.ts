export type UserRole =
  | 'ADMIN'
  | 'DOCTOR'
  | 'INTERN'
  | 'NURSE'
  | 'DS'
  | 'ARCHIVIST'
  | 'SECRETARY'
  | 'CASHIER'
  | 'ACCOUNTANT'
  | 'PHARMACIST'
  | 'STOREKEEPER'
  | 'PATIENT';

export const HOSPITAL_STAFF_ROLES: UserRole[] = [
  'ADMIN',
  'DOCTOR',
  'INTERN',
  'NURSE',
  'DS',
  'ARCHIVIST',
  'SECRETARY',
  'CASHIER',
  'ACCOUNTANT',
  'PHARMACIST',
  'STOREKEEPER',
];

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  hospital?: { id: number; name: string };
}

export interface Patient {
  id: number;
  iup: string;
  first_name: string;
  last_name: string;
  full_name: string;
  birth_date: string;
  sex: string;
  laterality?: string;
  phone?: string;
  address?: string;
  education_level?: string;
  profession?: string;
  marital_status?: string;
  treating_doctor?: string;
  usual_treatment?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_first_name?: string;
  emergency_contact_phone?: string;
  photo_url?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  created_by?: { id: number; full_name: string };
  updated_by?: { id: number; full_name: string };
  evolution?: string;
  mode_sortie?: string;
}

export type EpisodeType = 'CONSULTATION' | 'HOSPITALIZATION' | 'EMERGENCY';

export interface Episode {
  id: number;
  patient_id: number;
  patient?: { id: number; iup: string; full_name: string; birth_date?: string };
  type: EpisodeType;
  transport_mean?: string;
  start_date: string;
  end_date?: string;
  reason?: string;
  therapeutic_pathway?: string;
  provenance?: string;
  medical_history?: string;
  dietary_habits?: string;
  clinical_exam?: string;
  diagnosis?: string;
  complications?: string;
  discharge_date?: string;
  discharge_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: { id: number; full_name: string };
  updated_by?: { id: number; full_name: string };
}

export type DocumentType = 'LAB' | 'IMAGING' | 'PRESCRIPTION' | 'DISCHARGE' | 'ADMIN' | 'OTHER';

export interface Document {
  id: number;
  patient_id: number;
  patient?: { id: number; iup: string; full_name: string };
  episode_id?: number;
  type: DocumentType;
  filename: string;
  path: string;
  url: string;
  mime?: string;
  size: number;
  is_viewable: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: { id: number; full_name: string };
}

export interface ShareToken {
  id: number;
  token: string;
  scope: 'SUMMARY' | 'FULL';
  expires_at: string;
  share_url: string;
}

export interface ClinicalNote {
  id: number;
  patient_id: number;
  content: string;
  created_by?: { id: number; full_name: string };
  updated_by?: { id: number; full_name: string };
  deleted_by?: { id: number; full_name: string };
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}
