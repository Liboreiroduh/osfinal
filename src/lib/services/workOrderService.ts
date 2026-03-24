import { WorkOrder, WorkOrderStatus, TimeLogEntry } from '@/types';
import { mockWorkOrders, createDefaultChecklist } from '@/lib/mockData';
import { storageService } from './storageService';
import { expenseService } from './expenseService';
import { authService } from './authService';

const WORK_ORDERS_KEY = 'work_orders';
const WORK_ORDERS_VERSION_KEY = 'work_orders_version';
const WORK_ORDERS_VERSION = 3; // Incrementar quando precisar limpar dados antigos (mudança de estrutura de tipos)

class WorkOrderService {
  private workOrders: WorkOrder[] = [];

  constructor() {
    this.loadWorkOrders();
  }

  private loadWorkOrders(): void {
    // Check version and clear if outdated
    const storedVersion = storageService.get(WORK_ORDERS_VERSION_KEY);
    if (storedVersion !== WORK_ORDERS_VERSION) {
      storageService.set(WORK_ORDERS_KEY, []);
      storageService.set(WORK_ORDERS_VERSION_KEY, WORK_ORDERS_VERSION);
      this.workOrders = [];
      this.saveWorkOrders();
      return;
    }

    const stored = storageService.get(WORK_ORDERS_KEY);
    if (stored && Array.isArray(stored)) {
      this.workOrders = stored;
    } else {
      this.workOrders = [...mockWorkOrders];
      this.saveWorkOrders();
    }
  }

  private saveWorkOrders(): void {
    storageService.set(WORK_ORDERS_KEY, this.workOrders);
  }

  getAll(): WorkOrder[] {
    return [...this.workOrders];
  }

  getById(id: string): WorkOrder | undefined {
    return this.workOrders.find(wo => wo.id === id);
  }

  getByUserId(userId: string): WorkOrder[] {
    return this.workOrders.filter(wo => wo.assignedToUserId === userId);
  }

  getVisibleOrders(userId: string, isManager: boolean): WorkOrder[] {
    if (isManager) {
      return this.getAll();
    }
    return this.getByUserId(userId);
  }

  getByStatus(status: WorkOrderStatus): WorkOrder[] {
    return this.workOrders.filter(wo => wo.status === status);
  }

  getByDate(date: string): WorkOrder[] {
    return this.workOrders.filter(wo => wo.date === date);
  }

  getByMonth(year: number, month: number): WorkOrder[] {
    return this.workOrders.filter(wo => {
      const woDate = new Date(wo.date);
      return woDate.getFullYear() === year && woDate.getMonth() === month;
    });
  }

