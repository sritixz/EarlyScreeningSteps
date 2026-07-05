import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ess_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ess_token');
    if (!token) {
      setInitializing(false);
      return;
    }
    client
      .get('/auth/profile')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('ess_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('ess_token');
        localStorage.removeItem('ess_user');
        setUser(null);
      })
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (token, userObj) => {
    localStorage.setItem('ess_token', token);
    localStorage.setItem('ess_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const signup = async (payload) => {
    const res = await client.post('/auth/signup', payload);
    persist(res.data.token, res.data.user);
    return res.data.user;
  };

  const refreshProfile = async () => {
    const res = await client.get('/auth/profile');
    localStorage.setItem('ess_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('ess_token');
    localStorage.removeItem('ess_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, initializing, login, signup, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
