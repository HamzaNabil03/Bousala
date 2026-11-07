<?php

/**
 * إعدادات منصة بَوْصلة.
 * القيم العامة (اسم المنصة، بيانات التواصل) تُقرأ من هنا وتنعكس
 * على الـ API والواجهة الأمامية معاً.
 */
return [

    /** أصل الواجهة — تُبنى منه روابط الرسائل مثل رابط تفعيل الحساب */
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    'site' => [
        'name' => 'بَوْصلة',
        'name_en' => 'Bousla',
        'tagline' => 'منصة عربية للطلاب والباحثين عن المنح',
        'description' => 'بَوْصلة منصة تساعد الطلاب والباحثين على اكتشاف المنح المناسبة، وتجهيز طلباتهم، ومتابعة مواعيد التقديم باستخدام تقنيات ذكية تجعل رحلة البحث والتقديم أسهل.',
        'email' => 'Menhati@gmail.com',
        'phone' => '0592983443',
        'address' => 'فلسطين، غزة',
        'founded_year' => 2026,
    ],

    'ai' => [
        /*
         * المزوّد المستخدم: cloudflare أو gemini أو anthropic.
         * بلا قيمة يُختار تلقائياً أول مزوّد مضبوط مفتاحه،
         * وإن لم يُضبط أي مفتاح تعمل الأدوات بوضع المحاكاة.
         */
        'provider' => env('AI_PROVIDER'),

        'cloudflare' => [
            'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
            'api_token' => env('CLOUDFLARE_API_TOKEN'),

            /*
             * قائمة نماذج Workers AI تتغيّر، والنموذج قد يُسحب فيرجع 404.
             * عدّل CLOUDFLARE_MODEL وحده عندها دون لمس الكود.
             */
            'model' => env('CLOUDFLARE_MODEL', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
        ],

        'gemini' => [
            'api_key' => env('GEMINI_API_KEY'),

            /*
             * تسحب Google النماذج القديمة من المستخدمين الجدد دورياً،
             * فيرجع 404 يسمّي البديل. عدّل GEMINI_MODEL وحده عندها.
             */
            'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
        ],

        'anthropic' => [
            'api_key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-opus-5'),
        ],

        'max_tokens' => 8000,

        /** مهلة الاتصال بالثواني — التوليد قد يستغرق دقيقة */
        'timeout' => 120,
    ],

    'uploads' => [
        'max_bytes' => 10 * 1024 * 1024, // 10 ميجابايت
        'mimes' => ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'],
    ],

    'pagination' => [
        'public' => 9,
        'admin' => 20,
    ],

    /** مهلة تسليم طلب صياغة السيرة الذاتية بالساعات */
    'cv_order_sla_hours' => 48,
];
