import { User, Session, UserRole, UserPermission } from '@/types';
import { mockUsers } from '@/lib/mockData';
import { storageService } from './storageService';

const SESSION_KEY = 'ledcollor_session';
const USERS_KEY = 'ledcollor_users';
const USERS_VERSION_KEY = 'ledcollor_users_version';
const USERS_VERSION = '2025-01-20-v4'; // Atualizar esta versão quando mudar os dados mock

class AuthService {
  private session: Session | null = null;
  private users: User[] = [];

  constructor() {
    this.loadSession();
    this.loadUsers();
  }

  private loadSession(): void {
    const stored = storageService.get(SESSION_KEY);
    if (stored) {
      this.session = stored as Session;
    }
  }

  private loadUsers(): void {
    const storedVersion = storageService.get(USERS_VERSION_KEY);
    const stored = storageService.get(USERS_KEY);
    
    // Se a versão mudou ou não há dados salvos, recarrega do mock
    if (storedVersion !== USERS_VERSION || !stored || !Array.isArray(stored)) {
      this.users = [...mockUsers];
      storageService.set(USERS_KEY, this.users);
      storageService.set(USERS_VERSION_KEY, USERS_VERSION);
      // Limpa a sessão antiga também para forçar novo login
      storageService.remove(SESSION_KEY);
      this.session = null;
    } else {
      this.users = stored as User[];
    }
  }

  private saveUsers(): void {
    storageService.set(USERS_KEY, this.users);
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string; user?: Session }> {
    const user = this.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { success: false, error: 'E-mail ou senha incorretos' };
    }

    if (!user.active) {
      return { success: false, error: 'Usuário inativo. Contate o administrador.' };
    }

    const session: Session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permission: user.permission,
      avatar: user.avatar,
      loginAt: Date.now(),
    };

    this.session = session;
    storageService.set(SESSION_KEY, session);
    
    return { success: true, user: session };
  }

  logout(): void {
    this.session = null;
    storageService.remove(SESSION_KEY);
  }

  getSession(): Session | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  // Role checks
  isManager(): boolean {
    return this.session?.role === 'MANAGER';
  }

  isSupervisor(): boolean {
    return this.session?.role === 'SUPERVISOR';
  }

  isInstaller(): boolean {
    return this.session?.role === 'INSTALLER';
  }

  // Permission checks
  isAdmin(): boolean {
    return this.session?.permission === 'ADMIN';
  }

  isSupervisorPermission(): boolean {
    return this.session?.permission === 'SUPERVISOR';
  }

  canEdit(): boolean {
    const permission = this.session?.permission;
    return permission === 'ADMIN' || permission === 'SUPERVISOR' || permission === 'EDITOR';
  }

  // Expense approval permissions
  canApproveExpenses(): boolean {
    // Supervisor and Admin can approve expenses within budget
    const permission = this.session?.permission;
    return permission === 'ADMIN' || permission === 'SUPERVISOR';
  }

  canFinalApproveExpenses(): boolean {
    // Only Admin can give final approval for expenses exceeding budget
    return this.session?.permission === 'ADMIN';
  }

  // Check if user can edit OS (only if PENDING)
  canEditOS(osStatus: string): boolean {
    if (osStatus !== 'PENDING') return false;
    return this.canEdit();
  }

  // Check if user can cancel OS (only if IN_PROGRESS)
  canCancelOS(osStatus: string): boolean {
    if (osStatus !== 'IN_PROGRESS') return false;
    const permission = this.session?.permission;
    return permission === 'ADMIN' || permission === 'SUPERVISOR';
  }

  getCurrentUserId(): string | null {
    return this.session?.userId ?? null;
  }

  getCurrentUser(): Session | null {
    return this.session;
  }

  getCurrentUserName(): string {
    return this.session?.name ?? '';
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getActiveUsers(): User[] {
    return this.users.filter(u => u.active);
  }

  getInstallers(): User[] {
    return this.users.filter(u => u.role === 'INSTALLER' && u.active);
  }

  getManagers(): User[] {
    return this.users.filter(u => u.role === 'MANAGER' && u.active);
  }

  getSupervisors(): User[] {
    return this.users.filter(u => u.role === 'SUPERVISOR' && u.active);
  }

  // Get users that can approve expenses
  getApprovers(): User[] {
    return this.users.filter(u => 
      u.active && (u.permission === 'ADMIN' || u.permission === 'SUPERVISOR')
    );
  }

  // Create new user
  createUser(data: { 
    name: string; 
    email: string; 
    password: string; 
    role: UserRole; 
    permission: UserPermission 
  }): { success: boolean; error?: string; user?: User } {
    // Check if email already exists
    if (this.users.some(u => u.email === data.email)) {
      return { success: false, error: 'E-mail já cadastrado' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      permission: data.permission,
      active: true,
      createdAt: Date.now(),
    };

    this.users.push(newUser);
    this.saveUsers();

    return { success: true, user: newUser };
  }

  // Update user data
  updateUser(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): { success: boolean; error?: string; user?: User } {
    const index = this.users.findIndex(u => u.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== this.users[index].email) {
      if (this.users.some(u => u.email === data.email)) {
        return { success: false, error: 'E-mail já cadastrado' };
      }
    }

    this.users[index] = {
      ...this.users[index],
      ...data,
    };

    this.saveUsers();

    return { success: true, user: this.users[index] };
  }

  // Change password
  changePassword(id: string, newPassword: string): { success: boolean; error?: string } {
    const index = this.users.findIndex(u => u.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (newPassword.length < 4) {
      return { success: false, error: 'Senha deve ter pelo menos 4 caracteres' };
    }

    this.users[index].password = newPassword;
    this.saveUsers();

    return { success: true };
  }

  // Toggle user active status
  toggleUserActive(id: string): { success: boolean; error?: string; active?: boolean } {
    const user = this.users.find(u => u.id === id);
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    user.active = !user.active;
    this.saveUsers();

    return { success: true, active: user.active };
  }

  // Delete user
  deleteUser(id: string): { success: boolean; error?: string } {
    const index = this.users.findIndex(u => u.id === id);
    
    if (index === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Prevent deleting the last admin
    const admins = this.users.filter(u => u.permission === 'ADMIN' && u.active);
    if (admins.length === 1 && admins[0].id === id) {
      return { success: false, error: 'Não é possível excluir o último administrador' };
    }

    this.users.splice(index, 1);
    this.saveUsers();

    return { success: true };
  }
}

export const authService = new AuthService();
