<?php

namespace App\Enums;

enum ProductUnit: string
{
    case BOX = 'BOX';
    case UNIT = 'UNIT';
    case ML = 'ML';
    case G = 'G';
    case TABLET = 'TABLET';
    case VIAL = 'VIAL';
    case OTHER = 'OTHER';
}
