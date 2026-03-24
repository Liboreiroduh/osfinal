'use client';

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageRoute } from '@/app/page';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Square,
  TrendingUp,
  ArrowRight,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: PageRoute) => void;
}

// Hook para detectar hidratação
function useHydration() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const mounted = useHydration();
  const { session, isManager, isSupervisor } = useAuthStore();
  const { workOrders, getStats } = useWorkOrderStore();
  const { vehicles, getStats: getVehicleStats } = useVehicleStore();

  // Supervisor tem as mesmas permissões de visualização que o Manager
  const canManage = isManager || isSupervisor;

  if (!mounted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Apenas técnicos (INSTALLER) veem a mensagem simples
  if (!canManage) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo, {session?.name}!</h2>
          <p className="text-gray-400 mb-6">
            Acesse Ordens de Serviço para ver suas tarefas atribuídas.
          </p>
          <Button
            onClick={() => onNavigate('work-orders')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Ver Minhas OS
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const vehicleStats = getVehicleStats();
  const vehiclesInRoute = vehicles.filter(v => v.status === 'IN_USE');

  const statusCards = [
    {
      title: 'Total de OS',
      value: stats.total,
      icon: <ClipboardList className="w-5 h-5" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-600/20',
    },
    {
      title: 'Pendentes',
      value: stats.pending,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/20',
    },
    {
      title: 'Em Andamento',
      value: stats.inProgress,
      icon: <Square className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20',
    },
    {
      title: 'Concluídas',
      value: stats.completed,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-600/20',
    },
    {
      title: 'Bloqueadas',
      value: stats.blocked,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-400',
      bgColor: 'bg-red-600/20',
    },
    {
      title: 'Frota em Rota',
      value: vehicleStats.inUse,
      icon: <Truck className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
    },
  ];

  const completedPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  // Group by technician
  const technicianStats: { name: string; pending: number; inProgress: number; completed: number; total: number }[] = [];
  workOrders.forEach(wo => {
    let tech = technicianStats.find(t => t.name === wo.assignedToName);
    if (!tech) {
      tech = { name: wo.assignedToName, pending: 0, inProgress: 0, completed: 0, total: 0 };
      technicianStats.push(tech);
    }
    tech.total++;
    if (wo.status === 'PENDING') tech.pending++;
    if (wo.status === 'IN_PROGRESS') tech.inProgress++;
    if (wo.status === 'COMPLETED') tech.completed++;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Visão geral das operações</p>
        </div>
        <Button
          onClick={() => onNavigate('calendar')}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          Nova OS
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusCards.map((card, index) => (
          <Card key={index} className="bg-[#111827] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <div className={card.color}>{card.icon}</div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Installed + Progress */}
        <Card className="bg-[#111827] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Área Instalada (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-emerald-400">
                {stats.totalAreaMonth.toFixed(1)}
              </p>
              <p className="text-gray-500 text-sm">m² instalados</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progresso mensal</span>
                <span className="text-white">{completedPercentage}%</span>
              </div>
              <Progress value={completedPercentage} className="h-2 bg-gray-800 [&>div]:bg-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Technician Ranking */}
        <Card className="bg-[#111827] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base">Resumo por Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {technicianStats.slice(0, 5).map((tech, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-medium">
                      {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm text-white">{tech.name}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="text-yellow-400">{tech.pending}P</span>
                        <span className="text-blue-400">{tech.inProgress}E</span>
                        <span className="text-emerald-400">{tech.completed}C</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-gray-700 text-gray-300">
                    {tech.total} OS
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fleet in Route */}
        <Card className="bg-[#111827] border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                Veículos em Rota
              </span>
              <Badge variant="outline" className="border-purple-700 text-purple-400">
                {vehiclesInRoute.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehiclesInRoute.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Nenhum veículo em rota
              </p>
            ) : (
              <div className="space-y-3">
                {vehiclesInRoute.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50">
                    <div>
                      <p className="text-sm text-white font-medium">{vehicle.model}</p>
                      <p className="text-xs text-gray-500">{vehicle.plate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{vehicle.currentDriver}</p>
                      <p className="text-xs text-blue-400">Em uso</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OS by Status Chart */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-yellow-600/10 border border-yellow-600/20">
              <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-sm text-gray-400 mt-1">Pendentes</p>
              <div className="w-full h-1 bg-gray-800 rounded mt-3">
                <div
                  className="h-full bg-yellow-500 rounded"
                  style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-600/10 border border-blue-600/20">
              <p className="text-3xl font-bold text-blue-400">{stats.inProgress}</p>
              <p className="text-sm text-gray-400 mt-1">Em Andamento</p>
              <div className="w-full h-1 bg-gray-800 rounded mt-3">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{ width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-600/10 border border-emerald-600/20">
              <p className="text-3xl font-bold text-emerald-400">{stats.completed}</p>
              <p className="text-sm text-gray-400 mt-1">Concluídas</p>
              <div className="w-full h-1 bg-gray-800 rounded mt-3">
                <div
                  className="h-full bg-emerald-500 rounded"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-600/10 border border-red-600/20">
              <p className="text-3xl font-bold text-red-400">{stats.blocked}</p>
              <p className="text-sm text-gray-400 mt-1">Bloqueadas</p>
              <div className="w-full h-1 bg-gray-800 rounded mt-3">
                <div
                  className="h-full bg-red-500 rounded"
                  style={{ width: `${stats.total > 0 ? (stats.blocked / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
