import { ExpenseGroup, ExpenseItem, ExpenseType, ExpenseGroupStatus, Notification } from '@/types';
import { storageService } from './storageService';
import { authService } from './authService';

const EXPENSE_GROUPS_KEY = 'ledcollor_expense_groups';
const NOTIFICATIONS_KEY = 'ledcollor_notifications';
const EXPENSE_DATA_VERSION_KEY = 'ledcollor_expense_data_version';
const EXPENSE_DATA_VERSION = 4; // Incrementar quando precisar limpar dados antigos (mudança de estrutura)

class ExpenseService {
  private expenseGroups: ExpenseGroup[] = [];
  private notifications: Notification[] = [];

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    // Check data version and clear if outdated
    const storedVersion = storageService.get(EXPENSE_DATA_VERSION_KEY);
    if (storedVersion !== EXPENSE_DATA_VERSION) {
      // Clear old data and set new version
      storageService.set(EXPENSE_GROUPS_KEY, []);
      storageService.set(NOTIFICATIONS_KEY, []);
      storageService.set(EXPENSE_DATA_VERSION_KEY, EXPENSE_DATA_VERSION);
      this.expenseGroups = [];
      this.notifications = [];
      return;
    }

    const storedGroups = storageService.get(EXPENSE_GROUPS_KEY);
    if (storedGroups && Array.isArray(storedGroups)) {
      // Remove duplicates by ID and by workOrderId
      const groups = storedGroups as ExpenseGroup[];
      const seenIds = new Set<string>();
      const seenWorkOrderIds = new Set<string>();
      
      this.expenseGroups = groups.filter(group => {
        // Skip if ID already seen
        if (seenIds.has(group.id)) {
          return false;
        }
        // Skip if workOrderId already seen (keep first occurrence)
        if (seenWorkOrderIds.has(group.workOrderId)) {
          return false;
        }
        seenIds.add(group.id);
        seenWorkOrderIds.add(group.workOrderId);
        return true;
      });
      
      // Save cleaned data if duplicates were removed
      if (this.expenseGroups.length !== groups.length) {
        this.saveData();
      }
    }

