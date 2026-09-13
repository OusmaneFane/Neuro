<?php

namespace App\Enums;

enum EpisodeType: string
{
    case CONSULTATION = 'CONSULTATION';
    case HOSPITALIZATION = 'HOSPITALIZATION';
    case EMERGENCY = 'EMERGENCY';
}
