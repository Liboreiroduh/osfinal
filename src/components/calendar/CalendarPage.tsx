'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { authService } from '@/lib/services';
import { WorkOrder, ServiceType } from '@/types';
import { serviceTypes, statusLabels } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cepService } from '@/lib/services';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  User,
  Clock,
  Wrench,
} from 'lucide-react';

interface CalendarPageProps {
  onSelectOrder: (orderId: string) => void;
}

export function CalendarPage({ onSelectOrder }: CalendarPageProps) {
  const { isManager, isSupervisor, session } = useAuthStore();
  const { workOrders, createWorkOrder, loadWorkOrders } = useWorkOrderStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewOSModal, setShowNewOSModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingCEP, setLoadingCEP] = useState(false);
  
  const [newOS, setNewOS] = useState({
    type: 'INSTALACAO' as ServiceType,
    client: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    zipCode: '',
    state: '',
    city: '',
    addressLine1: '',
    district: '',
    description: '',
    assignedToUserId: '',
    requiresEPI: true,
    pixelPitch: '',
    width: '',
    height: '',
    // Novos campos
    moduleType: 'MODULO' as 'MODULO' | 'GABINETE',
    moduleQuantity: '',
    processorBrand: '',
    processorModel: '',
    processorQuantity: '',
    // Budget de despesas
    expenseBudget: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const ordersByDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    workOrders.forEach(wo => {
      if (!map[wo.date]) {
        map[wo.date] = [];
      }
      map[wo.date].push(wo);
    });
    return map;
  }, [workOrders]);

  const installers = authService.getInstallers();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    if (!isManager && !isSupervisor) return;
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setNewOS(prev => ({ ...prev }));
    setShowNewOSModal(true);
  };

  const handleSearchCEP = async () => {
    if (!newOS.zipCode) return;
    
    setLoadingCEP(true);
    const result = await cepService.searchByCEP(newOS.zipCode);
    
    if (result.success && result.data) {
      setNewOS(prev => ({
        ...prev,
        state: result.data!.state,
        city: result.data!.city,
        addressLine1: result.data!.addressLine1,
        district: result.data!.district,
      }));
    }
    setLoadingCEP(false);
  };

  const handleSubmit = () => {
    if (!selectedDate || !newOS.client || !newOS.assignedToUserId) return;

    const installer = authService.getUserById(newOS.assignedToUserId);
    
    createWorkOrder({
      type: newOS.type,
      client: newOS.client,
      clientContact: {
        name: newOS.clientName,
        phone: newOS.clientPhone,
        email: newOS.clientEmail || undefined,
      },
      address: `${newOS.addressLine1}, ${newOS.district}, ${newOS.city} - ${newOS.state}, ${newOS.zipCode}`,
      structuredAddress: {
        state: newOS.state,
        city: newOS.city,
        addressLine1: newOS.addressLine1,
        district: newOS.district,
        zipCode: newOS.zipCode,
      },
      description: newOS.description,
      assignedToUserId: newOS.assignedToUserId,
      assignedToName: installer?.name || '',
      assignedToEmail: installer?.email || '',
      date: selectedDate,
      requiresEPI: newOS.requiresEPI,
      expenseBudget: parseFloat(newOS.expenseBudget) || 0,
      productDetails: {
        type: 'IN',
        pixelPitch: newOS.pixelPitch,
        width: parseFloat(newOS.width) || 0,
        height: parseFloat(newOS.height) || 0,
        moduleType: newOS.moduleType,
        moduleQuantity: parseInt(newOS.moduleQuantity) || undefined,
        processorBrand: newOS.processorBrand || undefined,
        processorModel: newOS.processorModel || undefined,
        processorQuantity: parseInt(newOS.processorQuantity) || undefined,
      },
    });

    // Reset form
    setNewOS({
      type: 'INSTALACAO',
      client: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      zipCode: '',
      state: '',
      city: '',
      addressLine1: '',
      district: '',
      description: '',
      assignedToUserId: '',
      requiresEPI: true,
      pixelPitch: '',
      width: '',
      height: '',
      moduleType: 'MODULO',
      moduleQuantity: '',
      processorBrand: '',
      processorModel: '',
      processorQuantity: '',
      expenseBudget: '',
    });
    
    setShowNewOSModal(false);
    setSelectedDate(null);
    
    if (session) {
      loadWorkOrders(session.userId, session.role === 'MANAGER');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-emerald-500';
      case 'BLOCKED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[100px] lg:min-h-[120px] bg-gray-900/30" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const orders = ordersByDate[dateStr] || [];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`min-h-[100px] lg:min-h-[120px] p-2 border border-gray-800 transition-colors ${
            (isManager || isSupervisor) ? 'cursor-pointer hover:bg-gray-800/50' : ''
          } ${isToday ? 'bg-emerald-900/20 border-emerald-700' : 'bg-[#111827]'}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-emerald-400' : 'text-gray-400'}`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {orders.slice(0, 3).map(order => (
              <div
                key={order.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOrder(order.id);
                }}
                className="flex items-center gap-1 p-1 rounded bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer text-xs truncate"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(order.status)}`} />
                <span className="text-gray-300 truncate">{order.osNumber}</span>
              </div>
            ))}
            {orders.length > 3 && (
              <div className="text-xs text-gray-500 pl-1">+{orders.length - 3} mais</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  // Supervisor tem as mesmas permissões de visualização que o Manager
  const canManage = isManager || isSupervisor;

  if (!canManage) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-gray-400">Apenas gerentes e supervisores podem acessar o calendário.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Calendário</h1>
        <Button
          onClick={() => {
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setShowNewOSModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova OS
        </Button>
      </div>

      {/* Calendar */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevMonth}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-white capitalize">{monthName}</CardTitle>
            <Button
              variant="ghost"
              onClick={nextMonth}
              className="text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-px mb-px">
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-900/50">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-800">
            {renderCalendarDays()}
          </div>
        </CardContent>
      </Card>

      {/* New OS Modal */}
      <Dialog open={showNewOSModal} onOpenChange={setShowNewOSModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Nova Ordem de Serviço - {selectedDate}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Type and Title */}
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo de Serviço</Label>
              <Select value={newOS.type} onValueChange={(v) => setNewOS(prev => ({ ...prev, type: v as ServiceType }))}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  {serviceTypes.map(st => (
                    <SelectItem key={st.value} value={st.value} className="text-white hover:bg-gray-800">
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label className="text-gray-300">Cliente</Label>
              <Input
                value={newOS.client}
                onChange={(e) => setNewOS(prev => ({ ...prev, client: e.target.value }))}
                placeholder="Nome do cliente/empresa"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Contato</Label>
              <Input
                value={newOS.clientName}
                onChange={(e) => setNewOS(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Nome do contato"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Telefone</Label>
              <Input
                value={newOS.clientPhone}
                onChange={(e) => setNewOS(prev => ({ ...prev, clientPhone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">E-mail</Label>
              <Input
                type="email"
                value={newOS.clientEmail}
                onChange={(e) => setNewOS(prev => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="email@exemplo.com"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2 space-y-2">
              <Label className="text-gray-300">CEP</Label>
              <div className="flex gap-2">
                <Input
                  value={newOS.zipCode}
                  onChange={(e) => setNewOS(prev => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="00000-000"
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
                <Button
                  onClick={handleSearchCEP}
                  disabled={loadingCEP}
                  variant="outline"
                  className="border-gray-700 text-gray-300"
                >
                  {loadingCEP ? 'Buscando...' : 'Buscar CEP'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Estado</Label>
              <Input
                value={newOS.state}
                onChange={(e) => setNewOS(prev => ({ ...prev, state: e.target.value }))}
                placeholder="SP"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Cidade</Label>
              <Input
                value={newOS.city}
                onChange={(e) => setNewOS(prev => ({ ...prev, city: e.target.value }))}
                placeholder="São Paulo"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Endereço</Label>
              <Input
                value={newOS.addressLine1}
                onChange={(e) => setNewOS(prev => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="Rua, número"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Bairro</Label>
              <Input
                value={newOS.district}
                onChange={(e) => setNewOS(prev => ({ ...prev, district: e.target.value }))}
                placeholder="Bairro"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            {/* Product Details */}
            <div className="space-y-2">
              <Label className="text-gray-300">Pixel Pitch</Label>
              <Input
                value={newOS.pixelPitch}
                onChange={(e) => setNewOS(prev => ({ ...prev, pixelPitch: e.target.value }))}
                placeholder="Ex: P3, P4, P5"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Dimensões (L x H metros)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newOS.width}
                  onChange={(e) => setNewOS(prev => ({ ...prev, width: e.target.value }))}
                  placeholder="Largura"
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
                <Input
                  type="number"
                  value={newOS.height}
                  onChange={(e) => setNewOS(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="Altura"
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Módulos/Gabinetes */}
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo</Label>
              <Select value={newOS.moduleType} onValueChange={(v) => setNewOS(prev => ({ ...prev, moduleType: v as 'MODULO' | 'GABINETE' }))}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  <SelectItem value="MODULO" className="text-white">Módulo</SelectItem>
                  <SelectItem value="GABINETE" className="text-white">Gabinete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Quantidade de Módulos/Gabinetes</Label>
              <Input
                type="number"
                value={newOS.moduleQuantity}
                onChange={(e) => setNewOS(prev => ({ ...prev, moduleQuantity: e.target.value }))}
                placeholder="Quantidade"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            {/* Processadora */}
            <div className="md:col-span-2 pt-2 border-t border-gray-800">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Processadora</h4>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Marca</Label>
              <Input
                value={newOS.processorBrand}
                onChange={(e) => setNewOS(prev => ({ ...prev, processorBrand: e.target.value }))}
                placeholder="Ex: NovaStar, Linsn"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Modelo</Label>
              <Input
                value={newOS.processorModel}
                onChange={(e) => setNewOS(prev => ({ ...prev, processorModel: e.target.value }))}
                placeholder="Ex: VX4S, TS802"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Quantidade</Label>
              <Input
                type="number"
                value={newOS.processorQuantity}
                onChange={(e) => setNewOS(prev => ({ ...prev, processorQuantity: e.target.value }))}
                placeholder="Qtd"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            {/* Budget de Despesas */}
            <div className="md:col-span-2 pt-2 border-t border-gray-800">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Orçamento de Despesas</h4>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Budget para Despesas (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newOS.expenseBudget}
                onChange={(e) => setNewOS(prev => ({ ...prev, expenseBudget: e.target.value }))}
                placeholder="0.00"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">Valor máximo que o técnico pode gastar durante a execução</p>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label className="text-gray-300">Descrição</Label>
              <Textarea
                value={newOS.description}
                onChange={(e) => setNewOS(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detalhes do serviço..."
                className="bg-[#0a0a0a] border-gray-700 text-white min-h-[80px]"
              />
            </div>

            {/* Assignment */}
            <div className="space-y-2">
              <Label className="text-gray-300">Atribuir a</Label>
              <Select value={newOS.assignedToUserId} onValueChange={(v) => setNewOS(prev => ({ ...prev, assignedToUserId: v }))}>
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  {installers.map(inst => (
                    <SelectItem key={inst.id} value={inst.id} className="text-white hover:bg-gray-800">
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-center justify-between">
              <Label className="text-gray-300">Exige EPI</Label>
              <Switch
                checked={newOS.requiresEPI}
                onCheckedChange={(checked) => setNewOS(prev => ({ ...prev, requiresEPI: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewOSModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!newOS.client || !newOS.assignedToUserId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Criar OS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
