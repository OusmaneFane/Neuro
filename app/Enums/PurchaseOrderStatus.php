<?php

namespace App\Enums;

enum PurchaseOrderStatus: string
{
    case DRAFT = 'DRAFT';
    case SENT = 'SENT';
    case PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED';
    case RECEIVED = 'RECEIVED';
    case CANCELLED = 'CANCELLED';
}
