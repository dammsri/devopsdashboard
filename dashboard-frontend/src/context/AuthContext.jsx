import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authApi } from "../api/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, email, full_name, roles: [], permissions: [] }
  const [loading, setLoading] = useState(true); // Start as true for session restoration

  useEffect(() => {
    async function restoreSession() {
      try {
        const { data: me } = await authApi.me();
        setUser(me);
      } catch (err) {
        console.log("No active session confirmed.");
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (userId, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(userId, password);
      // Store access token in memory (not localStorage — prevents XSS token theft)
      window.__ACCESS_TOKEN__ = data.access_token;
      // Fetch full profile
      const { data: me } = await authApi.me();
      setUser(me);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    window.__ACCESS_TOKEN__ = null;
    setUser(null);
  }, []);

  const hasRole = useCallback((...roleNames) => {
    if (!user || !user.roles) return false;
    const userRoleNames = user.roles.map(r => r.name.toLowerCase());
    return roleNames.some(name => userRoleNames.includes(name.toLowerCase()));
  }, [user]);

  const hasPermission = useCallback((permissionSlug) => {
    if (!user || (!user.permissions && !user.roles)) return false;
    if (user.permissions && user.permissions.includes(permissionSlug)) return true;
    if (user.roles) {
      return user.roles.some(r => r.functionalities?.some(f => f.name === permissionSlug));
    }
    return false;
  }, [user]);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, hasRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
