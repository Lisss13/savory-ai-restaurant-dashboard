import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Organization } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  token: string | null;
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: { company: string; name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setOrganization: (organization: Organization) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { token, user, organization } = response.data;

          localStorage.setItem('token', token);

          set({
            token,
            user,
            organization,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { token, user, organization } = response.data;

          localStorage.setItem('token', token);

          set({
            token,
            user,
            organization,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          token: null,
          user: null,
          organization: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAdmin: user.role === 'admin' });
      },

      setOrganization: (organization: Organization) => {
        set({ organization });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        try {
          await authApi.checkToken();
          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
