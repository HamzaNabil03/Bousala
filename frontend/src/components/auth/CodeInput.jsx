import { forwardRef, useImperativeHandle, useRef } from "react";

export const CODE_LENGTH = 6;

/**
 * حقول إدخال رمز التحقق من ستة أرقام.
 *
 * الاتجاه ltr دائماً لأن الأرقام تُقرأ من اليسار، بينما بقية الصفحة rtl.
 * يدعم لصق الرمز كاملاً في أي خانة، والتنقّل بالأسهم وزر الحذف.
 */
export const CodeInput = forwardRef(function CodeInput({ digits, onChange, disabled = false }, ref) {
  const inputs = useRef([]);

  useImperativeHandle(ref, () => ({
    focusFirst: () => inputs.current[0]?.focus(),
  }));

  const setDigit = (index, value) => {
    const next = [...digits];
    next[index] = value;
    onChange(next);
  };

  const handleChange = (index) => (event) => {
    const value = event.target.value.replace(/\D/g, "");

    if (!value) {
      setDigit(index, "");
      return;
    }

    // لصق الرمز كاملاً في أي خانة
    if (value.length > 1) {
      const chars = value.slice(0, CODE_LENGTH - index).split("");
      const next = [...digits];
      chars.forEach((char, offset) => {
        next[index + offset] = char;
      });
      onChange(next);
      inputs.current[Math.min(index + chars.length, CODE_LENGTH - 1)]?.focus();
      return;
    }

    setDigit(index, value);
    if (index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index) => (event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    // في rtl يقع السهم الأيسر على الخانة التالية بصرياً
    if (event.key === "ArrowLeft" && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (event.key === "ArrowRight" && index > 0) inputs.current[index - 1]?.focus();
  };

  return (
    <div className="flex justify-center gap-2" dir="ltr">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          aria-label={`الرقم ${index + 1}`}
          value={digit}
          disabled={disabled}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          autoFocus={index === 0}
          className="h-14 w-12 rounded-xl border border-ink-900/12 bg-white/60 backdrop-blur-md text-center text-2xl font-bold text-navy-800 transition focus:border-navy-500 focus:ring-2 focus:ring-navy-100 focus:outline-none disabled:bg-ink-100"
        />
      ))}
    </div>
  );
});

/** حالة أولية فارغة للرمز */
export const emptyCode = () => Array(CODE_LENGTH).fill("");
