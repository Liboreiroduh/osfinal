import { Vehicle, VehicleCheck, VehicleStatus, VehicleChecklist } from '@/types';
import { mockVehicles } from '@/lib/mockData';
import { storageService } from './storageService';

const VEHICLES_KEY = 'vehicles';

class VehicleService {
  private vehicles: Vehicle[] = [];

  constructor() {
    this.loadVehicles();
  }

  private loadVehicles(): void {
    const stored = storageService.get(VEHICLES_KEY);
    if (stored && Array.isArray(stored)) {
      this.vehicles = stored;
    } else {
      this.vehicles = [...mockVehicles];
      this.saveVehicles();
    }
  }

  private saveVehicles(): void {
    storageService.set(VEHICLES_KEY, this.vehicles);
  }

  getAll(): Vehicle[] {
    return [...this.vehicles];
  }

  getById(id: string): Vehicle | undefined {
    return this.vehicles.find(v => v.id === id);
  }

  getByStatus(status: VehicleStatus): Vehicle[] {
    return this.vehicles.filter(v => v.status === status);
  }

  create(data: Partial<Vehicle>): Vehicle {
    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      model: data.model || '',
      plate: data.plate || '',
      status: 'AVAILABLE',
      lastOdometer: data.lastOdometer || 0,
      nextMaintenanceOdometer: data.nextMaintenanceOdometer,
      notes: data.notes,
      checks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.vehicles.push(newVehicle);
    this.saveVehicles();
    return newVehicle;
  }

  update(id: string, data: Partial<Vehicle>): Vehicle | null {
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index === -1) return null;

    this.vehicles[index] = {
      ...this.vehicles[index],
      ...data,
      updatedAt: Date.now(),
    };

    this.saveVehicles();
    return this.vehicles[index];
  }

  delete(id: string): boolean {
    const index = this.vehicles.findIndex(v => v.id === id);
    if (index === -1) return false;

    this.vehicles.splice(index, 1);
    this.saveVehicles();
    return true;
  }

  // Check-out operation
  checkOut(vehicleId: string, data: {
    userId: string;
    userName: string;
    odometer: number;
    fuelLevel: number;
    destination: string;
    photos: string[];
    video?: string;
    checklist: VehicleChecklist;
    checklistSignature: boolean;
  }): Vehicle | null {
    const vehicle = this.getById(vehicleId);
    if (!vehicle || vehicle.status !== 'AVAILABLE') return null;

    const check: VehicleCheck = {
      id: `vc-${Date.now()}`,
      vehicleId,
      userId: data.userId,
      userName: data.userName,
      type: 'CHECK_OUT',
      timestamp: Date.now(),
      odometer: data.odometer,
      fuelLevel: data.fuelLevel,
      destination: data.destination,
      photos: data.photos,
      video: data.video,
      checklist: data.checklist,
      checklistSignature: data.checklistSignature,
    };

    const updatedVehicle = this.update(vehicleId, {
      status: 'IN_USE',
      currentDriver: data.userName,
      currentDriverId: data.userId,
      lastOdometer: data.odometer,
      checks: [...vehicle.checks, check],
    });

    return updatedVehicle;
  }

  // Check-in operation
  checkIn(vehicleId: string, data: {
    userId: string;
    userName: string;
    odometer: number;
    fuelLevel: number;
    reason?: string;
    photos: string[];
    video?: string;
    checklist: VehicleChecklist;
    checklistSignature: boolean;
  }): Vehicle | null {
    const vehicle = this.getById(vehicleId);
    if (!vehicle || vehicle.status !== 'IN_USE') return null;

    const check: VehicleCheck = {
      id: `vc-${Date.now()}`,
      vehicleId,
      userId: data.userId,
      userName: data.userName,
      type: 'CHECK_IN',
      timestamp: Date.now(),
      odometer: data.odometer,
      fuelLevel: data.fuelLevel,
      reason: data.reason,
      photos: data.photos,
      video: data.video,
      checklist: data.checklist,
      checklistSignature: data.checklistSignature,
    };

    const updatedVehicle = this.update(vehicleId, {
      status: 'AVAILABLE',
      currentDriver: undefined,
      currentDriverId: undefined,
      lastOdometer: data.odometer,
      checks: [...vehicle.checks, check],
    });

    return updatedVehicle;
  }

  // Maintenance operations
  sendToMaintenance(vehicleId: string, data: {
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
  }): Vehicle | null {
    const vehicle = this.getById(vehicleId);
    if (!vehicle) return null;

    const check: VehicleCheck = {
      id: `vc-${Date.now()}`,
      vehicleId,
      userId: data.userId,
      userName: data.userName,
      type: 'MAINTENANCE',
      timestamp: Date.now(),
      odometer: data.odometer,
      fuelLevel: data.fuelLevel,
      cost: data.cost,
      provider: data.provider,
      budgetPhoto: data.budgetPhoto,
      maintenanceDate: data.maintenanceDate,
      reason: data.reason,
      photos: data.photos,
      checklist: data.checklist,
      checklistSignature: data.checklistSignature,
    };

    const updatedVehicle = this.update(vehicleId, {
      status: 'MAINTENANCE',
      lastOdometer: data.odometer,
      checks: [...vehicle.checks, check],
    });

    return updatedVehicle;
  }

  completeMaintenance(vehicleId: string, odometer: number): Vehicle | null {
    return this.update(vehicleId, {
      status: 'AVAILABLE',
      lastOdometer: odometer,
    });
  }

  getCheckHistory(vehicleId: string): VehicleCheck[] {
    const vehicle = this.getById(vehicleId);
    return vehicle?.checks || [];
  }

  getStats(): {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
  } {
    return {
      total: this.vehicles.length,
      available: this.getByStatus('AVAILABLE').length,
      inUse: this.getByStatus('IN_USE').length,
      maintenance: this.getByStatus('MAINTENANCE').length,
    };
  }

  getVehiclesInRoute(): Vehicle[] {
    return this.getByStatus('IN_USE');
  }

  reset(): void {
    this.vehicles = [...mockVehicles];
    this.saveVehicles();
  }
}

export const vehicleService = new VehicleService();
