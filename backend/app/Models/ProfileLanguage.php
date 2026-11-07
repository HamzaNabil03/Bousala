<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileLanguage extends Model
{
    protected $fillable = ['student_profile_id', 'name', 'proficiency', 'certificate'];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }

    /** هل الشهادة معتمدة دولياً؟ يؤثر على نتيجة المطابقة */
    public function hasRecognisedCertificate(): bool
    {
        return $this->certificate !== null
            && preg_match('/ielts|toefl|أيلتس|توفل/iu', $this->certificate) === 1;
    }
}
