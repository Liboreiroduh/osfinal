'use client';

import { useState, useMemo, useCallback } from 'react';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { WorkOrder, WorkOrderStatus } from '@/types';
import { statusLabels, serviceTypes } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Play,
  CheckCircle,
  AlertTriangle,
  Wrench,
} from 'lucide-react';

interface TechnicianCalendarViewProps {
  onSelectOrder: (orderId: string) => void;
}

const getStatusIcon = (status: WorkOrderStatus) => {
  switch (status) {
    case 'PENDING': return <Clock className="w-4 h-4" />;
    case 'IN_PROGRESS': return <Play className="w-4 h-4" />;
    case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
    case 'BLOCKED': return <AlertTriangle className="w-4 h-4" />;
  }
};

const getStatusColor = (status: WorkOrderStatus) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-500';
    case 'IN_PROGRESS': return 'bg-blue-500';
    case 'COMPLETED': return 'bg-emerald-500';
    case 'BLOCKED': return 'bg-red-500';
  }
};

const getStatusBgColor = (status: WorkOrderStatus) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-600/20 border-yellow-600/30 text-yellow-400';
    case 'IN_PROGRESS': return 'bg-blue-600/20 border-blue-600/30 text-blue-400';
    case 'COMPLETED': return 'bg-emerald-600/20 border-emerald-600/30 text-emerald-400';
    case 'BLOCKED': return 'bg-red-600/20 border-red-600/30 text-red-400';
  }
};

