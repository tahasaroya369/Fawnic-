import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '../types.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  avatarUploading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  setSession: (token: string, user: User) => void;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; avatar?: string }) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; error?: string; avatar?: string }>;
  removeAvatar: () => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fawnic_token');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);

  const refreshUser = useCallback(async () => {
    let savedToken: string | null = null;
    try {
      savedToken = localStorage.getItem('fawnic_token');
    } catch {
      savedToken = null;
    }
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(savedToken);
      } else {
        try {
          localStorage.removeItem('fawnic_token');
        } catch {}
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Error verifying auth session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('fawnic_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid administrator email or password.' };
      }

      localStorage.setItem('fawnic_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid administrator email or password.' };
    }
  };

  const setSession = (token: string, user: User) => {
    localStorage.setItem('fawnic_token', token);
    setToken(token);
    setUser(user);
  };

  const register = async (formData: { name: string; email: string; phone: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      localStorage.setItem('fawnic_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration network error' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('fawnic_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; phone?: string; avatar?: string }) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error };
      setUser(result.user);
      return { success: true, user: result.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const uploadAvatar = async (file: File): Promise<{ success: boolean; error?: string; avatar?: string }> => {
    if (!token) return { success: false, error: 'Please sign in to update your profile photo.' };

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return { success: false, error: 'Please upload a valid image file (JPG, JPEG, PNG, or WebP).' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'Profile image size must be below 5MB.' };
    }

    setAvatarUploading(true);
    try {
      // Process and square crop/resize on client canvas to ensure optimal dimensions & performance
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const targetDim = 400; // Optimal 400x400 square avatar
            canvas.width = targetDim;
            canvas.height = targetDim;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas rendering error'));
              return;
            }

            // Calculate center square crop
            const minSide = Math.min(img.width, img.height);
            const sx = (img.width - minSide) / 2;
            const sy = (img.height - minSide) / 2;

            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          };
          img.onerror = () => reject(new Error('Failed to decode image'));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: dataUrl }),
      });

      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to save profile avatar.' };
      }

      setUser(result.user);
      return { success: true, avatar: result.user.avatar };
    } catch (err: any) {
      return { success: false, error: err.message || 'Image upload error' };
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async (): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };
    setAvatarUploading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: '' }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Failed to remove avatar.' };
      }
      setUser(result.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error removing avatar' };
    } finally {
      setAvatarUploading(false);
    }
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        avatarUploading,
        login,
        adminLogin,
        setSession,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
