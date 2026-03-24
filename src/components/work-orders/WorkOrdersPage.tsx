'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { WorkOrder, WorkOrderStatus } from '@/types';
import { statusLabels, serviceTypes } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutGrid,
  List,
  Search,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Play,
  CheckCircle,
} from 'lucide-react';
import { TechnicianCalendarView } from './TechnicianCalendarView';

interface WorkOrdersPageProps {
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
    case 'PENDING': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
    case 'IN_PROGRESS': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
    case 'COMPLETED': return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
    case 'BLOCKED': return 'bg-red-600/20 text-red-400 border-red-600/30';
  }
};

const getServiceTypeLabel = (type: string) => {
  return serviceTypes.find(st => st.value === type)?.label || type;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

function OrderCard({ order, compact = false, onSelectOrder }: { order: WorkOrder; compact?: boolean; onSelectOrder: (id: string) => void }) {
  return (
    <Card
      onClick={() => onSelectOrder(order.id)}
      className={`bg-[#1a1a1a] border-gray-800 hover:border-emerald-600/50 cursor-pointer transition-colors ${
        compact ? 'p-3' : ''
      }`}
    >
      <CardContent className={compact ? 'p-0' : 'p-4'}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(order.status)} border`}>
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

        <h3 className="font-medium text-white mb-1 line-clamp-1">{order.client}</h3>
        <p className="text-sm text-gray-400 mb-2 line-clamp-1">{order.description || 'Sem descrição'}</p>

        {!compact && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{order.address}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-500">
            <User className="w-3 h-3" />
            <span>{order.assignedToName}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(order.date)}</span>
          </div>
        </div>

        {order.requiresEPI && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs border-orange-600/30 text-orange-400">
              EPI Obrigatório
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ status, orders, onSelectOrder }: { status: WorkOrderStatus; orders: WorkOrder[]; onSelectOrder: (id: string) => void }) {
  return (
    <div className="flex-1 min-w-[280px] lg:min-w-[300px]">
      <div className="flex items-center gap-2 mb-3 sticky top-0 bg-[#0a0a0a] py-2 z-10">
        <div className={`p-1.5 rounded ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
        </div>
        <h3 className="font-medium text-white">{statusLabels[status]}</h3>
        <Badge variant="outline" className="border-gray-700 text-gray-400 ml-auto">
          {orders.length}
        </Badge>
      </div>
      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            Nenhuma OS
          </div>
        ) : (
          orders.map(order => <OrderCard key={order.id} order={order} compact onSelectOrder={onSelectOrder} />)
        )}
      </div>
    </div>
  );
}

export function WorkOrdersPage({ onSelectOrder }: WorkOrdersPageProps) {
  const { isManager, isSupervisor, isInstaller } = useAuthStore();
  const { workOrders } = useWorkOrderStore();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');

  const filteredOrders = useMemo(() => {
    let orders = [...workOrders];

    if (statusFilter !== 'ALL') {
      orders = orders.filter(wo => wo.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      orders = orders.filter(wo =>
        wo.client.toLowerCase().includes(term) ||
        wo.osNumber.toLowerCase().includes(term) ||
        wo.description.toLowerCase().includes(term) ||
        wo.assignedToName.toLowerCase().includes(term)
      );
    }

    return orders;
  }, [workOrders, statusFilter, searchTerm]);

  const ordersByStatus = useMemo(() => ({
    PENDING: filteredOrders.filter(wo => wo.status === 'PENDING'),
    IN_PROGRESS: filteredOrders.filter(wo => wo.status === 'IN_PROGRESS'),
    COMPLETED: filteredOrders.filter(wo => wo.status === 'COMPLETED'),
    BLOCKED: filteredOrders.filter(wo => wo.status === 'BLOCKED'),
  }), [filteredOrders]);

  // Se for técnico, mostrar visualização de calendário
  if (isInstaller) {
    return <TechnicianCalendarView onSelectOrder={onSelectOrder} />;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Serviço</h1>
          <p className="text-gray-400 text-sm">
            {isManager || isSupervisor ? 'Todas as ordens' : 'Minhas ordens atribuídas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-emerald-600' : 'border-gray-700 text-gray-400'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('kanban')}
            className={viewMode === 'kanban' ? 'bg-emerald-600' : 'border-gray-700 text-gray-400'}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar por título, cliente, OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#111827] border-gray-800 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as WorkOrderStatus | 'ALL')}>
          <SelectTrigger className="w-full sm:w-48 bg-[#111827] border-gray-800 text-white">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800">
            <SelectItem value="ALL" className="text-white">Todos os Status</SelectItem>
            <SelectItem value="PENDING" className="text-white">Pendente</SelectItem>
            <SelectItem value="IN_PROGRESS" className="text-white">Em Andamento</SelectItem>
            <SelectItem value="COMPLETED" className="text-white">Concluída</SelectItem>
            <SelectItem value="BLOCKED" className="text-white">Bloqueada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'] as WorkOrderStatus[]).map(status => (
          <Card key={status} className="bg-[#111827] border-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-white">{ordersByStatus[status].length}</p>
              <p className="text-xs text-gray-500">{statusLabels[status]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          <KanbanColumn status="PENDING" orders={ordersByStatus.PENDING} onSelectOrder={onSelectOrder} />
          <KanbanColumn status="IN_PROGRESS" orders={ordersByStatus.IN_PROGRESS} onSelectOrder={onSelectOrder} />
          <KanbanColumn status="COMPLETED" orders={ordersByStatus.COMPLETED} onSelectOrder={onSelectOrder} />
          <KanbanColumn status="BLOCKED" orders={ordersByStatus.BLOCKED} onSelectOrder={onSelectOrder} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhuma OS encontrada com este filtro.
            </div>
          ) : (
            filteredOrders.map(order => <OrderCard key={order.id} order={order} onSelectOrder={onSelectOrder} />)
          )}
        </div>
      )}
    </div>
  );
}
