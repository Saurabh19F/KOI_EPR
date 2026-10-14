import { create } from 'zustand';
import { authApi, UserProfile } from '@/lib/api';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: UserProfile | null) => void;
}

// Transform API response to UserProfile format
function transformUserProfile(apiUser: any): UserProfile {
  // Backend returns: { userId, email, name, roles: ['ADMIN'], permissions: [...] }
  // Or: { sub, email, name, roles: [...], permissions: [...] }
  const userId = apiUser.userId || apiUser.user_id || apiUser.sub;
  const roles = apiUser.roles || [];
  const roleStr = Array.isArray(roles) ? roles[0] || 'USER' : roles;

  return {
    userId,
    email: apiUser.email,
    name: apiUser.name,
    phone: apiUser.phone || '',
    avatar: apiUser.avatar || '',
    preferences: apiUser.preferences || {},
    companyId: apiUser.companyId || apiUser.company_id || '',
    role: roleStr,
    roles: roles.map((r: string) => ({ roleId: '', roleName: r, roleCode: r })),
    permissions: apiUser.permissions || [],
    isActive: true,
    isSuperAdmin: apiUser.isSuperAdmin || apiUser.is_super_admin || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { accessToken, refreshToken, user } = response.data;
      if (response.data.twoFactorRequired) {
        throw new Error('Two-factor verification is required');
      }
      if (!accessToken || !refreshToken || !user) {
        throw new Error('Login response did not include tokens');
      }

      // Store tokens in sessionStorage for tab isolation
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
      }

      // Transform and set user
      const userData = transformUserProfile(user);
      console.log('LOGIN SUCCESS:', userData.name, '| Role:', userData.role);

      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.log('LOGIN FAILED:', error.response?.data?.message || error.message);
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
      }
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;

    const token = sessionStorage.getItem('accessToken');
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!token && !refreshToken) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.getProfile();
      const userData = transformUserProfile(response.data);
      console.log('CHECKAUTH SUCCESS:', userData.name, '| Role:', userData.role);

      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const status = error.response?.status;
      console.log('CHECKAUTH FAILED:', status || error.message);
      if (status === 429 && token) {
        set(() => ({
          isAuthenticated: true,
          isLoading: false,
        }));
        return;
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user: UserProfile | null) => set({ user, isAuthenticated: !!user }),
}));
