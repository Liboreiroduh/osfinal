import { create } from 'zustand';
import { Vehicle, VehicleChecklist } from '@/types';
import { vehicleService } from '@/lib/services';

interface VehicleState {
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  loading: boolean;
  loadVehicles: () => void;
  loadVehicle: (id: string) => Vehicle | undefined;
  createVehicle: (data: Partial<Vehicle>) => Vehicle;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Vehicle | null;
  deleteVehicle: (id: string) => boolean;
  checkOut: (vehicleId: string, data: {
    userId: string;
    userName: string;
    odometer: number;
    fuelLevel: number;
    destination: string;
    photos: string[];
    video?: string;
    checklist: VehicleChecklist;
    checklistSignature: boolean;
  }) => Vehicle | null;
  checkIn: (vehicleId: string, data: {
    userId: string;
    userName: string;
    odometer: number;
    fuelLevel: number;
    reason?: string;
    photos: string[];
    video?: string;
    checklist: VehicleChecklist;
    checklistSignature: boolean;
  }) => Vehicle | null;
  sendToMaintenance: (vehicleId: string, data: {
    userId: string;
    userName: string;
    odometer: number;
    fuelLevel: number;
    cost?: number;
    provider?: string;
    budgetPhoto?: string;
    maintenanceDate?: string;
    reason?: string;
    photos: string[];
    checklist: VehicleChecklist;
    checklistSignature: boolean;
  }) => Vehicle | null;
  completeMaintenance: (vehicleId: string, odometer: number) => Vehicle | null;
  getStats: () => ReturnType<typeof vehicleService.getStats>;
  reset: () => void;
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  currentVehicle: null,
  loading: false,

  loadVehicles: () => {
    const vehicles = vehicleService.getAll();
    set({ vehicles, loading: false });
  },

  loadVehicle: (id: string) => {
    const vehicle = vehicleService.getById(id);
    set({ currentVehicle: vehicle || null });
    return vehicle;
  },

  createVehicle: (data: Partial<Vehicle>) => {
    const newVehicle = vehicleService.create(data);
    set(state => ({ vehicles: [...state.vehicles, newVehicle] }));
    return newVehicle;
  },

  updateVehicle: (id: string, data: Partial<Vehicle>) => {
    const updated = vehicleService.update(id, data);
    if (updated) {
      set(state => ({
        vehicles: state.vehicles.map(v => v.id === id ? updated : v),
        currentVehicle: state.currentVehicle?.id === id ? updated : state.currentVehicle,
      }));
    }
    return updated;
  },

  deleteVehicle: (id: string) => {
    const result = vehicleService.delete(id);
    if (result) {
      set(state => ({
        vehicles: state.vehicles.filter(v => v.id !== id),
        currentVehicle: state.currentVehicle?.id === id ? null : state.currentVehicle,
      }));
    }
    return result;
  },

  checkOut: (vehicleId: string, data) => {
    const updated = vehicleService.checkOut(vehicleId, data);
    if (updated) {
      set(state => ({
        vehicles: state.vehicles.map(v => v.id === vehicleId ? updated : v),
      }));
    }
    return updated;
  },

  checkIn: (vehicleId: string, data) => {
    const updated = vehicleService.checkIn(vehicleId, data);
    if (updated) {
      set(state => ({
        vehicles: state.vehicles.map(v => v.id === vehicleId ? updated : v),
      }));
    }
    return updated;
  },

  sendToMaintenance: (vehicleId: string, data) => {
    const updated = vehicleService.sendToMaintenance(vehicleId, data);
    if (updated) {
      set(state => ({
        vehicles: state.vehicles.map(v => v.id === vehicleId ? updated : v),
      }));
    }
    return updated;
  },

  completeMaintenance: (vehicleId: string, odometer: number) => {
    const updated = vehicleService.completeMaintenance(vehicleId, odometer);
    if (updated) {
      set(state => ({
        vehicles: state.vehicles.map(v => v.id === vehicleId ? updated : v),
      }));
    }
    return updated;
  },

  getStats: () => {
    return vehicleService.getStats();
  },

  reset: () => {
    vehicleService.reset();
    set({ vehicles: vehicleService.getAll(), currentVehicle: null });
  },
}));
