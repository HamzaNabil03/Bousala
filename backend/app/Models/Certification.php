<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certification extends Model
{
    protected $fillable = [
        'student_profile_id', 'title', 'issuer', 'credential_id', 'issue_date', 'url',
    ];

    protected function casts(): array
    {
        return ['issue_date' => 'date'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }
}
