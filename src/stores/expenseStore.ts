import { create } from 'zustand';
import { ExpenseGroup, ExpenseItem, ExpenseType, ExpenseGroupStatus } from '@/types';
import { expenseService, authService } from '@/lib/services';
import { useWorkOrderStore } from './workOrderStore';

interface ExpenseState {
  expenseGroups: ExpenseGroup[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadExpenseGroups: () => void;
  syncWithWorkOrders: () => void;
  createExpenseGroup: (workOrderId: string) => { success: boolean; error?: string };
  submitForApproval: (groupId: string) => { success: boolean; error?: string };
  approveExpenseGroup: (groupId: string, justification?: string) => { success: boolean; error?: string };
  finalApproveExpenseGroup: (groupId: string) => { success: boolean; error?: string };
  rejectExpenseGroup: (groupId: string, reason: string) => { success: boolean; error?: string };
  returnToDraft: (groupId: string) => { success: boolean; error?: string };
  getPendingFinalCount: () => number;
  addExpense: (groupId: string, expense: Omit<ExpenseItem, 'id' | 'expenseGroupId'>) => void;
  removeExpense: (groupId: string, expenseId: string) => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenseGroups: [],
  isLoading: false,
  error: null,

  loadExpenseGroups: () => {
    const groups = expenseService.getExpenseGroups();
    set({ expenseGroups: groups, isLoading: false, error: null });
  },

  // Sync completed work orders with expense groups
  syncWithWorkOrders: () => {
    const workOrders = useWorkOrderStore.getState().workOrders;
    const completedOrders = workOrders.filter(wo => wo.status === 'COMPLETED');
    
    completedOrders.forEach(wo => {
      const existingGroup = expenseService.getExpenseGroupByWorkOrder(wo.id);
      if (!existingGroup) {
        // Create expense group for completed OS
        expenseService.createExpenseGroup({
          workOrderId: wo.id,
          workOrderNumber: wo.osNumber,
          technicianId: wo.assignedToUserId,
          technicianName: wo.assignedToName,
          budget: wo.expenseBudget || 0,
          expenses: [],
        });
      }
    });
    
    // Reload groups after sync
    const groups = expenseService.getExpenseGroups();
    set({ expenseGroups: groups });
  },

  createExpenseGroup: (workOrderId: string) => {
    const workOrders = useWorkOrderStore.getState().workOrders;
    const workOrder = workOrders.find(wo => wo.id === workOrderId);
    
    if (!workOrder) {
      return { success: false, error: 'OS não encontrada' };
    }

    if (workOrder.status !== 'COMPLETED') {
      return { success: false, error: 'Apenas OSs concluídas podem ter despesas processadas' };
    }

    // Check if expense group already exists
    const existingGroup = expenseService.getExpenseGroupByWorkOrder(workOrderId);
    if (existingGroup) {
      return { success: true }; // Already exists
    }

    // Convert old expenses to new format
    const newExpenses: ExpenseItem[] = workOrder.expenses.map((exp, index) => ({
      id: `expense-${Date.now()}-${index}`,
      expenseGroupId: '',
      type: mapCategoryToType(exp.category),
      customType: exp.category === 'OUTROS' ? exp.description : undefined,
      description: exp.description,
      amount: exp.amount,
      receiptPhoto: exp.receiptImage || '',
      date: exp.date,
      createdBy: workOrder.assignedToUserId,
      createdByName: workOrder.assignedToName,
    }));

    const group = expenseService.createExpenseGroup({
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.osNumber,
      technicianId: workOrder.assignedToUserId,
      technicianName: workOrder.assignedToName,
      budget: workOrder.expenseBudget || 0,
      expenses: newExpenses,
    });

    // Update group ID in expenses
    group.expenses = group.expenses.map(e => ({ ...e, expenseGroupId: group.id }));
    expenseService.saveData();

    set(state => ({
      expenseGroups: [...state.expenseGroups, group],
    }));

    return { success: true };
  },

  approveExpenseGroup: (groupId: string, justification?: string) => {
    const result = expenseService.approveExpenseGroup(groupId, justification);
    
    if (result.success && result.group) {
      set(state => ({
        expenseGroups: state.expenseGroups.map(g => 
          g.id === groupId ? result.group! : g
        ),
      }));
    }

    return result;
  },

  finalApproveExpenseGroup: (groupId: string) => {
    const result = expenseService.finalApproveExpenseGroup(groupId);
    
    if (result.success && result.group) {
      set(state => ({
        expenseGroups: state.expenseGroups.map(g => 
          g.id === groupId ? result.group! : g
        ),
      }));
    }

    return result;
  },

  rejectExpenseGroup: (groupId: string, reason: string) => {
    const result = expenseService.rejectExpenseGroup(groupId, reason);
    
    if (result.success && result.group) {
      set(state => ({
        expenseGroups: state.expenseGroups.map(g => 
          g.id === groupId ? result.group! : g
        ),
      }));
    }

    return result;
  },

  getPendingFinalCount: () => {
    return get().expenseGroups.filter(g => g.status === 'PENDING_FINAL').length;
  },

  addExpense: (groupId: string, expenseData: Omit<ExpenseItem, 'id' | 'expenseGroupId'>) => {
    const group = get().expenseGroups.find(g => g.id === groupId);
    if (!group) return;
    
    // Can only add if status is DRAFT
    if (group.status !== 'DRAFT') return;
    
    const newExpense: ExpenseItem = {
      id: `expense-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      expenseGroupId: groupId,
      ...expenseData,
    };
    
    const updatedGroup = expenseService.updateExpenseGroup(groupId, {
      expenses: [...group.expenses, newExpense],
      totalAmount: group.totalAmount + expenseData.amount,
      updatedAt: Date.now(),
    });
    
    if (updatedGroup) {
      set(state => ({
        expenseGroups: state.expenseGroups.map(g => 
          g.id === groupId ? updatedGroup : g
        ),
      }));
    }
  },

  removeExpense: (groupId: string, expenseId: string) => {
    const group = get().expenseGroups.find(g => g.id === groupId);
    if (!group) return;
    
    // Can only remove if status is DRAFT
    if (group.status !== 'DRAFT') return;
    
    const expense = group.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    const updatedGroup = expenseService.updateExpenseGroup(groupId, {
      expenses: group.expenses.filter(e => e.id !== expenseId),
      totalAmount: group.totalAmount - expense.amount,
      updatedAt: Date.now(),
    });
    
    if (updatedGroup) {
      set(state => ({
        expenseGroups: state.expenseGroups.map(g => 
          g.id === groupId ? updatedGroup : g
        ),
      }));
    }
  },

  submitForApproval: (groupId: string) => {
    const group = get().expenseGroups.find(g => g.id === groupId);
    if (!group) return { success: false, error: 'Grupo não encontrado' };
    
    // Can only submit if status is DRAFT
    if (group.status !== 'DRAFT') {
      return { success: false, error: 'Este grupo não pode ser enviado para aprovação' };
    }
    
    // Check if has at least one expense
    if (group.expenses.length === 0) {
      return { success: false, error: 'Adicione pelo menos uma despesa antes de enviar' };
    }
    
    const result = expenseService.submitForApproval(groupId);
    
    if (result.success && result.group) {
      set(state => ({
        expenseGroups: state.expenseGroups.map(g => 
          g.id === groupId ? result.group! : g
        ),
      }));
    }
    
    return result;
  },

  returnToDraft: (groupId: string) => {
    const group = get().expenseGroups.find(g => g.id === groupId);
    if (!group) return { success: false, error: 'Grupo não encontrado' };
    
    // Can only return to draft if status is PENDING
    if (group.status !== 'PENDING' && group.status !== 'REJECTED') {
      return { success: false, error: 'Este grupo não pode ser devolvido' };
    }
    
    const result = expenseService.returnToDraft(groupId);
    
    if (result.success && result.group) {
      set(state => ({
        expenseGroups: state.expenseGroups.map(g => 
          g.id === groupId ? result.group! : g
        ),
      }));
    }
    
    return result;
  },
}));

// Helper function to map old category to new type
function mapCategoryToType(category: string): ExpenseType {
  const mapping: Record<string, ExpenseType> = {
    'COMBUSTIVEL': 'GASOLINA',
    'ALIMENTACAO': 'ALIMENTACAO',
    'HOSPEDAGEM': 'HOSPEDAGEM',
    'PEDAGIO': 'TRANSPORTE',
    'MATERIAL': 'OUTROS',
    'OUTROS': 'OUTROS',
  };
  return mapping[category] || 'OUTROS';
}
