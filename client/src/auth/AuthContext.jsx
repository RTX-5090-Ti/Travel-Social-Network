import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/auth.api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const nextUser = await authApi.bootstrapSession();
        if (!alive) return;
        setUser(nextUser);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setBootstrapping(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function login(payload) {
    const res = await authApi.login(payload);
    setUser(res.data.user || null);
    return res;
  }

  async function register(payload) {
    const res = await authApi.register(payload);
    return res;
  }

  async function reactivateAccount(payload) {
    const res = await authApi.reactivateAccount(payload);
    setUser(res.data.user || null);
    return res;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Bo qua loi logout phia server.
    } finally {
      setUser(null);
    }
  }

  const clearAuth = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      clearAuth,
      bootstrapping,
      isAuthenticated: !!user,
      login,
      register,
      reactivateAccount,
      logout,
    }),
    [user, bootstrapping, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
