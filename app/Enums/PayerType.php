<?php

namespace App\Enums;

enum PayerType: string
{
    case INSURANCE = 'INSURANCE';
    case EMPLOYER = 'EMPLOYER';
    case NGO = 'NGO';
    case STATE = 'STATE';
    case OTHER = 'OTHER';
}
