'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { workOrderService, expenseService } from '@/lib/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Database, RefreshCw, Trash2, CheckCircle } from 'lucide-react';

export function SettingsPage() {
  const { isAdmin, session } = useAuthStore();
  const { loadWorkOrders, reset: resetWorkOrders } = useWorkOrderStore();
  const { loadExpenseGroups } = useExpenseStore();
  const [financeEmail, setFinanceEmail] = useState('financeiro@ledcollor.com');
  const [notifications, setNotifications] = useState({
    newAssignments: true,
    statusUpdates: true,
    deadlines: true,
  });
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetData = () => {
    if (confirm('Tem certeza que deseja resetar todos os dados? As OSs de demonstração serão restauradas.')) {
      // Reset work orders to mock data
      workOrderService.reset();
      // Clear expense data
      expenseService.reset();
      
      // Reload data in stores
      if (session) {
        loadWorkOrders(session.userId, session.role === 'MANAGER');
        loadExpenseGroups();
      }
      
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const handleClearCache = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados? Você será deslogado.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 text-sm">Gerenciamento do sistema</p>
      </div>

      {/* Success Message */}
      {resetSuccess && (
        <div className="p-3 bg-emerald-600/20 border border-emerald-600/30 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400">Dados resetados com sucesso!</p>
        </div>
      )}

      {/* Profile */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-medium">
              {session?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-white font-medium">{session?.name}</p>
              <p className="text-gray-400 text-sm">{session?.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {session?.role === 'MANAGER' ? 'Gerente' : 'Técnico'} • {session?.permission}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Novas atribuições</p>
              <p className="text-gray-500 text-sm">Receber alertas de novas OS atribuídas</p>
            </div>
            <Switch
              checked={notifications.newAssignments}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newAssignments: checked }))}
            />
          </div>

          <Separator className="bg-gray-800" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Atualizações de status</p>
              <p className="text-gray-500 text-sm">Alertas de mudanças de status das OS</p>
            </div>
            <Switch
              checked={notifications.statusUpdates}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, statusUpdates: checked }))}
            />
          </div>

          <Separator className="bg-gray-800" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Prazos</p>
              <p className="text-gray-500 text-sm">Lembretes de prazos próximos</p>
            </div>
            <Switch
              checked={notifications.deadlines}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, deadlines: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Finance Email */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Mail className="w-5 h-5" />
            E-mail Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={financeEmail}
              onChange={(e) => setFinanceEmail(e.target.value)}
              placeholder="financeiro@empresa.com"
              className="bg-[#0a0a0a] border-gray-700 text-white flex-1"
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management - Admin Only */}
      {isAdmin && (
        <Card className="bg-[#111827] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Database className="w-5 h-5" />
              Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white">Resetar Dados de Demonstração</p>
                <p className="text-gray-500 text-sm">Restaura 8 OSs fictícias em status PENDING</p>
              </div>
              <Button
                onClick={handleResetData}
                variant="outline"
                className="border-yellow-700 text-yellow-400 hover:bg-yellow-900/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-white">Limpar Todos os Dados</p>
                <p className="text-gray-500 text-sm">Remove tudo e desloga do sistema</p>
              </div>
              <Button
                onClick={handleClearCache}
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-[#111827] border-gray-800">
        <CardContent className="p-4">
          <p className="text-gray-500 text-sm text-center">
            LEDCOLLOR Field Ops v1.0.0<br />
            Sistema de Gestão de Operações de Campo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
