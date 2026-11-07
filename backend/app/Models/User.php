<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar_url',
        'phone',
        'role',
        'status',
        'locale',
        'timezone',
        'profile_visible',
        'share_data_with_universities',
        'notify_new_matches',
        'notify_application_status',
        'notify_news',
        'accepted_terms_at',
        'email_verified_at',
        'oauth_provider',
        'oauth_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    /**
     * قيم افتراضية على مستوى النموذج حتى تكون متاحة فوراً بعد الإنشاء
     * دون الحاجة لإعادة القراءة من قاعدة البيانات.
     *
     * @var array<string, string>
     */
    protected $attributes = [
        'role' => 'student',
        'status' => 'active',
        'locale' => 'ar',
        'timezone' => 'Asia/Riyadh',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'suspended_at' => 'datetime',
            'last_login_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'accepted_terms_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'profile_visible' => 'boolean',
            'share_data_with_universities' => 'boolean',
            'notify_new_matches' => 'boolean',
            'notify_application_status' => 'boolean',
            'notify_news' => 'boolean',
        ];
    }

    /* ---------------- العلاقات ---------------- */

    public function profile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function expertProfile(): HasOne
    {
        return $this->hasOne(ExpertProfile::class);
    }

    public function verificationCodes(): HasMany
    {
        return $this->hasMany(VerificationCode::class);
    }

    public function savedScholarships(): HasMany
    {
        return $this->hasMany(SavedScholarship::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(ScholarshipMatch::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function cvOrders(): HasMany
    {
        return $this->hasMany(CvOrder::class);
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function assignedCvOrders(): HasMany
    {
        return $this->hasMany(CvOrder::class, 'expert_id');
    }

    public function aiRuns(): HasMany
    {
        return $this->hasMany(AiToolRun::class);
    }

    /* ---------------- مساعدات الأدوار ---------------- */

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isAdminLevel(): bool
    {
        return $this->role->isAdminLevel();
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /** الاسم الأول — يُستخدم في رسائل الترحيب */
    public function firstName(): string
    {
        return explode(' ', trim($this->name))[0] ?? $this->name;
    }
}