  create(data: Partial<WorkOrder>): WorkOrder {
    const newOrder: WorkOrder = {
      id: `os-${Date.now()}`,
      osNumber: `OS-${new Date().getFullYear()}-${String(this.workOrders.length + 1).padStart(3, '0')}`,
      type: data.type || 'INSTALACAO',
      // title REMOVIDO - era redundante com o tipo de serviço
      client: data.client || '',
      clientContact: data.clientContact || { name: '', phone: '' },
      address: data.address || '',
      structuredAddress: data.structuredAddress,
      description: data.description || '',
      status: 'PENDING',
      assignedToUserId: data.assignedToUserId || '',
      assignedToName: data.assignedToName || '',
      assignedToEmail: data.assignedToEmail || '',
      date: data.date || new Date().toISOString().split('T')[0],
      requiresEPI: data.requiresEPI ?? false,
      timeLogs: [],
      totalTime: 0,
      productDetails: data.productDetails,
      parts: [],
      maintenanceDetails: data.maintenanceDetails,
      trainingDetails: data.trainingDetails,
      photosBefore: [],
      photosDuring: [],
      photosAfter: [],
      videosBefore: [],
      videosDuring: [],
      videosAfter: [],
      checklist: createDefaultChecklist(),
      clientAccepted: false,
      expenseBudget: data.expenseBudget ?? 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.workOrders.push(newOrder);
    this.saveWorkOrders();
    return newOrder;
  }

  update(id: string, data: Partial<WorkOrder>): WorkOrder | null {
    const index = this.workOrders.findIndex(wo => wo.id === id);
    if (index === -1) return null;

    this.workOrders[index] = {
      ...this.workOrders[index],
      ...data,
      updatedAt: Date.now(),
    };

    this.saveWorkOrders();
    return this.workOrders[index];
  }

  delete(id: string): boolean {
    const index = this.workOrders.findIndex(wo => wo.id === id);
    if (index === -1) return false;

    this.workOrders.splice(index, 1);
    this.saveWorkOrders();
    return true;
  }

  // Timer and status operations
  startService(id: string, location?: string): WorkOrder | null {
    const order = this.getById(id);
    if (!order) return null;

    const timeLog: TimeLogEntry = {
      id: `tl-${Date.now()}`,
      type: 'START',
      timestamp: Date.now(),
      location,
    };

    return this.update(id, {
      status: 'IN_PROGRESS',
      timeLogs: [...order.timeLogs, timeLog],
    });
  }

  pauseService(id: string, reason: string, location?: string): WorkOrder | null {
    const order = this.getById(id);
    if (!order) return null;

    const timeLog: TimeLogEntry = {
      id: `tl-${Date.now()}`,
      type: 'PAUSE',
      timestamp: Date.now(),
      location,
      reason,
    };

    // Calculate time up to this point
    const totalTime = this.calculateTotalTime([...order.timeLogs, timeLog]);

    return this.update(id, {
      timeLogs: [...order.timeLogs, timeLog],
      totalTime,
    });
  }

  resumeService(id: string, location?: string): WorkOrder | null {
    const order = this.getById(id);
    if (!order) return null;

    const timeLog: TimeLogEntry = {
      id: `tl-${Date.now()}`,
      type: 'RESUME',
      timestamp: Date.now(),
      location,
    };

    return this.update(id, {
      timeLogs: [...order.timeLogs, timeLog],
    });
  }

  completeService(id: string): WorkOrder | null {
    const order = this.getById(id);
    if (!order) return null;

    const timeLog: TimeLogEntry = {
      id: `tl-${Date.now()}`,
      type: 'END',
      timestamp: Date.now(),
    };

    const totalTime = this.calculateTotalTime([...order.timeLogs, timeLog]);

    const updated = this.update(id, {
      status: 'COMPLETED',
      timeLogs: [...order.timeLogs, timeLog],
      totalTime,
    });

    // Create ExpenseGroup for the completed OS
    if (updated) {
      // Check if expense group already exists
      const existingGroup = expenseService.getExpenseGroupByWorkOrder(id);
      if (!existingGroup) {
        expenseService.createExpenseGroup({
          workOrderId: id,
          workOrderNumber: order.osNumber,
          technicianId: order.assignedToUserId,
          technicianName: order.assignedToName,
          budget: order.expenseBudget || 0,
          expenses: [],
        });
      }
    }

    return updated;
  }

  calculateTotalTime(timeLogs: TimeLogEntry[]): number {
    let total = 0;
    let startTime: number | null = null;

    for (const log of timeLogs) {
      if (log.type === 'START' || log.type === 'RESUME') {
        startTime = log.timestamp;
      } else if ((log.type === 'PAUSE' || log.type === 'END') && startTime) {
        total += log.timestamp - startTime;
        startTime = null;
      }
    }

    return Math.floor(total / 1000);
  }

  getActiveTime(order: WorkOrder): number {
    if (order.status !== 'IN_PROGRESS') return order.totalTime;

    const currentTotal = this.calculateTotalTime(order.timeLogs);
    const lastLog = order.timeLogs[order.timeLogs.length - 1];

    if (lastLog && (lastLog.type === 'START' || lastLog.type === 'RESUME')) {
      return currentTotal + Math.floor((Date.now() - lastLog.timestamp) / 1000);
    }

    return currentTotal;
  }

  // Statistics
  getStats(userId?: string): {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    blocked: number;
    totalAreaMonth: number;
  } {
    const orders = userId ? this.getByUserId(userId) : this.workOrders;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const completedThisMonth = orders.filter(wo => {
      if (wo.status !== 'COMPLETED' || !wo.productDetails) return false;
      const woDate = new Date(wo.date);
      return woDate.getMonth() === currentMonth && woDate.getFullYear() === currentYear;
    });

    const totalArea = completedThisMonth.reduce((sum, wo) => {
      const details = wo.productDetails;
      if (details) {
        return sum + (details.width * details.height);
      }
      return sum;
    }, 0);

    return {
      total: orders.length,
      pending: orders.filter(wo => wo.status === 'PENDING').length,
      inProgress: orders.filter(wo => wo.status === 'IN_PROGRESS').length,
      completed: orders.filter(wo => wo.status === 'COMPLETED').length,
      blocked: orders.filter(wo => wo.status === 'BLOCKED').length,
      totalAreaMonth: totalArea,
    };
  }

  getByTechnicianStats(): { name: string; count: number; status: WorkOrderStatus }[] {
    const stats: Record<string, Record<WorkOrderStatus, number>> = {};

    this.workOrders.forEach(wo => {
      if (!stats[wo.assignedToName]) {
        stats[wo.assignedToName] = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, BLOCKED: 0, CANCELLED: 0, REOPENED: 0 };
      }
      stats[wo.assignedToName][wo.status]++;
    });

    return Object.entries(stats).map(([name, counts]) => ({
      name,
      count: Object.values(counts).reduce((a, b) => a + b, 0),
      status: 'PENDING' as WorkOrderStatus,
    }));
  }

  // Reabrir OS (Supervisor ou Admin)
  reopenService(id: string, reason: string): WorkOrder | null {
    const order = this.getById(id);
    if (!order) return null;

    // Só pode reabrir OS concluída, cancelada ou rejeitada
    if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
      return null;
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) return null;

    return this.update(id, {
      status: 'REOPENED',
      reopenedBy: currentUser.userId,
      reopenedByName: currentUser.name,
      reopenedAt: Date.now(),
      reopenReason: reason,
    });
  }

  reset(): void {
    this.workOrders = [...mockWorkOrders];
    this.saveWorkOrders();
  }
}

export const workOrderService = new WorkOrderService();
