import { useCallback, useEffect, useState } from "react";

/**
 * يحسب موضع لوحة عائمة معلّقة تحت زرّها، لتُعرَض عبر بوّابة في body.
 *
 * السبب ليس الموضع بل الزجاج: عنصر فيه backdrop-filter يصنع «جذر خلفية»،
 * وما بداخله لا يموّه إلا ما رُسم داخل ذلك الجذر. فقائمة داخل ترويسة زجاجية
 * تفقد تمويهها كلّياً وتظهر طبقة مسطّحة فوق نصّ حادّ. إخراجها من الترويسة
 * يعيد التمويه، وحينها يلزمها موضع محسوب لأنها فقدت مرجعها النسبي.
 *
 * @param {boolean} open
 * @param {{ current: HTMLElement | null }} anchorRef الزرّ الذي تتعلّق به
 * @param {{ width?: number, gap?: number, gutter?: number, matchWidth?: boolean }} options
 * @returns {{ top: number, insetInlineStart: number, width: number } | null}
 */
export function useAnchoredPanel(open, anchorRef, options = {}) {
  const { width = 224, gap = 8, gutter = 8, matchWidth = false } = options;
  const [style, setStyle] = useState(null);

  const place = useCallback(() => {
    const anchor = anchorRef.current;

    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const panelWidth = matchWidth ? rect.width : width;

    // اللوحة تحاذي حافة الزرّ المنطقية نفسها، ثم تُزاح لتبقى داخل الشاشة
    const rtl = getComputedStyle(document.documentElement).direction === "rtl";
    const rawLeft = rtl ? rect.left : rect.right - panelWidth;
    const maxLeft = window.innerWidth - panelWidth - gutter;

    setStyle({
      top: rect.bottom + gap,
      left: Math.min(Math.max(rawLeft, gutter), Math.max(gutter, maxLeft)),
      width: panelWidth,
    });
  }, [anchorRef, gap, gutter, matchWidth, width]);

  useEffect(() => {
    if (!open) {
      setStyle(null);

      return undefined;
    }

    place();

    // التمرير داخل حاوية داخلية لا يُطلق حدث النافذة، فنلتقطه في مرحلة الالتقاط
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  return style;
}
