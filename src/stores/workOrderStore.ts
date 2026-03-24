import { create } from 'zustand';
import { WorkOrder, WorkOrderStatus } from '@/types';
import { workOrderService } from '@/lib/services';

interface WorkOrderState {
  workOrders: WorkOrder[];
  currentOrder: WorkOrder | null;
  loading: boolean;
  filters: {
    status: WorkOrderStatus | 'ALL';
    search: string;
    userId: string;
  };
  loadWorkOrders: (userId?: string, isManager?: boolean) => void;
  loadWorkOrder: (id: string) => WorkOrder | undefined;
  createWorkOrder: (data: Partial<WorkOrder>) => WorkOrder;
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => WorkOrder | null;
  deleteWorkOrder: (id: string) => boolean;
  startService: (id: string, location?: string) => void;
  pauseService: (id: string, reason: string, location?: string) => void;
  resumeService: (id: string, location?: string) => void;
  completeService: (id: string) => void;
  reopenService: (id: string, reason: string) => WorkOrder | null;
  setFilters: (filters: Partial<WorkOrderState['filters']>) => void;
  getFilteredOrders: () => WorkOrder[];
  getStats: (userId?: string) => ReturnType<typeof workOrderService.getStats>;
  reset: () => void;
}

export const useWorkOrderStore = create<WorkOrderState>((set, get) => ({
  workOrders: [],
  currentOrder: null,
  loading: false,
  filters: {
    status: 'ALL',
    search: '',
    userId: '',
  },

  loadWorkOrders: (userId?: string, isManager?: boolean) => {
    const orders = workOrderService.getVisibleOrders(userId || '', isManager || false);
    set({ workOrders: orders, loading: false });
  },

  loadWorkOrder: (id: string) => {
    const order = workOrderService.getById(id);
    set({ currentOrder: order || null });
    return order;
  },

  createWorkOrder: (data: Partial<WorkOrder>) => {
    const newOrder = workOrderService.create(data);
    set(state => ({ workOrders: [...state.workOrders, newOrder] }));
    return newOrder;
  },

  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => {
    const updated = workOrderService.update(id, data);
    if (updated) {
      set(state => ({
        workOrders: state.workOrders.map(wo => wo.id === id ? updated : wo),
        currentOrder: state.currentOrder?.id === id ? updated : state.currentOrder,
      }));
    }
    return updated;
  },

  deleteWorkOrder: (id: string) => {
    const result = workOrderService.delete(id);
    if (result) {
      set(state => ({
        workOrders: state.workOrders.filter(wo => wo.id !== id),
        currentOrder: state.currentOrder?.id === id ? null : state.currentOrder,
      }));
    }
    return result;
  },

  startService: (id: string, location?: string) => {
    const updated = workOrderService.startService(id, location);
    if (updated) {
      set(state => ({
        workOrders: state.workOrders.map(wo => wo.id === id ? updated : wo),
        currentOrder: state.currentOrder?.id === id ? updated : state.currentOrder,
      }));
    }
  },

  pauseService: (id: string, reason: string, location?: string) => {
    const updated = workOrderService.pauseService(id, reason, location);
    if (updated) {
      set(state => ({
        workOrders: state.workOrders.map(wo => wo.id === id ? updated : wo),
        currentOrder: state.currentOrder?.id === id ? updated : state.currentOrder,
      }));
    }
  },

  resumeService: (id: string, location?: string) => {
    const updated = workOrderService.resumeService(id, location);
    if (updated) {
      set(state => ({
        workOrders: state.workOrders.map(wo => wo.id === id ? updated : wo),
        currentOrder: state.currentOrder?.id === id ? updated : state.currentOrder,
      }));
    }
  },

  completeService: (id: string) => {
    const updated = workOrderService.completeService(id);
    if (updated) {
      set(state => ({
        workOrders: state.workOrders.map(wo => wo.id === id ? updated : wo),
        currentOrder: state.currentOrder?.id === id ? updated : state.currentOrder,
      }));
    }
  },

  reopenService: (id: string, reason: string) => {
    const updated = workOrderService.reopenService(id, reason);
    if (updated) {
      set(state => ({
        workOrders: state.workOrders.map(wo => wo.id === id ? updated : wo),
        currentOrder: state.currentOrder?.id === id ? updated : state.currentOrder,
      }));
    }
    return updated;
  },

  setFilters: (filters: Partial<WorkOrderState['filters']>) => {
    set(state => ({ filters: { ...state.filters, ...filters } }));
  },

  getFilteredOrders: () => {
    const { workOrders, filters } = get();
    let filtered = [...workOrders];

    if (filters.status !== 'ALL') {
      filtered = filtered.filter(wo => wo.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(wo =>
        wo.client.toLowerCase().includes(search) ||
        wo.osNumber.toLowerCase().includes(search) ||
        wo.description.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  getStats: (userId?: string) => {
    return workOrderService.getStats(userId);
  },

  reset: () => {
    workOrderService.reset();
    set({ workOrders: workOrderService.getAll(), currentOrder: null });
  },
}));
