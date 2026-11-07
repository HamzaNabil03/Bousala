<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use App\Models\StudentService;
use Illuminate\Database\Seeder;

class DynamicServiceSeeder extends Seeder
{
    public function run(): void
    {
        $writing = ServiceCategory::updateOrCreate(['slug' => 'writing'], ['name' => 'الكتابة الأكاديمية', 'description' => 'خدمات كتابة وتجهيز الملفات الأكاديمية', 'sort_order' => 1]);
        $documents = ServiceCategory::updateOrCreate(['slug' => 'official-documents'], ['name' => 'الوثائق الرسمية', 'description' => 'تجهيز وتنسيق وترجمة الوثائق دون ادعاء إصدارها أو تصديقها', 'sort_order' => 2]);
        $applications = ServiceCategory::updateOrCreate(['slug' => 'applications'], ['name' => 'مساعدة التقديم', 'description' => 'مساعدة مهنية في إعداد طلبات المنح', 'sort_order' => 3]);

        $this->service($writing->id, [
            'name' => 'كتابة سيرة ذاتية احترافية', 'slug' => 'professional-cv-writing', 'system_key' => 'cv_writing',
            'description' => 'صياغة سيرة احترافية مناسبة للمنح وأنظمة الفرز الآلي.', 'price' => 15, 'currency' => 'USD', 'icon' => 'FileUser', 'sort_order' => 1, 'delivery_days' => 3,
        ], [
            ['key' => 'contact_information', 'label' => 'بيانات التواصل', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'education', 'label' => 'التعليم والمؤهلات', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'work_experience', 'label' => 'الخبرة العملية', 'type' => 'textarea'],
            ['key' => 'skills', 'label' => 'المهارات', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'courses', 'label' => 'الدورات والشهادات', 'type' => 'textarea'],
            ['key' => 'languages', 'label' => 'اللغات', 'type' => 'textarea'],
            ['key' => 'existing_cv', 'label' => 'السيرة الحالية (اختياري)', 'type' => 'file'],
            ['key' => 'special_instructions', 'label' => 'تعليمات خاصة', 'type' => 'textarea'],
        ]);

        $this->service($writing->id, [
            'name' => 'كتابة خطاب دافع', 'slug' => 'motivation-letter-writing', 'system_key' => 'motivation_letter',
            'description' => 'خطاب دافع مخصص للمنحة أو الجامعة المستهدفة.', 'price' => 10, 'currency' => 'USD', 'icon' => 'PenLine', 'sort_order' => 2, 'delivery_days' => 3,
        ], [
            ['key' => 'target_organization', 'label' => 'اسم المنحة أو الجامعة أو المؤسسة', 'type' => 'text', 'is_required' => true],
            ['key' => 'intended_program', 'label' => 'البرنامج أو مجال الدراسة', 'type' => 'text', 'is_required' => true],
            ['key' => 'academic_background', 'label' => 'الخلفية الأكاديمية', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'relevant_experience', 'label' => 'الخبرات ذات الصلة', 'type' => 'textarea'],
            ['key' => 'achievements', 'label' => 'الإنجازات', 'type' => 'textarea'],
            ['key' => 'motivation', 'label' => 'دافع التقديم', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'future_goals', 'label' => 'الأهداف المستقبلية', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'supporting_document', 'label' => 'ملف داعم (اختياري)', 'type' => 'file'],
        ]);

        $this->service($documents->id, [
            'name' => 'تجهيز وتنسيق وثيقة رسمية', 'slug' => 'official-document-preparation', 'system_key' => 'official_document',
            'description' => 'مساعدة في إعداد وتنسيق الخطابات والنماذج والوثائق الإدارية.', 'price' => 8, 'currency' => 'USD', 'icon' => 'FileCheck2', 'sort_order' => 3, 'delivery_days' => 2,
            'instructions' => 'الخدمة لا تعني إصدار الوثيقة أو تصديقها من جهة رسمية.',
        ], [
            ['key' => 'document_type', 'label' => 'نوع الوثيقة', 'type' => 'select', 'is_required' => true, 'options' => ['خطاب رسمي', 'نموذج تقديم', 'تنسيق وثيقة', 'أخرى']],
            ['key' => 'document_purpose', 'label' => 'الغرض من الوثيقة', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'source_document', 'label' => 'الملف أو النموذج الحالي', 'type' => 'file'],
            ['key' => 'required_date', 'label' => 'تاريخ الحاجة إلى الوثيقة', 'type' => 'date'],
        ]);

        $this->service($documents->id, [
            'name' => 'ترجمة وثيقة', 'slug' => 'document-translation', 'system_key' => 'document_translation',
            'description' => 'ترجمة أكاديمية واضحة للوثائق، دون ادعاء ترجمة قانونية مصدّقة.', 'price' => 7, 'currency' => 'USD', 'icon' => 'Languages', 'sort_order' => 4, 'delivery_days' => 2,
        ], [
            ['key' => 'source_language', 'label' => 'لغة المصدر', 'type' => 'text', 'is_required' => true],
            ['key' => 'target_language', 'label' => 'اللغة المطلوبة', 'type' => 'text', 'is_required' => true],
            ['key' => 'document_file', 'label' => 'الوثيقة المطلوب ترجمتها', 'type' => 'file', 'is_required' => true],
        ]);

        $this->service($applications->id, [
            'name' => 'مساعدة التقديم لمنحة', 'slug' => 'scholarship-application-assistance', 'system_key' => 'scholarship_application',
            'description' => 'مراجعة وتجهيز طلب التقديم؛ لا تضمن القبول ولا تعني ارتباطًا رسميًا بالجهة المانحة.', 'price' => 0, 'currency' => 'USD', 'icon' => 'GraduationCap', 'sort_order' => 5, 'is_active' => true,
        ], [
            ['key' => 'academic_background', 'label' => 'الخلفية الأكاديمية', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'application_goals', 'label' => 'هدفك من التقديم', 'type' => 'textarea', 'is_required' => true],
            ['key' => 'supporting_documents', 'label' => 'ملف داعم', 'type' => 'file'],
        ]);
    }

    private function service(int $categoryId, array $data, array $fields): void
    {
        $service = StudentService::updateOrCreate(['slug' => $data['slug']], ['category_id' => $categoryId, ...$data]);
        foreach ($fields as $index => $field) {
            $service->fields()->updateOrCreate(['key' => $field['key']], [...$field, 'sort_order' => $index + 1]);
        }
    }
}
