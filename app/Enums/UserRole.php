<?php

namespace App\Enums;

enum UserRole: string
{
    case ADMIN = 'ADMIN';
    case DOCTOR = 'DOCTOR';
    case INTERN = 'INTERN';
    case NURSE = 'NURSE';
    case DS = 'DS';
    case ARCHIVIST = 'ARCHIVIST';
    case SECRETARY = 'SECRETARY';
    case CASHIER = 'CASHIER';
    case ACCOUNTANT = 'ACCOUNTANT';
    case PHARMACIST = 'PHARMACIST';
    case STOREKEEPER = 'STOREKEEPER';
    case PATIENT = 'PATIENT';

    public function isHospitalStaff(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::DOCTOR,
            self::INTERN,
            self::NURSE,
            self::DS,
            self::ARCHIVIST,
            self::SECRETARY,
            self::CASHIER,
            self::ACCOUNTANT,
            self::PHARMACIST,
            self::STOREKEEPER,
        ], true);
    }

    /** Full clinical navigation / dossier clinique. */
    public function canAccessClinical(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::DOCTOR,
            self::INTERN,
            self::NURSE,
            self::DS,
            self::ARCHIVIST,
            self::SECRETARY,
        ], true);
    }

    public function canWriteClinical(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::DOCTOR,
            self::INTERN,
            self::NURSE,
            self::DS,
            self::SECRETARY,
        ], true);
    }

    public function canAccessFinance(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::ACCOUNTANT,
            self::CASHIER,
            self::SECRETARY,
            self::DS,
        ], true);
    }

    public function canWriteFinance(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::ACCOUNTANT,
            self::CASHIER,
            self::SECRETARY,
        ], true);
    }

    public function canAccessPharmacy(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::PHARMACIST,
            self::STOREKEEPER,
        ], true);
    }

    /** Patient list/detail for billing or dispensation without full clinical menu. */
    public function canLookupPatients(): bool
    {
        return $this->canAccessClinical()
            || $this->canAccessFinance()
            || $this->canAccessPharmacy();
    }

    public function canWritePrescriptions(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::DOCTOR,
            self::INTERN,
        ], true);
    }

    public function canReadPrescriptions(): bool
    {
        return $this->canAccessClinical() || $this->canAccessPharmacy();
    }

    public function canDispense(): bool
    {
        return in_array($this, [
            self::ADMIN,
            self::PHARMACIST,
        ], true);
    }

    public function canManageUsers(): bool
    {
        return $this === self::ADMIN;
    }

    /** @return list<string> */
    public static function hospitalStaffValues(): array
    {
        return array_map(
            fn (self $r) => $r->value,
            array_filter(self::cases(), fn (self $r) => $r->isHospitalStaff())
        );
    }

    /** @return list<string> */
    public static function valuesMatching(callable $predicate): array
    {
        return array_values(array_map(
            fn (self $r) => $r->value,
            array_filter(self::cases(), $predicate)
        ));
    }
}
