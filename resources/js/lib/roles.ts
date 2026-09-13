import type { UserRole } from '@/types';

/** Full clinical navigation (observations, examens, documents, cartes…). */
export const CLINICAL_ROLES: UserRole[] = [
  'ADMIN',
  'DOCTOR',
  'INTERN',
  'NURSE',
  'DS',
  'ARCHIVIST',
  'SECRETARY',
];

/** Can create/update clinical dossier content. */
export const CLINICAL_WRITE_ROLES: UserRole[] = [
  'ADMIN',
  'DOCTOR',
  'INTERN',
  'NURSE',
  'DS',
  'SECRETARY',
];

export const FINANCE_READ_ROLES: UserRole[] = [
  'ADMIN',
  'ACCOUNTANT',
  'CASHIER',
  'SECRETARY',
  'DS',
];

export const FINANCE_WRITE_ROLES: UserRole[] = [
  'ADMIN',
  'ACCOUNTANT',
  'CASHIER',
  'SECRETARY',
];

export const PHARMACY_ROLES: UserRole[] = [
  'ADMIN',
  'PHARMACIST',
  'STOREKEEPER',
];

/** Patient list/detail without full clinical menu (billing / dispensation). */
export const PATIENT_LOOKUP_ROLES: UserRole[] = [
  'ADMIN',
  'ACCOUNTANT',
  'CASHIER',
  'SECRETARY',
  'DS',
  'PHARMACIST',
  'STOREKEEPER',
];

/** Can open patient list / fiche (clinical nav or lookup). */
export const PATIENT_ACCESS_ROLES: UserRole[] = [
  ...new Set<UserRole>([...CLINICAL_ROLES, ...PATIENT_LOOKUP_ROLES]),
];

export const PRESCRIPTION_WRITE_ROLES: UserRole[] = [
  'ADMIN',
  'DOCTOR',
  'INTERN',
];

export const PRESCRIPTION_READ_ROLES: UserRole[] = [
  ...new Set<UserRole>([...CLINICAL_ROLES, ...PHARMACY_ROLES]),
];

export const ADMIN_ROLES: UserRole[] = ['ADMIN'];

export function hasRole(role: UserRole | undefined | null, allowed: readonly UserRole[]): boolean {
  return !!role && allowed.includes(role);
}

export function canAccessClinicalNav(role: UserRole | undefined | null): boolean {
  return hasRole(role, CLINICAL_ROLES);
}

export function canAccessFinance(role: UserRole | undefined | null): boolean {
  return hasRole(role, FINANCE_READ_ROLES);
}

export function canAccessPharmacy(role: UserRole | undefined | null): boolean {
  return hasRole(role, PHARMACY_ROLES);
}

export function canAccessPatients(role: UserRole | undefined | null): boolean {
  return hasRole(role, PATIENT_ACCESS_ROLES);
}

export function canManageUsers(role: UserRole | undefined | null): boolean {
  return hasRole(role, ADMIN_ROLES);
}
