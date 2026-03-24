import { create } from 'zustand';
import { Session } from '@/types';
import { authService } from '@/lib/services';

interface AuthState {
  session: Session | null;
  isAuthenticated: boolean;
  isManager: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isInstaller: boolean;
  canEdit: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  initAuth: () => void;
  canApproveExpenses: () => boolean;
  canFinalApproveExpenses: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isAuthenticated: false,
  isManager: false,
  isAdmin: false,
  isSupervisor: false,
  isInstaller: false,
  canEdit: false,

  login: async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      set({
        session: result.user,
        isAuthenticated: true,
        isManager: result.user.role === 'MANAGER',
        isAdmin: result.user.permission === 'ADMIN',
        isSupervisor: result.user.permission === 'SUPERVISOR',
        isInstaller: result.user.role === 'INSTALLER',
        canEdit: result.user.permission === 'ADMIN' || result.user.permission === 'EDITOR' || result.user.permission === 'SUPERVISOR',
      });
      return { success: true };
    }
    return { success: false, error: result.error };
  },

  logout: () => {
    authService.logout();
    set({
      session: null,
      isAuthenticated: false,
      isManager: false,
      isAdmin: false,
      isSupervisor: false,
      isInstaller: false,
      canEdit: false,
    });
  },

  initAuth: () => {
    const session = authService.getSession();
    if (session) {
      set({
        session,
        isAuthenticated: true,
        isManager: session.role === 'MANAGER',
        isAdmin: session.permission === 'ADMIN',
        isSupervisor: session.permission === 'SUPERVISOR',
        isInstaller: session.role === 'INSTALLER',
        canEdit: session.permission === 'ADMIN' || session.permission === 'EDITOR' || session.permission === 'SUPERVISOR',
      });
    }
  },

  canApproveExpenses: () => {
    const { session } = get();
    if (!session) return false;
    return session.permission === 'ADMIN' || session.permission === 'SUPERVISOR';
  },

  canFinalApproveExpenses: () => {
    const { session } = get();
    if (!session) return false;
    return session.permission === 'ADMIN';
  },
}));
