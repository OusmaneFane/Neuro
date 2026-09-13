<?php

namespace App\Enums;

enum DocumentType: string
{
    case LAB = 'LAB';
    case IMAGING = 'IMAGING';
    case PRESCRIPTION = 'PRESCRIPTION';
    case DISCHARGE = 'DISCHARGE';
    case ADMIN = 'ADMIN';
    case OTHER = 'OTHER';
}
