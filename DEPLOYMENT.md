# نشر بَوْصلة مجاناً

دليل خطوة بخطوة لرفع المشروع على الإنترنت **بلا أي تكلفة**.

المشروع ثلاث قطع، كلٌّ على خدمة مجانية:

| القطعة | الخدمة | الخطة |
|---|---|---|
| قاعدة البيانات (PostgreSQL) | [Neon](https://neon.tech) | مجانية دائمة |
| الخادم (Laravel API) | [Render](https://render.com) | مجانية — مع تنبيه أدناه |
| الواجهة (React) | [Cloudflare Pages](https://pages.cloudflare.com) | مجانية |

> ⚠️ **تنبيه مهم عن الخطة المجانية في Render**: الخادم **ينام** بعد ١٥ دقيقة بلا زيارات،
> وأول طلب بعد النوم يستغرق **٤٠–٦٠ ثانية** حتى يستيقظ. هذا مقبول لعرض مشروع
> أو للتجربة، لكنه غير مناسب لموقع بزوّار حقيقيين. قبل أي عرض أو مناقشة،
> افتح الموقع مرة قبلها بدقيقتين ليستيقظ.

---

## الخطوة ١ — قاعدة البيانات على Neon

1. سجّل في [neon.tech](https://neon.tech) بحساب GitHub.
2. **Create project** ← اسمه `bousla` ← اختر أقرب منطقة لك (`Frankfurt` مناسبة للمنطقة العربية).
3. من صفحة المشروع انسخ **Connection string**. يبدو هكذا:

```
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

احتفظ به — ستحتاجه في الخطوة التالية.

---

## الخطوة ٢ — الخادم على Render

### أ) ولّد مفتاح التطبيق

على جهازك، من مجلد `backend`:

```powershell
php artisan key:generate --show
```

سيطبع سطراً مثل `base64:xxxxxxxxxxxx` — انسخه كاملاً.

### ب) أنشئ الخدمة

1. سجّل في [render.com](https://render.com) بحساب GitHub.
2. **New** ← **Web Service** ← اربط مستودع `Menhity`.
3. الإعدادات:

| الحقل | القيمة |
|---|---|
| Name | `bousla-api` |
| Region | `Frankfurt` |
| Root Directory | `backend` |
| Runtime | `Docker` |
| Instance Type | `Free` |

### ج) متغيّرات البيئة

أضفها من **Environment** قبل أول نشر:

| المتغيّر | القيمة |
|---|---|
| `APP_NAME` | `بَوْصلة` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | المفتاح من الخطوة (أ) |
| `APP_URL` | `https://bousla-api.onrender.com` |
| `APP_LOCALE` | `ar` |
| `LOG_CHANNEL` | `stderr` |
| `DB_CONNECTION` | `pgsql` |
| `DB_URL` | رابط Neon من الخطوة ١ |
| `FRONTEND_URL` | `https://bousla.pages.dev` (اضبطه بعد الخطوة ٣) |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `FILESYSTEM_DISK` | `public` |
| `SEED_ON_DEPLOY` | `true` ← **عند أول نشر فقط** |

اضغط **Create Web Service**. أول بناء يستغرق ٥–١٠ دقائق.

### د) تحقّق

افتح `https://bousla-api.onrender.com/api/v1/stats` — لازم يظهر JSON بالأرقام.

> بعد نجاح أول نشر، **غيّر `SEED_ON_DEPLOY` إلى `false`** حتى لا تُزرع البيانات
> التجريبية مجدداً مع كل نشر.

---

## الخطوة ٣ — الواجهة على Cloudflare Pages

1. سجّل في [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Workers & Pages** ← **Create** ← **Pages** ← **Connect to Git** ← اختر `Menhity`.
3. الإعدادات:

| الحقل | القيمة |
|---|---|
| Project name | `bousla` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `frontend` |

4. **Environment variables** ← أضف:

| المتغيّر | القيمة |
|---|---|
| `VITE_API_URL` | `https://bousla-api.onrender.com/api/v1` |

5. **Save and Deploy**.

ستحصل على رابط مثل `https://bousla.pages.dev`.

### أغلق الدائرة

ارجع إلى Render واضبط `FRONTEND_URL` على رابط Cloudflare، ثم **Manual Deploy** لإعادة النشر.
بدون هذه الخطوة سيمنع CORS الواجهة من الوصول إلى الـ API.

---

## الخطوة ٤ — النطاق (اختياري)

النطاق الفرعي `bousla.pages.dev` مجاني ويعمل فوراً. لنطاق خاص:

**نطاق مجاني للطلاب**: [GitHub Student Developer Pack](https://education.github.com/pack)
يمنح نطاق `.me` مجاناً لسنة من Namecheap، إضافةً إلى أرصدة أخرى. يحتاج إثبات قيد جامعي.

**نطاق مدفوع**: ~$10–15 سنوياً من [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)
(يبيع بسعر التكلفة بلا هامش ربح).

بعد الشراء: في Cloudflare Pages ← **Custom domains** ← **Set up a domain**.
إن كان النطاق مسجّلاً في Cloudflare فالربط تلقائي؛ وإلا أضف سجل `CNAME` عند مسجّلك.

ثم حدّث `FRONTEND_URL` في Render إلى نطاقك الجديد.

---

## ما يبقى معطّلاً بعد النشر

| الميزة | لماذا | الحل المجاني |
|---|---|---|
| **رسائل البريد** (تأكيد الحساب واستعادة كلمة المرور) | `MAIL_MAILER=log` يكتب الرسالة في السجل بدل إرسالها | ناقل عبر HTTPS: Resend لنطاقك، أو حساب Gmail بلا نطاق — [الخطوات أدناه](#ربط-البريد-الإلكتروني-مجاناً) |
| **المستندات المرفوعة** | قرص Render مؤقّت — تُمحى مع كل نشر | [Cloudflare R2](https://developers.cloudflare.com/r2/) مجاناً حتى ١٠GB |
| **أدوات الذكاء الاصطناعي** | تعمل بوضع المحاكاة | أضف `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` — مجاني بلا بطاقة دفع ([الخطوات أدناه](#تفعيل-أدوات-الذكاء-الاصطناعي-مجاناً)) |
| **دخول Google / Apple** | لا بيانات اعتماد OAuth | مجاني — يحتاج إعداد في Google Cloud Console |

> **ابدأ بالبريد.** تأكيد الحساب واستعادة كلمة المرور كلاهما يمرّ عبره — بدونه
> لا يستطيع أي مستخدم جديد إكمال التسجيل.

---

## بديل: النشر على Railway

Railway تستضيف **الخادم وقاعدة البيانات معاً** في مكان واحد، ولا ينام الخادم —
فلا تنتظر ٤٠ ثانية كما في Render. المقابل أنها **ليست مجانية على المدى الطويل**:
رصيد تجريبي عند التسجيل، ثم خطة Hobby بحدود ٥ دولارات شهرياً.
تحقّق من أسعارهم الحالية لأنها تتغيّر.

المشروع مهيّأ لها: `backend/railway.json` يحدّد البناء بـ Dockerfile وفحص الصحة على `/up`.

### ١. أنشئ المشروع وقاعدة البيانات

1. سجّل في [railway.app](https://railway.app) بحساب GitHub.
2. **New Project** ← **Deploy from GitHub repo** ← اختر `Menhity`.
3. داخل المشروع: **New** ← **Database** ← **Add PostgreSQL**.
   تُنشأ خدمة باسم `Postgres` وتوفّر متغيّر `DATABASE_URL` تلقائياً.

### ٢. اضبط مجلد الجذر — افعلها فوراً ⚠️

**Settings** ← قسم **Source** ← حقل **Root Directory** ← اكتب:

```
backend
```

> **هذه أهم خطوة، وأكثر ما يُنسى.** تبدأ Railway أول نشر تلقائياً بمجرّد ربط
> المستودع، وقبل أن تضبط هذا الحقل تبني من **جذر المستودع** — فلا تجد
> `backend/Dockerfile` ولا `backend/railway.json`، وتسقط إلى مُحلّلها التلقائي
> (`railpack`) الذي يرى مجلد `frontend/` ويحاول بناء مشروع Node، فيفشل.
>
> أول نشر فاشل هنا **متوقّع وطبيعي** — اضبط الحقل ثم أعد النشر.

### ٣. متغيّرات البيئة

من تبويب **Variables** في خدمة الخادم:

| المتغيّر | القيمة |
|---|---|
| `APP_NAME` | `بَوْصلة` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | ناتج `php artisan key:generate --show` |
| `APP_URL` | رابط الخدمة بعد توليده (الخطوة ٤) |
| `APP_LOCALE` | `ar` |
| `LOG_CHANNEL` | `stderr` |
| `DB_CONNECTION` | `pgsql` |
| `DB_URL` | `${{Postgres.DATABASE_URL}}` ← **اكتبه هكذا حرفياً** |
| `FRONTEND_URL` | رابط الواجهة (الخطوة ٥) |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `FILESYSTEM_DISK` | `public` |
| `SEED_ON_DEPLOY` | `true` ← **عند أول نشر فقط** |

> `${{Postgres.DATABASE_URL}}` ليست قيمة تنسخها بنفسك — هي **مرجع** تفهمه Railway
> فتربط الخدمتين. لو غيّرت كلمة مرور قاعدة البيانات لاحقاً يتحدّث الرابط تلقائياً.

### ٤. ولّد الرابط العام

**Settings** ← **Networking** ← **Generate Domain**.
ستحصل على رابط عام يولّده Railway؛ استخدم العنوان الظاهر في لوحة الخدمة، ولا تفترض أن الاسم يتبع اسم المشروع.

انسخه وضعه في `APP_URL`، ثم أعد النشر.

تحقّق: افتح `<الرابط>/api/v1/stats` — لازم يظهر JSON بالأرقام.

> بعد نجاح أول نشر، **غيّر `SEED_ON_DEPLOY` إلى `false`**.

### ٥. الواجهة

الأفضل إبقاؤها على **Cloudflare Pages** (الخطوة ٣ أعلاه) — مجانية وأسرع، ولا تستهلك
رصيد Railway. اضبط فقط:

- في Cloudflare: `VITE_API_URL` = `https://<رابط Railway>/api/v1`
- في Railway: `FRONTEND_URL` = `https://bousla.pages.dev`

ولو أردت وضعها على Railway أيضاً: **New** ← **GitHub Repo** ← نفس المستودع،
Root Directory = `frontend`، وستكتشف Railway مشروع Vite وتبنيه تلقائياً.

### النطاق الخاص على Railway

**Settings** ← **Networking** ← **Custom Domain**. تعطيك Railway سجل `CNAME` تضيفه
عند مسجّل نطاقك. النطاق نفسه تشتريه من جهة أخرى — Railway لا تبيع نطاقات.

---

## ربط البريد الإلكتروني مجاناً

تأكيد الحساب واستعادة كلمة المرور يعتمدان على البريد. بدون ضبطه لا يستطيع
أي مستخدم جديد إكمال التسجيل.

> **القاعدة الأولى: لا SMTP على الاستضافة المجانية.** تحجب Railway وRender
> المنافذ الصادرة 25 و465 و587، فيفشل كل إرسال بـ `Connection timed out`
> مهما صحّ الإعداد. الناقلان التاليان يعملان عبر HTTPS (المنفذ 443) الذي لا يُحجب.

| حالتك | الناقل | ما تحتاجه |
|---|---|---|
| تملك نطاقاً (أو ستشتريه) | `MAIL_MAILER=resend` | `RESEND_API_KEY` + نطاق موثَّق لدى Resend — [الخطوات](#أ-resend-لمن-يملك-نطاقاً) |
| لا نطاق، وتريد الإرسال من حساب Gmail | `MAIL_MAILER=gmail` | عميل OAuth من Google Cloud + أمر `menhity:gmail-auth` — [الخطوات](#ب-gmail-بلا-نطاق-عبر-https) |
| استضافة لا تحجب SMTP (خادم خاص مثلاً) | `MAIL_MAILER=smtp` | بيانات SMTP بالمنافذ الصحيحة — [الخطوات](#ج-smtp-حيث-لا-يُحجب) |

للتشخيص في أي وقت: `php artisan menhity:mail-test <بريدك>` يفحص المنفذ قبل
الإرسال ويطبع الخطأ مع الخطوة العملية المقابلة.

### أ) Resend لمن يملك نطاقاً

**[Resend](https://resend.com)** مجاني حتى ٣٠٠٠ رسالة/شهر ولا يحتاج بطاقة دفع.

#### ١. أنشئ الحساب والمفتاح

1. سجّل في [resend.com](https://resend.com).
2. من القائمة الجانبية: **API Keys** ← **Create API Key**.
3. اتركه على **Sending access** واضغط **Add**، ثم انسخ المفتاح فوراً
   (لن يظهر مرة أخرى).

#### ٢. وثّق نطاق المُرسِل

Resend يرفض الإرسال من نطاق لا تملكه.

- **إن كان لديك نطاق:** **Domains** ← **Add Domain**، ثم أضف سجلات DNS التي
  يعرضها. بعد ظهور **Verified** يصبح `no-reply@yourdomain.com` صالحاً.
- **إن لم يكن لديك نطاق بعد:** استخدم نطاق التجربة الذي يعطيك إياه Resend
  (`onboarding@resend.dev`). **ينفع للاختبار فقط**: لن تصل الرسائل إلا إلى
  البريد الذي سجّلت به.

#### ٣. أضِف المتغيّرات للخادم

في Railway: **menhity-api ← Variables**، أضف:

| المتغيّر | القيمة |
|---|---|
| `MAIL_MAILER` | `resend` |
| `RESEND_API_KEY` | مفتاح Resend من الخطوة ١ |
| `MAIL_FROM_ADDRESS` | `no-reply@yourdomain.com` (أو `onboarding@resend.dev`) |
| `MAIL_FROM_NAME` | `بَوْصلة` |
| `MAIL_REPLY_TO_ADDRESS` | بريدك الحقيقي (اختياري) |

احفظ وانتظر إعادة النشر.

> **لا يمكن الإرسال من بريد على Gmail أو Outlook.** يشترط كل مزوّد أن يكون
> `MAIL_FROM_ADDRESS` على **نطاق تملكه وتوثّقه** — ولا أحد يملك `gmail.com`.
> هذا ما يمنع انتحال الهويات، لا قيد من المنصّة.
>
> البديل: اضبط `MAIL_REPLY_TO_ADDRESS` ببريدك على Gmail. تُرسَل الرسالة
> باسم المنصّة، ومن يضغط **ردّ** يصلك ردّه على بريدك مباشرةً.

> **لماذا لا SMTP؟** تحجب أغلب الاستضافات — Railway منها — المنافذ
> الصادرة 25 و465 و587 لمنع السبام، فيفشل الإرسال بمهلة اتصال:
> `Connection could not be established ... (Connection timed out)`.
> الوضع `resend` يرسل عبر **HTTPS (المنفذ 443)** الذي لا يُحجب أبداً،
> ويحتاج متغيّرين لا سبعة.
>
> إن أصررت على SMTP حيث لا يكون محجوباً: `MAIL_MAILER=smtp`،
> `MAIL_HOST=smtp.resend.com`، `MAIL_PORT=587` (أو **2587** كبديل عند
> الحجب)، `MAIL_SCHEME=smtp`، `MAIL_USERNAME=resend`،
> `MAIL_PASSWORD=<المفتاح>`.

#> **`FRONTEND_URL` مطلوب أيضاً.** يُبنى منه رابط التفعيل داخل الرسالة،
> فإن كان خطأً وصلت الرسالة لكن الزر قاد إلى عنوان لا يعمل.

### ٤. تحقّق

أنشئ حساباً جديداً على الموقع. يجب أن تصل رسالة تحمل رمزاً من ستة أرقام
خلال ثوانٍ. إن لم تجدها، راجع مجلد **Spam** ثم سجلّ **Logs** في Railway.

#### ٥. الرسالة تصل لكن في مجلد Spam

هذا **متوقَّع** مع `onboarding@resend.dev`: نطاق مشترك بين كل حسابات
التجربة، فسمعته سيئة لدى Gmail مهما كان محتوى الرسالة سليماً.

الحل الوحيد هو **نطاق موثَّق باسمك**:

1. **resend.com ← Domains ← Add Domain**، واكتب نطاقك.
2. يعرض Resend ثلاثة سجلات DNS — أضفها عند مسجّل النطاق:

   | السجل | دوره |
   |---|---|
   | **SPF** (`TXT`) | يعلن أن Resend مخوّل بالإرسال باسم نطاقك |
   | **DKIM** (`TXT`) | توقيع تشفيري يثبت أن الرسالة لم تُزوَّر |
   | **DMARC** (`TXT`) | يخبر المستقبِل بما يفعله عند فشل الفحصين |

3. انتظر ظهور **Verified** (دقائق إلى ساعات حسب المسجّل).
4. غيّر `MAIL_FROM_ADDRESS` إلى `no-reply@نطاقك`.

بعدها تصل الرسائل إلى صندوق الوارد مباشرةً. هذه السجلات الثلاثة — لا
محتوى الرسالة — هي ما يحدّد التصنيف عملياً.

> الرسائل تحمل أصلاً نسخة نصية إلى جانب المرئية، وهو ما يتوقّعه مزوّدو
> البريد من الرسائل المشروعة. الباقي على النطاق.

> **`MAIL_SCHEME` يقبل `smtp` أو `smtps` فقط.** استخدم `smtp` مع المنفذ 587
> و`smtps` مع المنفذ 465. القيمة `tls` **غير مقبولة** ويفشل كل إرسال معها.

### ب) Gmail بلا نطاق عبر HTTPS

Gmail عبر SMTP هو ما يفشل على Railway وRender (المنافذ محجوبة)، لكن
**واجهة Gmail API** تعمل عبر HTTPS ولا تحتاج نطاقاً: تصل الرسائل من حساب
Gmail نفسه بتوقيع Google، وهو أفضل تسليم ممكن بلا نطاق. الحدّ ٥٠٠ رسالة/يوم.

الإعداد مرة واحدة، نحو عشر دقائق:

#### ١. مشروع في Google Cloud

1. افتح [console.cloud.google.com](https://console.cloud.google.com) بحساب Gmail الذي سترسل منه المنصّة.
2. **Select a project ← New Project** ← اسمه `menhity` ← **Create**.
3. من البحث العلوي اكتب **Gmail API** ← افتحها ← **Enable**.

#### ٢. شاشة الموافقة

1. **APIs & Services ← OAuth consent screen** (تظهر أيضاً باسم **Google Auth Platform**).
2. نوع المستخدمين **External**، اسم التطبيق `بَوْصلة`، بريد الدعم بريدك، ثم **Save**.
3. **Audience ← Publish app** ثم **Confirm**. لا تحتاج مراجعة Google لاستخدامك أنت،
   لكن **بدون النشر يبقى التطبيق في وضع Testing وينتهي رمز الربط بعد سبعة أيام** فيتوقف الإرسال.

#### ٣. عميل OAuth

**APIs & Services ← Credentials ← Create Credentials ← OAuth client ID** ← النوع
**Desktop app** ← **Create**. انسخ **Client ID** و**Client secret**.

#### ٤. اربط الحساب من جهازك

من مجلد `backend` على جهازك (لا على الخادم):

```powershell
php artisan menhity:gmail-auth
```

يسألك عن المعرّف والسرّ، ثم يطبع رابطاً: افتحه، سجّل الدخول بحساب Gmail،
واقبل. إن ظهرت شاشة **Google hasn't verified this app** فاضغط **Advanced ← Go to بَوْصلة**
— فالتطبيق تطبيقك أنت. يعود المتصفح إلى الطرفية تلقائياً ويطبع الأمر:

```
MAIL_MAILER=gmail
GMAIL_CLIENT_ID=…
GMAIL_CLIENT_SECRET=…
GMAIL_REFRESH_TOKEN=…
MAIL_FROM_ADDRESS=you@gmail.com
MAIL_FROM_NAME=بَوْصلة
```

> إن لم يعد المتصفح إلى الطرفية (WSL أو جهاز آخر) فسيطلب الأمر منك لصق الرابط
> الذي انتقل إليه المتصفح — انسخه من شريط العنوان كاملاً وإن بدت الصفحة فارغة.
> وبالخيار `--manual` يبدأ الأمر بهذا الوضع مباشرة.

#### ٥. أضِف المتغيّرات للخادم

الصق الأسطر الستة في **Variables** (Railway) أو **Environment** (Render) واحفظ.
`MAIL_FROM_ADDRESS` هو بريد الحساب المُخوَّل نفسه: يستبدل Gmail أي عنوان آخر به
ويُبقي اسم المُرسِل. أضف `MAIL_REPLY_TO_ADDRESS` إن أردت أن تصل الردود إلى بريد آخر.

بعد إعادة النشر تحقّق من **Console**:

```
php artisan menhity:mail-test your@email.com
```

> **المفاتيح الثلاثة سرّية** كما كلمة المرور: مكانها لوحة الاستضافة وحدها.
> لإلغاء الربط في أي وقت: [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
> ← بَوْصلة ← **Remove access**، ثم احذف المتغيّرات.

### ج) SMTP حيث لا يُحجب

على استضافة لا تحجب المنافذ الصادرة (خادم خاص مثلاً) يعمل SMTP بكلمة مرور
تطبيق من Gmail: مجاني، ٥٠٠ رسالة/يوم، بلا نطاق.

1. فعّل **التحقق بخطوتين** في حساب Google.
2. افتح [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. اكتب أي اسم ← **Create** ← انسخ الـ **16 محرفاً**.

| المتغيّر | القيمة |
|---|---|
| `MAIL_MAILER` | `smtp` |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` (أو `465` مع `MAIL_SCHEME=smtps`) |
| `MAIL_SCHEME` | `smtp` |
| `MAIL_USERNAME` | بريدك الكامل على Gmail |
| `MAIL_PASSWORD` | الـ 16 محرفاً **بلا مسافات** |
| `MAIL_FROM_ADDRESS` | نفس بريدك على Gmail |
| `MAIL_FROM_NAME` | `بَوْصلة` |

> **Gmail يقدّم المنفذين 587 و465 فقط.** المنفذ `2587` الذي يظهر في إعداد Resend
> خاص بـ Resend وحده، ومع `smtp.gmail.com` لا يستجيب أبداً — وهذا بالضبط ما
> يطبعه السجل: `Unable to connect to smtp.gmail.com:2587 (Connection timed out)`.

> Google يعرض كلمة المرور مقسّمة (`abcd efgh ijkl mnop`) — **احذف المسافات**
> عند لصقها، وإلا رُفضت المصادقة.

> **مزوّدات بديلة** بالإعداد نفسه، يتغيّر `MAIL_HOST` و`MAIL_USERNAME` فقط:
> [Brevo](https://brevo.com) (٣٠٠ رسالة/يوم)، [Mailgun](https://mailgun.com)،
> Amazon SES.

> **المفتاح لا يوضع في الكود ولا يُرسَل لأحد** — مكانه صفحة Variables وحدها.
> إن انكشف، احذفه وأنشئ غيره.

---

## تفعيل أدوات الذكاء الاصطناعي مجاناً

**Cloudflare Workers AI** يعطيك حصة يومية مجانية بلا بطاقة دفع وبلا قيود جغرافية.
كل المطلوب قيمتان من لوحة Cloudflare نفسها التي تستضيف الواجهة.

### ١. معرّف الحساب (Account ID)

1. افتح [dash.cloudflare.com](https://dash.cloudflare.com).
2. من القائمة الجانبية اضغط **AI** ثم **Workers AI**.
3. في صفحة **Use REST API** ستجد **Account ID** — انسخه.

> إن لم تجد الصفحة: المعرّف يظهر أيضاً في رابط المتصفح بعد `dash.cloudflare.com/`
> — السلسلة الطويلة من حروف وأرقام هي معرّف الحساب.

### ٢. الـ Token

1. في نفس صفحة **Workers AI** اضغط **Create API Token** (أو **Use REST API** ← **Create a Workers AI API Token**).
2. اتركه على الصلاحية المقترحة: **Workers AI — Read**.
3. اضغط **Create** ثم **Copy** — **لن يظهر مرة أخرى بعد إغلاق الصفحة.**

### ٣. أضِف المتغيّرين للخادم

في Railway: **menhity-api ← Variables ← + New Variable**، أضف:

| المتغيّر | القيمة |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | معرّف الحساب من الخطوة ١ |
| `CLOUDFLARE_API_TOKEN` | الـ Token من الخطوة ٢ |

احفظ، وانتظر إعادة النشر التلقائية.

### ٤. تحقّق

افتح أي أداة من **أدوات الذكاء الاصطناعي** في لوحة الطالب وشغّلها. إن اختفت
عبارة «نسخة تجريبية مولّدة بوضع المحاكاة» من آخر الناتج، فالتفعيل نجح.

> **تغيير النموذج:** أضف `CLOUDFLARE_MODEL` بالاسم الذي تريده من
> **AI ← Workers AI ← Models** (يبدأ بـ `@cf/`). بدونه يُستخدم
> `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

> **لا تضع أي مفتاح في الكود أو في رسالة لأحد.** المتغيّرات مكانها لوحة الاستضافة
> وحدها. إن انكشف مفتاح، احذفه وأنشئ غيره — لا تكتفِ بتغيير صلاحياته.

---

## استكشاف أخطاء النشر

### البناء يفشل ويطبع السجل قائمة ملفات الجذر مع كلمة `railpack`

```
[railway] prepare railpack-v0.39.0
    ├── frontend/
    ├── .gitignore
    ├── README.md
    └── render.yaml
```

**السبب**: `Root Directory` غير مضبوط على `backend`، فبنت Railway من جذر المستودع.
**الحل**: راجع الخطوة ٢ أعلاه، ثم **Deployments** ← **⋮** ← **Redeploy**.

عند النجاح سترى في السجل `Using detected Dockerfile` بدل `railpack`.

### النشر ينجح لكن فحص الصحة يفشل

تحقّق من سجل التشغيل (**Deploy Logs** لا **Build Logs**). الأسباب الشائعة:

| الرسالة | السبب | الحل |
|---|---|---|
| `SQLSTATE[08006] connection refused` | `DB_URL` خاطئ أو غير مربوط | تأكد أنه `${{Postgres.DATABASE_URL}}` حرفياً |
| `No application encryption key` | `APP_KEY` ناقص | ولّده بـ `php artisan key:generate --show` وأضفه |
| `could not find driver` | امتداد PostgreSQL ناقص | لا يحدث مع الـ Dockerfile الجاهز — تأكد أن Railway تستخدمه لا `railpack` |

### الموقع يفتح لكن بلا أي بيانات

CORS يمنع الواجهة. تأكد أن `FRONTEND_URL` في Railway يطابق رابط الواجهة **تماماً**
بلا شرطة مائلة في آخره، ثم أعد النشر.

### خطأ من Cloudflare يقول `No route for that URI`

اسم النموذج في `CLOUDFLARE_MODEL` غير صحيح أو سُحب من الخدمة. افتح
**AI → Workers AI → Models** في لوحة Cloudflare، وانسخ اسم نموذج نصّي متاح
(يبدأ بـ `@cf/`) وضعه في المتغيّر. لا حاجة لتعديل الكود.

### خطأ `Authentication error` من Cloudflare

الـ Token خطأ أو صلاحياته ناقصة. أنشئ غيره بصلاحية **Workers AI → Read**،
وتأكد أن `CLOUDFLARE_ACCOUNT_ID` هو معرّف الحساب لا معرّف النطاق.

### خطأ 404 من Gemini يقول إن النموذج لم يعد متاحاً

```
Gemini (404): This model models/gemini-X is no longer available to new users.
Please update your code to use models/gemini-Y
```

تسحب Google النماذج القديمة من المستخدمين الجدد دورياً. الرسالة تسمّي البديل —
أضف متغيّر `GEMINI_MODEL` بقيمة الاسم الجديد وأعد النشر. لا حاجة لتعديل الكود.

### المستخدم يسجّل لكن لا تصله رسالة التأكيد

افتح **Console** في Railway ونفّذ:

```
php artisan menhity:mail-test your@email.com
```

يطبع الأمر الإعداد الفعّال، ويفحص منفذ SMTP باتصال قصير قبل الإرسال (فيميّز
المنفذ الخاطئ عن المنفذ المحجوب دون انتظار المهلة كاملة)، ثم يحاول إرسال
رسالة حقيقية ويعرض نص الخطأ كاملاً مع الخطوة العملية المقابلة. أشهر الأسباب:

| الخطأ | السبب |
|---|---|
| `Unable to connect to smtp.gmail.com:2587` | المنفذ لا يقدّمه المزوّد أصلاً: Gmail يعمل على `587` أو `465` فقط، و`2587` خاص بـ Resend. والأضمن على Railway/Render الانتقال إلى `MAIL_MAILER=gmail` |
| `Connection could not be established ... timed out` بمنفذ صحيح | **الأشهر** — الاستضافة تحجب منافذ SMTP الصادرة. انتقل إلى ناقل HTTPS: `MAIL_MAILER=gmail` لحساب Gmail، أو `MAIL_MAILER=resend` لنطاق موثَّق |
| `invalid_grant` | رمز الربط `GMAIL_REFRESH_TOKEN` انتهى أو أُلغي — غالباً لأن شاشة الموافقة ما زالت في وضع Testing (تنتهي رموزها بعد ٧ أيام). انشر التطبيق ثم أعد `menhity:gmail-auth` |
| `invalid_client` | `GMAIL_CLIENT_ID` أو `GMAIL_CLIENT_SECRET` خاطئ — انسخهما من Credentials مجدداً |
| `Gmail API has not been used in project` | فعّل **Gmail API** في مشروع Google Cloud ثم أعد المحاولة |
| `The "tls" scheme is not supported` | `MAIL_SCHEME=tls` — استخدم `smtp` (منفذ 587) أو `smtps` (منفذ 465) |
| `535 Username and Password not accepted` | مع Gmail: كلمة مرور الحساب بدل App Password، أو لُصقت بمسافات |
| `550` أو `domain is not verified` | `MAIL_FROM_ADDRESS` على نطاق غير موثَّق لدى المزوّد |
| `Connection could not be established` | `MAIL_HOST` أو `MAIL_PORT` خطأ |
| لا خطأ لكن لا رسالة | `MAIL_MAILER` ما زال `log`، أو الرسالة في **Spam** |

التطبيق يسجّل فشل الإرسال ولا يُسقط إنشاء الحساب، فالمستخدم يستطيع طلب رمز
جديد بعد ضبط الإعداد. سطر السجل يحمل حقل `hint` بالخطوة العملية بجانب الخطأ،
وتعرض شاشة التأكيد للمستخدم تنبيهاً بأن الرسالة لم تُرسَل بدل تركه ينتظرها.

### مستخدم قديم لا يستطيع الدخول بعد تحديث تأكيد البريد

لا يحدث: الترحيل يعتبر كل الحسابات المنشأة قبل التحديث مؤكَّدة،
والشرط يسري على الحسابات الجديدة وحدها.

### البيانات التجريبية تتكرّر مع كل نشر

`SEED_ON_DEPLOY` ما زال `true`. غيّره إلى `false`.

---

## أسئلة شائعة

**لماذا لا أضع كل شيء على Render؟**
تستطيع، لكن قاعدة بيانات Render المجانية **تنتهي صلاحيتها بعد ٩٠ يوماً** وتُحذف.
قاعدة Neon المجانية دائمة. ولهذا فصلناهما.

**لماذا لا أضع الواجهة على Render أيضاً؟**
الواجهة ملفات ثابتة بعد البناء. Cloudflare يوزّعها من شبكته العالمية مجاناً وبسرعة أعلى،
ولا تنام كخدمة Render.

**الخادم بطيء جداً في أول فتح**
هذا نوم الخطة المجانية، لا خطأ في المشروع. راجع التنبيه في أول الصفحة.

**كيف أحدّث الموقع بعد تعديل الكود؟**
ادفع إلى `main` على GitHub — Render وCloudflare وRailway تنشر تلقائياً.

**Render أم Railway؟**

| | Render (مجاني) | Railway (مدفوع) |
|---|---|---|
| التكلفة | صفر | ~$5/شهر بعد الرصيد التجريبي |
| النوم بعد الخمول | ينام — أول طلب ٤٠–٦٠ ثانية | لا ينام |
| قاعدة البيانات | خارجية (Neon) | مدمجة بضغطة |
| الأنسب لـ | عرض مشروع، تجربة | موقع بزوّار فعليين |
