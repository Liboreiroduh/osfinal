'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { Vehicle, VehicleChecklist } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Truck,
  MapPin,
  User,
  Calendar,
  Gauge,
  Fuel,
  CheckCircle,
  AlertTriangle,
  Wrench,
  ArrowRight,
  History,
  Camera,
} from 'lucide-react';

export function FleetPage() {
  const { session, isManager, isSupervisor } = useAuthStore();
  // Supervisor tem as mesmas permissões de visualização que o Manager
  const canManage = isManager || isSupervisor;
  const { vehicles, checkOut, checkIn, sendToMaintenance, completeMaintenance } = useVehicleStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  // Check-out form
  const [checkOutForm, setCheckOutForm] = useState({
    odometer: 0,
    fuelLevel: 75,
    destination: '',
    tires: true,
    mirrors: true,
    lights: true,
    fluids: true,
    brakes: true,
    checklistSignature: false,
  });

  // Check-in form
  const [checkInForm, setCheckInForm] = useState({
    odometer: 0,
    fuelLevel: 50,
    reason: '',
    tires: true,
    mirrors: true,
    lights: true,
    fluids: true,
    brakes: true,
    checklistSignature: false,
  });

  // Maintenance form
  const [maintenanceForm, setMaintenanceForm] = useState({
    odometer: 0,
    cost: 0,
    provider: '',
    reason: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'IN_USE': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'MAINTENANCE': return 'bg-red-600/20 text-red-400 border-red-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponível';
      case 'IN_USE': return 'Em Uso';
      case 'MAINTENANCE': return 'Manutenção';
      default: return status;
    }
  };

  const handleCheckOut = () => {
    if (!selectedVehicle || !session) return;
    
    const checklist: VehicleChecklist = {
      tires: checkOutForm.tires,
      mirrors: checkOutForm.mirrors,
      lights: checkOutForm.lights,
      fluids: checkOutForm.fluids,
      brakes: checkOutForm.brakes,
    };

    checkOut(selectedVehicle.id, {
      userId: session.userId,
      userName: session.name,
      odometer: checkOutForm.odometer,
      fuelLevel: checkOutForm.fuelLevel,
      destination: checkOutForm.destination,
      photos: [],
      checklist,
      checklistSignature: checkOutForm.checklistSignature,
    });

    setShowCheckOutModal(false);
    setSelectedVehicle(null);
    resetCheckOutForm();
  };

  const handleCheckIn = () => {
    if (!selectedVehicle || !session) return;
    
    const checklist: VehicleChecklist = {
      tires: checkInForm.tires,
      mirrors: checkInForm.mirrors,
      lights: checkInForm.lights,
      fluids: checkInForm.fluids,
      brakes: checkInForm.brakes,
    };

    checkIn(selectedVehicle.id, {
      userId: session.userId,
      userName: session.name,
      odometer: checkInForm.odometer,
      fuelLevel: checkInForm.fuelLevel,
      reason: checkInForm.reason,
      photos: [],
      checklist,
      checklistSignature: checkInForm.checklistSignature,
    });

    setShowCheckInModal(false);
    setSelectedVehicle(null);
    resetCheckInForm();
  };

  const handleMaintenance = () => {
    if (!selectedVehicle || !session) return;

    sendToMaintenance(selectedVehicle.id, {
      userId: session.userId,
      userName: session.name,
      odometer: maintenanceForm.odometer,
      fuelLevel: 25,
      cost: maintenanceForm.cost,
      provider: maintenanceForm.provider,
      reason: maintenanceForm.reason,
      photos: [],
      checklist: { tires: true, mirrors: true, lights: true, fluids: true, brakes: true },
      checklistSignature: true,
    });

    setShowMaintenanceModal(false);
    setSelectedVehicle(null);
    resetMaintenanceForm();
  };

  const handleCompleteMaintenance = (vehicleId: string, odometer: number) => {
    completeMaintenance(vehicleId, odometer);
  };

  const resetCheckOutForm = () => {
    setCheckOutForm({
      odometer: 0,
      fuelLevel: 75,
      destination: '',
      tires: true,
      mirrors: true,
      lights: true,
      fluids: true,
      brakes: true,
      checklistSignature: false,
    });
  };

  const resetCheckInForm = () => {
    setCheckInForm({
      odometer: 0,
      fuelLevel: 50,
      reason: '',
      tires: true,
      mirrors: true,
      lights: true,
      fluids: true,
      brakes: true,
      checklistSignature: false,
    });
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      odometer: 0,
      cost: 0,
      provider: '',
      reason: '',
    });
  };

  const openCheckOut = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setCheckOutForm(prev => ({ ...prev, odometer: vehicle.lastOdometer }));
    setShowCheckOutModal(true);
  };

  const openCheckIn = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setCheckInForm(prev => ({ ...prev, odometer: vehicle.lastOdometer }));
    setShowCheckInModal(true);
  };

  const openMaintenance = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setMaintenanceForm(prev => ({ ...prev, odometer: vehicle.lastOdometer }));
    setShowMaintenanceModal(true);
  };

  const openHistory = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowHistoryModal(true);
  };

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    inUse: vehicles.filter(v => v.status === 'IN_USE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Frota</h1>
        <p className="text-gray-400 text-sm">Gestão de veículos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.available}</p>
            <p className="text-xs text-gray-500">Disponíveis</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.inUse}</p>
            <p className="text-xs text-gray-500">Em Uso</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.maintenance}</p>
            <p className="text-xs text-gray-500">Manutenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map(vehicle => (
          <Card key={vehicle.id} className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-base">{vehicle.model}</CardTitle>
                  <p className="text-gray-500 text-sm">{vehicle.plate}</p>
                </div>
                <Badge className={`${getStatusColor(vehicle.status)} border`}>
                  {getStatusLabel(vehicle.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Gauge className="w-4 h-4" />
                  <span>{vehicle.lastOdometer.toLocaleString()} km</span>
                </div>
                {vehicle.nextMaintenanceOdometer && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Wrench className="w-4 h-4" />
                    <span>{vehicle.nextMaintenanceOdometer.toLocaleString()} km</span>
                  </div>
                )}
              </div>

              {vehicle.status === 'IN_USE' && vehicle.currentDriver && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400">{vehicle.currentDriver}</span>
                </div>
              )}

              {vehicle.notes && (
                <p className="text-xs text-gray-500 line-clamp-2">{vehicle.notes}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {vehicle.status === 'AVAILABLE' && (
                  <Button
                    onClick={() => openCheckOut(vehicle)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Retirar
                  </Button>
                )}
                {vehicle.status === 'IN_USE' && (
                  <Button
                    onClick={() => openCheckIn(vehicle)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Devolver
                  </Button>
                )}
                {vehicle.status === 'MAINTENANCE' && canManage && (
                  <Button
                    onClick={() => handleCompleteMaintenance(vehicle.id, vehicle.lastOdometer + 100)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Concluir Manutenção
                  </Button>
                )}
                {canManage && vehicle.status !== 'MAINTENANCE' && (
                  <Button
                    onClick={() => openMaintenance(vehicle)}
                    variant="outline"
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                  >
                    <Wrench className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => openHistory(vehicle)}
                  variant="outline"
                  className="border-gray-700 text-gray-400 hover:bg-gray-800"
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Check-out Modal */}
      <Dialog open={showCheckOutModal} onOpenChange={setShowCheckOutModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Retirar Veículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-400 text-sm">
              {selectedVehicle?.model} - {selectedVehicle?.plate}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Hodômetro (KM)</Label>
                <Input
                  type="number"
                  value={checkOutForm.odometer}
                  onChange={(e) => setCheckOutForm(prev => ({ ...prev, odometer: parseInt(e.target.value) || 0 }))}
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Nível Combustível</Label>
                <p className="text-white text-center py-2">{checkOutForm.fuelLevel}%</p>
                <Slider
                  value={[checkOutForm.fuelLevel]}
                  onValueChange={(v) => setCheckOutForm(prev => ({ ...prev, fuelLevel: v[0] }))}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Destino *</Label>
              <Input
                value={checkOutForm.destination}
                onChange={(e) => setCheckOutForm(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="Local de destino"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Checklist</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(['tires', 'mirrors', 'lights', 'fluids', 'brakes'] as const).map(item => (
                  <label key={item} className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={checkOutForm[item]}
                      onChange={(e) => setCheckOutForm(prev => ({ ...prev, [item]: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    {item === 'tires' ? 'Pneus' :
                     item === 'mirrors' ? 'Espelhos' :
                     item === 'lights' ? 'Luzes' :
                     item === 'fluids' ? 'Fluidos' : 'Freios'}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-gray-300 text-sm">
              <input
                type="checkbox"
                checked={checkOutForm.checklistSignature}
                onChange={(e) => setCheckOutForm(prev => ({ ...prev, checklistSignature: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-800"
              />
              Declaro que verifiquei as condições do veículo
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckOutModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={!checkOutForm.destination || !checkOutForm.checklistSignature}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar Retirada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in Modal */}
      <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Devolver Veículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-400 text-sm">
              {selectedVehicle?.model} - {selectedVehicle?.plate}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Hodômetro (KM)</Label>
                <Input
                  type="number"
                  value={checkInForm.odometer}
                  onChange={(e) => setCheckInForm(prev => ({ ...prev, odometer: parseInt(e.target.value) || 0 }))}
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Nível Combustível</Label>
                <p className="text-white text-center py-2">{checkInForm.fuelLevel}%</p>
                <Slider
                  value={[checkInForm.fuelLevel]}
                  onValueChange={(v) => setCheckInForm(prev => ({ ...prev, fuelLevel: v[0] }))}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Observações (avarias, problemas)</Label>
              <Textarea
                value={checkInForm.reason}
                onChange={(e) => setCheckInForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Descreva qualquer problema encontrado..."
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Checklist</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(['tires', 'mirrors', 'lights', 'fluids', 'brakes'] as const).map(item => (
                  <label key={item} className="flex items-center gap-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={checkInForm[item]}
                      onChange={(e) => setCheckInForm(prev => ({ ...prev, [item]: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    {item === 'tires' ? 'Pneus' :
                     item === 'mirrors' ? 'Espelhos' :
                     item === 'lights' ? 'Luzes' :
                     item === 'fluids' ? 'Fluidos' : 'Freios'}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-gray-300 text-sm">
              <input
                type="checkbox"
                checked={checkInForm.checklistSignature}
                onChange={(e) => setCheckInForm(prev => ({ ...prev, checklistSignature: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-800"
              />
              Declaro que o veículo está em condições adequadas
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckInModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckIn}
              disabled={!checkInForm.checklistSignature}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirmar Devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance Modal */}
      <Dialog open={showMaintenanceModal} onOpenChange={setShowMaintenanceModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Enviar para Manutenção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-400 text-sm">
              {selectedVehicle?.model} - {selectedVehicle?.plate}
            </p>

            <div className="space-y-2">
              <Label className="text-gray-300">Hodômetro (KM)</Label>
              <Input
                type="number"
                value={maintenanceForm.odometer}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, odometer: parseInt(e.target.value) || 0 }))}
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Custo Estimado (R$)</Label>
              <Input
                type="number"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Fornecedor/Oficina</Label>
              <Input
                value={maintenanceForm.provider}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, provider: e.target.value }))}
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Motivo</Label>
              <Textarea
                value={maintenanceForm.reason}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Descreva o motivo da manutenção..."
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMaintenanceModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMaintenance}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Histórico do Veículo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-400 text-sm mb-4">
              {selectedVehicle?.model} - {selectedVehicle?.plate}
            </p>
            
            {selectedVehicle?.checks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum registro encontrado.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedVehicle?.checks.map(check => (
                  <div key={check.id} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${
                        check.type === 'CHECK_OUT' ? 'bg-blue-600/20 text-blue-400' :
                        check.type === 'CHECK_IN' ? 'bg-emerald-600/20 text-emerald-400' :
                        'bg-red-600/20 text-red-400'
                      } border-0`}>
                        {check.type === 'CHECK_OUT' ? 'Saída' :
                         check.type === 'CHECK_IN' ? 'Devolução' : 'Manutenção'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(check.timestamp).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-white">{check.userName}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                      <span>{check.odometer.toLocaleString()} km</span>
                      <span>{check.fuelLevel}% combustível</span>
                    </div>
                    {check.destination && (
                      <p className="text-xs text-gray-500 mt-1">Destino: {check.destination}</p>
                    )}
                    {check.reason && (
                      <p className="text-xs text-gray-500 mt-1">{check.reason}</p>
                    )}
                    {check.cost && (
                      <p className="text-xs text-red-400 mt-1">Custo: R$ {check.cost.toFixed(2)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHistoryModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
