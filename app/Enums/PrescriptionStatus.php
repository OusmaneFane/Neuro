<?php

namespace App\Enums;

enum PrescriptionStatus: string
{
    case DRAFT = 'DRAFT';
    case ACTIVE = 'ACTIVE';
    case PARTIALLY_DISPENSED = 'PARTIALLY_DISPENSED';
    case DISPENSED = 'DISPENSED';
    case CANCELLED = 'CANCELLED';
}
