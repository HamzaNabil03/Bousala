import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "@/api/endpoints";
import { getToken, sendKeepalive, setToken } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  /*
   * خروجٌ صريح يختلف عن جلسة انتهت: الوجهة المحفوظة (next) تخصّ من كان
   * داخلاً، ولا يصحّ أن يهبط عليها من يدخل بعده — وقد يكون حساباً آخر.
   */
  const [signedOut, setSignedOut] = useState(false);
  const userId = user?.id;

  // استعادة الجلسة عند فتح التطبيق إن وُجد توكن محفوظ
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    authApi
      .me()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        setToken(null);
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) return undefined;

    const heartbeat = () => authApi.presenceHeartbeat().catch(() => undefined);
    const markOffline = () => sendKeepalive("/presence/offline");

    heartbeat();
    const interval = window.setInterval(heartbeat, 20_000);
    window.addEventListener("pagehide", markOffline);
    window.addEventListener("pageshow", heartbeat);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", markOffline);
      window.removeEventListener("pageshow", heartbeat);
    };
  }, [userId]);

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload);
    setToken(data.token);
    setUser(data.user);
    setSignedOut(false);
    return data.user;
  }, []);

  /*
   * التسجيل لا يفتح جلسة: الخادم يرسل رمز تأكيد إلى البريد ويعيد
   * requires_verification، والجلسة تبدأ بعد نجاح التأكيد.
   */
  const register = useCallback(async (payload) => authApi.register(payload), []);

  /** تبنّي جلسة سلّمها الخادم بعد تأكيد البريد */
  const adoptSession = useCallback((token, nextUser) => {
    setToken(token);
    setUser(nextUser);
    setSignedOut(false);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setToken(null);
    setUser(null);
    setSignedOut(true);
  }, []);

  /** تحديث بيانات المستخدم بعد تعديل الإعدادات أو الملف */
  const refresh = useCallback(async () => {
    const data = await authApi.me();
    setUser(data);
    return data;
  }, []);

  /** إنهاء الجلسة محلياً دون نداء الخادم (بعد حذف الحساب مثلاً) */
  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setSignedOut(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.is_admin_level),
      isExpert: user?.role === "expert",
      signedOut,
      login,
      register,
      adoptSession,
      logout,
      refresh,
      setUser,
      clearSession,
    }),
    [user, loading, signedOut, login, register, adoptSession, logout, refresh, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider");
  }

  return context;
}
