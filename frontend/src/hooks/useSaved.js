import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { scholarshipApi } from "@/api/endpoints";
import { useAuth } from "@/context/AuthContext";

/**
 * إدارة المنح المحفوظة للزائر المسجّل.
 * الزائر غير المسجّل يُحوَّل لصفحة الدخول مع حفظ وجهته.
 */
export function useSaved() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [slugs, setSlugs] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setSlugs(new Set());
      return undefined;
    }

    let cancelled = false;

    scholarshipApi
      .saved()
      .then((items) => {
        if (!cancelled) setSlugs(new Set(items.map((item) => item.slug)));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const isSaved = useCallback((slug) => slugs.has(slug), [slugs]);

  const flip = useCallback((slug) => {
    setSlugs((current) => {
      const next = new Set(current);

      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return next;
    });
  }, []);

  const toggle = useCallback(
    async (scholarship) => {
      if (!isAuthenticated) {
        navigate(`/login?next=/scholarships/${scholarship.slug}`);
        return;
      }

      // تحديث متفائل ثم تراجع عند الفشل
      flip(scholarship.slug);

      try {
        await scholarshipApi.toggleSave(scholarship.slug);
      } catch {
        flip(scholarship.slug);
      }
    },
    [isAuthenticated, navigate, flip],
  );

  return { isSaved, toggle, savedSlugs: slugs };
}
