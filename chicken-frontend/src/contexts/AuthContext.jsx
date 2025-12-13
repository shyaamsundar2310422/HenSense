import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, registerRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user: { username } -- token is separate string
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cf_user') || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(
    () => localStorage.getItem('cf_token') || ''
  );

  useEffect(() => {
    if (user) localStorage.setItem('cf_user', JSON.stringify(user));
    else localStorage.removeItem('cf_user');
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem('cf_token', token);
    else localStorage.removeItem('cf_token');
  }, [token]);

  // base URL computed once (can be overridden with localStorage/cf_api_url)
  const apiBase =
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
    localStorage.getItem('cf_api_url') ||
    'http://127.0.0.1:8000';

  // Login: call the /auth/login backend. Backend must return { user, token }.
  const login = async (username, password) => {
    const data = await loginRequest(username, password, apiBase);
    if (!data) throw new Error('Invalid login response');
    // accept either { user, token } or { token } or { access_token }
    const u =
      data.user || (data.username ? { username: data.username } : { username });
    const t = data.token || data.access_token || '';
    setUser(u);
    setToken(t);
    return data;
  };

  const register = async (username, password) => {
    const data = await registerRequest(username, password, apiBase);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken('');
    // keep local history under username key; switching will be handled by App
  };

  const value = useMemo(
    () => ({ user, token, login, register, logout, apiBase }),
    [user, token, apiBase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
