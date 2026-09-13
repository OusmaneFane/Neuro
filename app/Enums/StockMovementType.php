<?php

namespace App\Enums;

enum StockMovementType: string
{
    case IN_PURCHASE = 'IN_PURCHASE';
    case IN_RETURN = 'IN_RETURN';
    case OUT_DISPENSE = 'OUT_DISPENSE';
    case OUT_TRANSFER = 'OUT_TRANSFER';
    case OUT_WASTE = 'OUT_WASTE';
    case ADJUSTMENT = 'ADJUSTMENT';
    case INVENTORY = 'INVENTORY';
}
