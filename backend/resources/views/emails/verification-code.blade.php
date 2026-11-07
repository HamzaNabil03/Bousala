<!DOCTYPE html>
{{-- قالب بريد بجداول وأنماط مضمّنة — عملاء البريد لا يدعمون flex ولا ملفات CSS خارجية --}}
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $heading }}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        رمزك هو {{ $code }} وصالح لمدة {{ $minutes }} دقيقة.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:#f4f5f7; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                       style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden;
                              font-family:'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl; text-align:right;">

                    <tr>
                        <td style="background-color:#14306b; padding:24px 32px; text-align:center;">
                            <span style="color:#ffffff; font-size:22px; font-weight:bold;">بَوْصلة</span>
                            <span style="color:#f6c445; font-size:22px; font-weight:bold;">.</span>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:32px;">
                            <h1 style="margin:0 0 16px; font-size:20px; color:#14306b;">{{ $heading }}</h1>

                            <p style="margin:0 0 8px; font-size:15px; color:#374151; line-height:1.8;">
                                مرحباً {{ $name }}،
                            </p>
                            <p style="margin:0 0 24px; font-size:15px; color:#374151; line-height:1.8;">
                                {{ $intro }}
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center"
                                        style="background-color:#f8f9fb; border:1px solid #e5e7eb; border-radius:12px; padding:20px;">
                                        <div style="font-size:13px; color:#6b7280; margin-bottom:8px;">رمز التحقق</div>
                                        <div dir="ltr"
                                             style="font-size:34px; font-weight:bold; letter-spacing:10px; padding-left:10px; color:#14306b;">
                                            {{ $code }}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:24px 0 0; font-size:14px; color:#6b7280; line-height:1.8;">
                                الرمز صالح لمدة <strong style="color:#14306b;">{{ $minutes }}</strong> دقيقة.
                                لا تشارك هذا الرمز مع أي شخص — فريق بَوْصلة لن يطلبه منك أبداً.
                            </p>

                            <p style="margin:16px 0 0; font-size:14px; color:#6b7280; line-height:1.8;">
                                {{ $disclaimer }}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color:#f8f9fb; padding:20px 32px; text-align:center;
                                   font-size:12px; color:#9ca3af; border-top:1px solid #e5e7eb;">
                            © {{ date('Y') }} بَوْصلة — منصّة المنح الدراسية
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