const getServiceTypeLabel = (type: string) => {
  return serviceTypes.find(st => st.value === type)?.label || type;
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

export function TechnicianCalendarView({ onSelectOrder }: TechnicianCalendarViewProps) {
  const { workOrders } = useWorkOrderStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedDateOrders, setSelectedDateOrders] = useState<WorkOrder[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'day'>('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Filtrar OSs
  const filteredOrders = useMemo(() => {
    let orders = [...workOrders];
    
    if (statusFilter !== 'ALL') {
      orders = orders.filter(wo => wo.status === statusFilter);
    }
    
    if (typeFilter !== 'ALL') {
      orders = orders.filter(wo => wo.type === typeFilter);
    }
    
    return orders;
  }, [workOrders, statusFilter, typeFilter]);

  // Agrupar por data
  const ordersByDate = useMemo(() => {
    const map: Record<string, WorkOrder[]> = {};
    filteredOrders.forEach(wo => {
      if (!map[wo.date]) {
        map[wo.date] = [];
      }
      map[wo.date].push(wo);
    });
    return map;
  }, [filteredOrders]);

  // Estatísticas
  const stats = useMemo(() => ({
    total: filteredOrders.length,
    pending: filteredOrders.filter(wo => wo.status === 'PENDING').length,
    inProgress: filteredOrders.filter(wo => wo.status === 'IN_PROGRESS').length,
    completed: filteredOrders.filter(wo => wo.status === 'COMPLETED').length,
  }), [filteredOrders]);

  const prevMonth = useCallback(() => {
    setCurrentDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const nextMonth = useCallback(() => {
    setCurrentDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleDayClick = useCallback((day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const orders = ordersByDate[dateStr] || [];
    
    if (orders.length > 0) {
      setSelectedDate(dateStr);
      setSelectedDateOrders(orders);
    }
  }, [year, month, ordersByDate]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const today = new Date().toISOString().split('T')[0];

  // Renderizar dias do calendário
  const renderCalendarDays = () => {
    const days = [];
    
    // Células vazias antes do primeiro dia
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] bg-gray-900/30" />
      );
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const orders = ordersByDate[dateStr] || [];
      const isToday = today === dateStr;
      const hasOrders = orders.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(day)}
          className={`min-h-[80px] sm:min-h-[100px] p-1.5 sm:p-2 border transition-all cursor-pointer ${
            isToday 
              ? 'bg-emerald-900/30 border-emerald-600/50' 
              : hasOrders 
                ? 'bg-[#1a1a1a] border-gray-700 hover:border-emerald-600/50' 
                : 'bg-[#111827] border-gray-800 hover:border-gray-700'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-emerald-400' : 'text-gray-400'}`}>
            {day}
          </div>
          
          {hasOrders && (
            <div className="space-y-0.5 overflow-hidden">
              {orders.slice(0, 2).map(order => (
                <div
                  key={order.id}
                  className="flex items-center gap-1 p-1 rounded text-xs truncate"
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusColor(order.status)}`} />
                  <span className="text-gray-300 truncate text-[10px] sm:text-xs">{order.osNumber}</span>
                </div>
              ))}
              {orders.length > 2 && (
                <div className="text-[10px] text-gray-500 pl-1">+{orders.length - 2}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // Renderizar lista do dia selecionado
  const renderDayList = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const orders = ordersByDate[dateStr] || [];
      const isToday = today === dateStr;
      
      days.push(
        <div key={dateStr} className="mb-4">
          <div className={`text-sm font-medium mb-2 pb-1 border-b ${
            isToday ? 'text-emerald-400 border-emerald-600/30' : 'text-gray-400 border-gray-800'
          }`}>
            {day.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
          </div>
          
          {orders.length === 0 ? (
            <p className="text-sm text-gray-600 py-2">Nenhuma OS</p>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <Card
                  key={order.id}
                  onClick={() => onSelectOrder(order.id)}
                  className="bg-[#1a1a1a] border-gray-800 hover:border-emerald-600/50 cursor-pointer transition-colors"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusBgColor(order.status)} border`}>
                          {order.osNumber}
                        </Badge>
                        <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                          {getServiceTypeLabel(order.type)}
                        </Badge>
                      </div>
                      <div className={`p-1 rounded ${getStatusBgColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                      </div>
                    </div>
                    
                    <h3 className="font-medium text-white mb-1 line-clamp-1">{order.client}</h3>
                    <p className="text-sm text-gray-400 mb-2">{order.description || 'Sem descrição'}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{order.structuredAddress?.city || order.address}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Minhas OS</h1>
          <p className="text-gray-400 text-sm">Visualize suas ordens de serviço</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'bg-emerald-600' : 'border-gray-700 text-gray-400'}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('day')}
            className={viewMode === 'day' ? 'bg-emerald-600' : 'border-gray-700 text-gray-400'}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as WorkOrderStatus | 'ALL')}>
          <SelectTrigger className="w-full sm:w-44 bg-[#111827] border-gray-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800">
            <SelectItem value="ALL" className="text-white">Todos Status</SelectItem>
            <SelectItem value="PENDING" className="text-white">Pendente</SelectItem>
            <SelectItem value="IN_PROGRESS" className="text-white">Em Andamento</SelectItem>
            <SelectItem value="COMPLETED" className="text-white">Concluída</SelectItem>
            <SelectItem value="BLOCKED" className="text-white">Bloqueada</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
          <SelectTrigger className="w-full sm:w-44 bg-[#111827] border-gray-800 text-white">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800">
            <SelectItem value="ALL" className="text-white">Todos Tipos</SelectItem>
            {serviceTypes.map(st => (
              <SelectItem key={st.value} value={st.value} className="text-white">
                {st.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Pendente</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-400">{stats.inProgress}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Andamento</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.completed}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Concluída</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={prevMonth}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-white capitalize">{monthName}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Hoje
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={nextMonth}
                className="text-gray-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-7 gap-px mb-px">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-900/50">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-800 rounded-lg overflow-hidden">
              {renderCalendarDays()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day List View */}
      {viewMode === 'day' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="ml-1 hidden sm:inline">Semana Anterior</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Hoje
              </Button>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
              className="text-gray-400 hover:text-white"
            >
              <span className="mr-1 hidden sm:inline">Próxima Semana</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          
          {renderDayList()}
        </div>
      )}

      {/* Modal de OSs do dia */}
      <Dialog open={selectedDateOrders !== null} onOpenChange={() => setSelectedDateOrders(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              OSs do dia {selectedDate}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {selectedDateOrders?.map(order => (
              <Card
                key={order.id}
                onClick={() => {
                  onSelectOrder(order.id);
                  setSelectedDateOrders(null);
                }}
                className="bg-[#111827] border-gray-800 hover:border-emerald-600/50 cursor-pointer transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusBgColor(order.status)} border`}>
                        {order.osNumber}
                      </Badge>
                      <Badge variant="outline" className="border-gray-700 text-gray-400">
                        {getServiceTypeLabel(order.type)}
                      </Badge>
                    </div>
                    {order.status === 'IN_PROGRESS' && (
                      <div className="flex items-center gap-1 text-blue-400 text-xs">
                        <Play className="w-3 h-3" />
                        {formatTime(order.totalTime)}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-white mb-1">{order.client}</h3>
                  <p className="text-sm text-gray-400 mb-3">{order.description || 'Sem descrição'}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{order.address}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Wrench className="w-3 h-3" />
                      <span className="text-xs">{order.productDetails?.pixelPitch || 'N/A'}</span>
                    </div>
                    {order.requiresEPI && (
                      <Badge variant="outline" className="text-xs border-orange-600/30 text-orange-400">
                        EPI Obrigatório
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