    const storedNotifications = storageService.get(NOTIFICATIONS_KEY);
    if (storedNotifications && Array.isArray(storedNotifications)) {
      this.notifications = storedNotifications as Notification[];
    }
  }

  private saveData(): void {
    storageService.set(EXPENSE_GROUPS_KEY, this.expenseGroups);
    storageService.set(NOTIFICATIONS_KEY, this.notifications);
  }

  // ==================== EXPENSE GROUPS ====================

  // Get all expense groups
  getExpenseGroups(): ExpenseGroup[] {
    return this.expenseGroups;
  }

  // Get expense groups by status
  getExpenseGroupsByStatus(status: ExpenseGroupStatus): ExpenseGroup[] {
    return this.expenseGroups.filter(g => g.status === status);
  }

  // Get expense groups that need final approval (for Admin)
  getPendingFinalApprovals(): ExpenseGroup[] {
    return this.expenseGroups.filter(g => g.status === 'PENDING_FINAL');
  }

  // Get expense group by work order ID
  getExpenseGroupByWorkOrder(workOrderId: string): ExpenseGroup | undefined {
    return this.expenseGroups.find(g => g.workOrderId === workOrderId);
  }

  // Get expense group by ID
  getExpenseGroupById(id: string): ExpenseGroup | undefined {
    return this.expenseGroups.find(g => g.id === id);
  }

  // Update expense group
  updateExpenseGroup(id: string, data: Partial<ExpenseGroup>): ExpenseGroup | undefined {
    const group = this.getExpenseGroupById(id);
    if (!group) return undefined;
    
    Object.assign(group, data);
    this.saveData();
    
    return group;
  }

  // Generate unique ID
  private generateId(): string {
    return `expense-group-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Create expense group for a completed work order
  createExpenseGroup(data: {
    workOrderId: string;
    workOrderNumber: string;
    technicianId: string;
    technicianName: string;
    budget: number;
    expenses: ExpenseItem[];
  }): ExpenseGroup {
    // Check if group already exists for this work order
    const existingGroup = this.getExpenseGroupByWorkOrder(data.workOrderId);
    if (existingGroup) {
      return existingGroup;
    }

    const totalAmount = data.expenses.reduce((sum, e) => sum + e.amount, 0);
    
    const group: ExpenseGroup = {
      id: this.generateId(),
      workOrderId: data.workOrderId,
      workOrderNumber: data.workOrderNumber,
      technicianId: data.technicianId,
      technicianName: data.technicianName,
      budget: data.budget,
      totalAmount,
      status: 'DRAFT', // Técnico precisa lançar despesas e enviar para aprovação
      expenses: data.expenses,
      completedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.expenseGroups.push(group);
    this.saveData();

    return group;
  }

  // Submit expense group for approval (Technician)
  submitForApproval(groupId: string): { success: boolean; error?: string; group?: ExpenseGroup } {
    const group = this.getExpenseGroupById(groupId);
    
    if (!group) {
      return { success: false, error: 'Grupo de despesas não encontrado' };
    }

    if (group.status !== 'DRAFT') {
      return { success: false, error: 'Este grupo não está em rascunho' };
    }

    if (group.expenses.length === 0) {
      return { success: false, error: 'Adicione pelo menos uma despesa' };
    }

    group.status = 'PENDING';
    group.updatedAt = Date.now();
    this.saveData();

    return { success: true, group };
  }

  // Return expense group to draft (for technician to fix)
  returnToDraft(groupId: string): { success: boolean; error?: string; group?: ExpenseGroup } {
    const group = this.getExpenseGroupById(groupId);
    
    if (!group) {
      return { success: false, error: 'Grupo de despesas não encontrado' };
    }

    if (group.status !== 'PENDING' && group.status !== 'REJECTED') {
      return { success: false, error: 'Este grupo não pode ser devolvido para rascunho' };
    }

    group.status = 'DRAFT';
    group.rejectionReason = undefined; // Clear rejection reason when returning to draft
    group.updatedAt = Date.now();
    this.saveData();

    return { success: true, group };
  }

  // Approve expense group (Supervisor)
  approveExpenseGroup(
    groupId: string, 
    justification?: string
  ): { success: boolean; error?: string; group?: ExpenseGroup } {
    const group = this.getExpenseGroupById(groupId);
    
    if (!group) {
      return { success: false, error: 'Grupo de despesas não encontrado' };
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const exceedsBudget = group.totalAmount > group.budget && group.budget > 0;

    if (exceedsBudget) {
      // Need justification and will be pending final approval
      if (!justification || justification.trim() === '') {
        return { success: false, error: 'Justificativa obrigatória para despesas que excedem o orçamento' };
      }

      group.status = 'PENDING_FINAL';
      group.justification = justification;
      group.approvedBy = currentUser.userId;
      group.approvedByName = currentUser.name;
      group.approvedAt = Date.now();

      // Create notification for Admin
      this.createNotification({
        type: 'EXPENSE_APPROVAL_NEEDED',
        title: `OS ${group.workOrderNumber} aguarda aprovação final`,
        message: `Despesas excederam o orçamento em R$ ${(group.totalAmount - group.budget).toFixed(2)}`,
        workOrderId: group.workOrderId,
        workOrderNumber: group.workOrderNumber,
        expenseGroupId: group.id,
      });
    } else {
      // Within budget, approve directly
      group.status = 'APPROVED';
      group.approvedBy = currentUser.userId;
      group.approvedByName = currentUser.name;
      group.approvedAt = Date.now();
    }

    group.updatedAt = Date.now();
    this.saveData();

    return { success: true, group };
  }

  // Final approve expense group (Admin only)
  finalApproveExpenseGroup(groupId: string): { success: boolean; error?: string; group?: ExpenseGroup } {
    const group = this.getExpenseGroupById(groupId);
    
    if (!group) {
      return { success: false, error: 'Grupo de despesas não encontrado' };
    }

    if (group.status !== 'PENDING_FINAL') {
      return { success: false, error: 'Este grupo não está aguardando aprovação final' };
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser || !authService.canFinalApproveExpenses()) {
      return { success: false, error: 'Apenas administradores podem aprovar finais' };
    }

    group.status = 'FINAL_APPROVED';
    group.finalApprovedBy = currentUser.userId;
    group.finalApprovedByName = currentUser.name;
    group.finalApprovedAt = Date.now();
    group.updatedAt = Date.now();

    // Mark related notification as read
    this.markNotificationAsReadByExpenseGroup(groupId);

    this.saveData();

    return { success: true, group };
  }

  // Reject expense group (Supervisor ou Admin)
  rejectExpenseGroup(groupId: string, reason: string): { success: boolean; error?: string; group?: ExpenseGroup } {
    const group = this.getExpenseGroupById(groupId);
    
    if (!group) {
      return { success: false, error: 'Grupo de despesas não encontrado' };
    }

    // Supervisor pode rejeitar PENDING, Admin pode rejeitar PENDING_FINAL
    const canReject = group.status === 'PENDING' || group.status === 'PENDING_FINAL';
    if (!canReject) {
      return { success: false, error: 'Este grupo não pode ser rejeitado no status atual' };
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Supervisor pode rejeitar PENDING, Admin pode rejeitar PENDING_FINAL
    if (group.status === 'PENDING_FINAL' && !authService.canFinalApproveExpenses()) {
      return { success: false, error: 'Apenas administradores podem rejeitar despesas pendentes de aprovação final' };
    }

    group.status = 'REJECTED';
    group.rejectedBy = currentUser.userId;
    group.rejectedByName = currentUser.name;
    group.rejectedAt = Date.now();
    group.rejectionReason = reason;
    group.updatedAt = Date.now();

    // Mark related notification as read
    this.markNotificationAsReadByExpenseGroup(groupId);

    this.saveData();

    return { success: true, group };
  }

  // ==================== NOTIFICATIONS ====================

  getNotifications(): Notification[] {
    return this.notifications.sort((a, b) => b.createdAt - a.createdAt);
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read).sort((a, b) => b.createdAt - a.createdAt);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private createNotification(data: {
    type: Notification['type'];
    title: string;
    message: string;
    workOrderId?: string;
    workOrderNumber?: string;
    expenseGroupId?: string;
  }): Notification {
    const notification: Notification = {
      id: `notification-${Date.now()}`,
      type: data.type,
      title: data.title,
      message: data.message,
      workOrderId: data.workOrderId,
      workOrderNumber: data.workOrderNumber,
      expenseGroupId: data.expenseGroupId,
      read: false,
      createdAt: Date.now(),
    };

    this.notifications.unshift(notification);
    this.saveData();

    return notification;
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveData();
    }
  }

  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveData();
  }

  private markNotificationAsReadByExpenseGroup(expenseGroupId: string): void {
    this.notifications.forEach(n => {
      if (n.expenseGroupId === expenseGroupId) {
        n.read = true;
      }
    });
    this.saveData();
  }

  // ==================== HELPER FUNCTIONS ====================

  // Save data to storage (public for external access)
  saveData(): void {
    storageService.set(EXPENSE_GROUPS_KEY, this.expenseGroups);
    storageService.set(NOTIFICATIONS_KEY, this.notifications);
  }

  // Calculate expense percentage of budget
  calculatePercentage(total: number, budget: number): number {
    if (budget <= 0) return 0;
    return Math.round((total / budget) * 100);
  }

  // Check if expenses exceed budget
  exceedsBudget(total: number, budget: number): boolean {
    return budget > 0 && total > budget;
  }

  // Get remaining budget
  getRemainingBudget(total: number, budget: number): number {
    return budget - total;
  }

  // Format currency
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Reset all expense data
  reset(): void {
    this.expenseGroups = [];
    this.notifications = [];
    this.saveData();
  }
}

export const expenseService = new ExpenseService();
