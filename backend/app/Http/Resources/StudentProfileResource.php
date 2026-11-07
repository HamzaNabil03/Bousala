<?php

namespace App\Http\Resources;

use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudentProfile */
class StudentProfileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name_ar' => $this->full_name_ar,
            'full_name_en' => $this->full_name_en,
            'birth_date' => $this->birth_date?->toDateString(),
            'nationality' => $this->nationality,
            'gender' => $this->gender?->value,
            'country' => $this->country,
            'city' => $this->city,
            'linkedin_url' => $this->linkedin_url,
            'portfolio_url' => $this->portfolio_url,
            'academic_email' => $this->academic_email,
            'bio' => $this->bio,
            'headline' => $this->headline,
            'completion_percent' => $this->completion_percent,

            'educations' => $this->whenLoaded('educations', fn () => $this->educations->map(fn ($e) => [
                'id' => $e->id,
                'degree' => $e->degree->value,
                'degree_label' => $e->degree->label(),
                'major' => $e->major,
                'institution' => $e->institution,
                'country' => $e->country,
                'graduation_year' => $e->graduation_year,
                'is_current' => $e->is_current,
                'gpa_value' => $e->gpa_value,
                'gpa_scale' => $e->gpa_scale,
                'gpa_formatted' => $e->formattedGpa(),
                'honors' => $e->honors,
                'thesis_title' => $e->thesis_title,
            ])->all()),

            'experiences' => $this->whenLoaded('experiences', fn () => $this->experiences->map(fn ($x) => [
                'id' => $x->id,
                'title' => $x->title,
                'type' => $x->type->value,
                'type_label' => $x->type->label(),
                'organization' => $x->organization,
                'country' => $x->country,
                'city' => $x->city,
                'start_date' => $x->start_date?->toDateString(),
                'end_date' => $x->end_date?->toDateString(),
                'is_current' => $x->is_current,
                'description' => $x->description,
            ])->all()),

            'skills' => $this->whenLoaded('skills', fn () => $this->skills->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
            ])->all()),

            'languages' => $this->whenLoaded('languages', fn () => $this->languages->map(fn ($l) => [
                'id' => $l->id,
                'name' => $l->name,
                'proficiency' => $l->proficiency,
                'certificate' => $l->certificate,
            ])->all()),

            'certifications' => $this->whenLoaded('certifications', fn () => $this->certifications->map(fn ($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'issuer' => $c->issuer,
                'credential_id' => $c->credential_id,
                'issue_date' => $c->issue_date?->toDateString(),
                'url' => $c->url,
            ])->all()),

            'projects' => $this->whenLoaded('projects', fn () => $this->projects->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'description' => $p->description,
                'year' => $p->year,
                'url' => $p->url,
            ])->all()),

            'interests' => $this->whenLoaded('interests', fn () => $this->interests->map(fn ($i) => [
                'id' => $i->id,
                'name' => $i->name,
            ])->all()),
        ];
    }
}
