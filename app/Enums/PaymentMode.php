<?php

namespace App\Enums;

enum PaymentMode: string
{
    case CASH = 'CASH';
    case MOBILE_MONEY = 'MOBILE_MONEY';
    case CARD = 'CARD';
    case BANK_TRANSFER = 'BANK_TRANSFER';
    case CHEQUE = 'CHEQUE';
}
