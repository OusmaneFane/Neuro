<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case DRAFT = 'DRAFT';
    case ISSUED = 'ISSUED';
    case PARTIALLY_PAID = 'PARTIALLY_PAID';
    case PAID = 'PAID';
    case CANCELLED = 'CANCELLED';
    case CREDITED = 'CREDITED';
}
