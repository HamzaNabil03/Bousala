<!DOCTYPE html>
{{-- قالب بجداول وأنماط مضمّنة — عملاء البريد لا يدعمون flex ولا ملفات CSS خارجية --}}
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>فعّل حسابك في بَوْصلة</title>
</head>
<body style="margin:0; padding:0; background-color:#eef1f6;">
    {{-- نصّ المعاينة في صندوق الوارد، مخفيّ داخل الرسالة --}}
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        اضغط زر التفعيل لإكمال إنشاء حسابك — الرابط صالح {{ $hours }} ساعة.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#eef1f6; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="max-width:540px; background-color:#ffffff; border-radius:18px; overflow:hidden;
                              font-family:'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl; text-align:right;
                              box-shadow:0 2px 6px rgba(16,37,85,0.06);">

                    {{-- الترويسة: شعار المنصّة على أرضية كحلية --}}
                    <tr>
                        <td style="background-color:#14306b; padding:28px 32px;" align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding-inline-end:10px;" valign="middle">
                                        <img src="{{ rtrim(config('menhity.frontend_url'), '/') }}/logo-mail.png"
                                             width="34" height="34" alt=""
                                             style="display:block; border:0;">
                                    </td>
                                    <td valign="middle">
                                        <span style="color:#ffffff; font-size:23px; font-weight:bold;">بَوْصلة</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:36px 32px 8px;">
                            <h1 style="margin:0 0 18px; font-size:22px; color:#14306b;">خطوة واحدة ويصير حسابك جاهزاً</h1>

                            <p style="margin:0 0 6px; font-size:15px; color:#334155; line-height:1.9;">
                                مرحباً {{ $name }}،
                            </p>
                            <p style="margin:0 0 28px; font-size:15px; color:#334155; line-height:1.9;">
                                أنشأت حساباً في بَوْصلة. اضغط الزر أدناه لتفعيله وتبدأ باكتشاف المنح المناسبة لك.
                            </p>
                        </td>
                    </tr>

                    {{-- الزر: خلية ملوّنة داخل جدول — الطريقة التي تعرضها كل عملاء البريد --}}
                    <tr>
                        <td style="padding:0 32px 28px;" align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" bgcolor="#f6c445" style="border-radius:12px;">
                                        <a href="{{ $url }}"
                                           style="display:inline-block; padding:16px 44px; font-size:16px; font-weight:bold;
                                                  color:#102555; text-decoration:none; border-radius:12px;
                                                  font-family:'Segoe UI', Tahoma, Arial, sans-serif;">
                                            تفعيل الحساب
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:0 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="background-color:#f6f8fb; border:1px solid #e4e9f1; border-radius:12px; padding:16px 18px;">
                                        <p style="margin:0 0 8px; font-size:12.5px; color:#64748b; line-height:1.8;">
                                            لا يعمل الزر؟ انسخ هذا الرابط والصقه في المتصفح:
                                        </p>
                                        {{-- ltr وكسر داخل الكلمة: الرابط طويل ولاتيني داخل قالب عربي --}}
                                        <a href="{{ $url }}" dir="ltr"
                                           style="font-size:12px; color:#1e3f8c; word-break:break-all; text-decoration:underline;">
                                            {{ $url }}
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:22px 0 0; font-size:13.5px; color:#64748b; line-height:1.9;">
                                الرابط صالح لمدة <strong style="color:#14306b;">{{ $hours }}</strong> ساعة ويُستخدم مرة واحدة.
                            </p>
                            <p style="margin:10px 0 32px; font-size:13.5px; color:#64748b; line-height:1.9;">
                                إن لم تكن أنت من أنشأ هذا الحساب، تجاهل هذه الرسالة ولن يُفعَّل الحساب.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#f6f8fb; padding:20px 32px; text-align:center;
                                   font-size:12px; color:#94a3b8; border-top:1px solid #e4e9f1;">
                            © {{ date('Y') }} بَوْصلة — منصّة المنح الدراسية
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
