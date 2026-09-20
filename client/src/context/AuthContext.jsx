import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [family, setFamily] = useState(null);
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest('/me');
      setUser(data.user);
      setMember(data.member);
      setFamily(data.family);
      setDepartment(data.department);
    } catch (err) {
      setUser(null);
      setMember(null);
      setFamily(null);
      setDepartment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (mobile, otp = '123456') => {
    const data = await apiRequest('/auth/verify', {
      method: 'POST',
      body: { mobile, otp }
    });
    await fetchProfile();
    return data;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    setUser(null);
    setMember(null);
    setFamily(null);
    setDepartment(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        member,
        family,
        department,
        loading,
        login,
        logout,
        refreshProfile: fetchProfile,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'admin',
        isHead: member?.family_role === 'head',
        canApply: member?.family_role === 'head' || member?.access === 'apply'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
