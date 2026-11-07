#!/bin/sh
# نقطة دخول حاوية بَوْصلة.
# تتحقّق من الإعدادات وتنتظر قاعدة البيانات قبل التشغيل، وتطبع سبب أي فشل
# بوضوح في سجل النشر بدل أن تموت الحاوية صامتة فيظهر «Healthcheck failure».
set -e

# Reconcile the module set at startup as well as during the image build.
# Apache requires exactly one MPM; mod_php uses prefork.
a2dismod mpm_event mpm_worker
a2enmod mpm_prefork
PORT=${PORT:-8080}
export PORT
apache2ctl -t

fail() {
  echo ""
  echo "════════════════════════════════════════════"
  echo "  ✗ فشل إقلاع بَوْصلة"
  echo "════════════════════════════════════════════"
  echo "  $1"
  echo ""
  echo "  اضبط المتغيّر من تبويب Variables ثم أعد النشر."
  echo "════════════════════════════════════════════"
  exit 1
}

# ── ١) مفتاح التطبيق ──────────────────────────────────────────
# في الحاوية لا يوجد ملف .env (مستبعَد في .dockerignore) فالمصدر هو متغيّرات
# البيئة، لكننا نقبل .env أيضاً حتى يعمل السكربت محلياً بلا تغيير.
if [ -z "$APP_KEY" ] && ! grep -qs '^APP_KEY=base64:' .env; then
  fail "APP_KEY غير مضبوط. ولّده محلياً بـ: php artisan key:generate --show"
fi

echo "→ تهيئة مجلدات التخزين"
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views \
         storage/logs storage/app/public bootstrap/cache
php artisan storage:link --force >/dev/null 2>&1 || true

# ── ٢) انتظار قاعدة البيانات ──────────────────────────────────
# لا نخمّن الإعداد من أسماء المتغيّرات — نحاول الاتصال فعلاً.
# خدمة قاعدة البيانات قد تتأخّر ثوانيَ عن الحاوية عند أول إقلاع.
echo "→ انتظار قاعدة البيانات"
attempt=1
until php artisan db:show --quiet >/dev/null 2>&1; do
  if [ "$attempt" -ge 12 ]; then
    last_error=$(php artisan db:show 2>&1 || true)

    echo ""
    echo "  تفاصيل آخر محاولة اتصال:"
    echo "$last_error" | grep -v '^[[:space:]]*$' | head -8

    # الاتصال بالمضيف المحلي داخل حاوية يعني أن رابط قاعدة البيانات لم يصل
    # أصلاً، فسقط Laravel إلى قيمه الافتراضية — وهذا عرَض مختلف تماماً
    # عن قاعدة بعيدة لم تستجب، ويستحق إرشاداً مختلفاً.
    if echo "$last_error" | grep -qE '127\.0\.0\.1|localhost'; then
      fail "رابط قاعدة البيانات لم يصل إلى التطبيق.
  المحاولة ذهبت إلى 127.0.0.1 وهي قيمة Laravel الافتراضية، أي أن DB_URL فارغ.

  على Railway هذا يحدث غالباً لأن اسم خدمة قاعدة البيانات لا يطابق المرجع:
  إن كتبت \${{Postgres.DATABASE_URL}} واسم الخدمة ليس Postgres بالضبط،
  تترك Railway القيمة فارغة بصمت.

  الحل المضمون: في حقل DB_URL اكتب \${{ فقط، فتفتح قائمة بالخدمات —
  اختر خدمة قاعدة البيانات ثم DATABASE_URL. وتحقّق أن القيمة المُحلّلة
  تظهر تحت الحقل وتبدأ بـ postgresql://"
    fi

    fail "تعذّر الاتصال بقاعدة البيانات بعد 12 محاولة (60 ثانية).
  الرابط يصل لكن الخادم لا يستجيب — تأكد أن خدمة قاعدة البيانات تعمل،
  وأن DB_CONNECTION=pgsql"
  fi
  echo "   المحاولة ${attempt}/12 — إعادة المحاولة بعد 5 ثوانٍ"
  attempt=$((attempt + 1))
  sleep 5
done
echo "   ✓ قاعدة البيانات جاهزة"

# ── ٣) الترحيلات ──────────────────────────────────────────────
echo "→ تطبيق الترحيلات"
php artisan migrate --force

# البذر مرة واحدة فقط — بضبط SEED_ON_DEPLOY=true يدوياً عند أول نشر
if [ "$SEED_ON_DEPLOY" = "true" ]; then
  echo "→ زرع البيانات التجريبية"
  php artisan db:seed --force
fi

# ── ٤) التخزين المؤقّت ────────────────────────────────────────
echo "→ تخزين الإعدادات والمسارات مؤقتاً"
php artisan config:cache
php artisan route:cache

# Apache's workers run as www-data; migrations/cache warmup above run as root.
chown -R www-data:www-data storage bootstrap/cache

PORT=${PORT:-8080}
case "$PORT" in
  *[!0-9]*|'') fail "PORT يجب أن يكون رقماً بين 1 و65535" ;;
esac
if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
  fail "PORT يجب أن يكون رقماً بين 1 و65535"
fi
export PORT

echo "→ تشغيل Apache على المنفذ ${PORT}"
exec apache2-foreground
