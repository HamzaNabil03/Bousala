import { useCallback, useEffect, useState } from "react";

import { parseApiError } from "@/api/client";

/**
 * جلب بيانات من الـ API مع إدارة حالتي التحميل والخطأ.
 * تُعاد دالة reload لإعادة الجلب بعد أي تعديل.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        setData(await fetcher());
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetcher();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: load, setData };
}

/**
 * تنفيذ عملية كتابة (إرسال نموذج) مع حالة الإرسال وأخطاء الحقول.
 */
export function useSubmit(action) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const submit = useCallback(
    async (...args) => {
      setSubmitting(true);
      setError(null);
      setFieldErrors({});
      setSuccess(null);

      try {
        const result = await action(...args);
        setSuccess(result?.message ?? true);
        return { ok: true, result };
      } catch (err) {
        const parsed = parseApiError(err);
        setError(parsed.message);
        setFieldErrors(parsed.errors);
        return { ok: false, error: parsed };
      } finally {
        setSubmitting(false);
      }
    },
    [action],
  );

  const reset = useCallback(() => {
    setError(null);
    setFieldErrors({});
    setSuccess(null);
  }, []);

  return { submit, submitting, error, fieldErrors, success, reset };
}
