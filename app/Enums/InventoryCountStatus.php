<?php

namespace App\Enums;

enum InventoryCountStatus: string
{
    case DRAFT = 'DRAFT';
    case IN_PROGRESS = 'IN_PROGRESS';
    case VALIDATED = 'VALIDATED';
    case CANCELLED = 'CANCELLED';
}
