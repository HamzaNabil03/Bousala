import { CircleCheckBig } from "lucide-react";

import { AuthCentered } from "@/components/auth/AuthShell";
import { ButtonLink } from "@/components/ui/Button";

export default function ResetSuccessPage() {
  return (
    <AuthCentered
      icon={<CircleCheckBig className="size-7 text-[color:var(--color-success)]" />}
      title="تم تغيير كلمة المرور"
      description="يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة. أُنهيت جلساتك السابقة على جميع الأجهزة حفاظاً على أمان حسابك."
    >
      <ButtonLink to="/login" className="w-full">
        تسجيل الدخول
      </ButtonLink>

      <ButtonLink to="/" variant="ghost" className="mt-3 w-full">
        العودة للصفحة الرئيسية
      </ButtonLink>
    </AuthCentered>
  );
}
