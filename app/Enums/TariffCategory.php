<?php

namespace App\Enums;

enum TariffCategory: string
{
    case CONSULTATION = 'CONSULTATION';
    case HOSPITALIZATION = 'HOSPITALIZATION';
    case ACT = 'ACT';
    case LAB = 'LAB';
    case IMAGING = 'IMAGING';
    case DRUG = 'DRUG';
    case OTHER = 'OTHER';
}
