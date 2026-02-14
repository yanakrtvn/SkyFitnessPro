import { useState, useEffect } from 'react';
import { login as loginApi, register as registerApi } from '../api/auth/AuthService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token && email && email.includes('@') && email.includes('.')) {
    setUser({ email, token });
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
    }
      setLoading(false);
  }, []);

  const login = async (email, password) => {
    const result = await loginApi(email, password);
    
    if (result.success) {
    localStorage.setItem('token', result.token);
    localStorage.setItem('email', email);
    setUser({ email, token: result.token });
  }
  
  return result;
};

  const register = async (email, password) => {
    return await registerApi(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };
};