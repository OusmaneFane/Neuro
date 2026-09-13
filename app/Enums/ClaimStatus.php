<?php

namespace App\Enums;

enum ClaimStatus: string
{
    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case ACCEPTED = 'ACCEPTED';
    case PARTIALLY_PAID = 'PARTIALLY_PAID';
    case REJECTED = 'REJECTED';
    case SETTLED = 'SETTLED';
}
