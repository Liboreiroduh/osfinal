'use client';

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { LoginPage } from '@/components/auth/LoginPage';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CalendarPage } from '@/components/calendar/CalendarPage';
import { WorkOrdersPage } from '@/components/work-orders/WorkOrdersPage';
import { WorkOrderDetail } from '@/components/work-orders/WorkOrderDetail';
import { FleetPage } from '@/components/fleet/FleetPage';
import { TeamPage } from '@/components/team/TeamPage';
import { SettingsPage } from '@/components/layout/SettingsPage';
import { ExpensesPage } from '@/components/expenses/ExpensesPage';

export type PageRoute = 'dashboard' | 'calendar' | 'work-orders' | 'fleet' | 'team' | 'settings' | 'expenses';

// Hook para detectar hidratação
function useHydration() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function App() {
  const mounted = useHydration();
  const { isAuthenticated, initAuth, session } = useAuthStore();
  const { loadWorkOrders } = useWorkOrderStore();
  const { loadVehicles } = useVehicleStore();
  const { loadExpenseGroups } = useExpenseStore();
  
  const [currentPage, setCurrentPage] = useState<PageRoute>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (mounted) {
      initAuth();
    }
  }, [mounted, initAuth]);

  useEffect(() => {
    if (mounted && isAuthenticated && session) {
      loadWorkOrders(session.userId, session.role === 'MANAGER');
      loadVehicles();
      loadExpenseGroups();
    }
  }, [mounted, isAuthenticated, session, loadWorkOrders, loadVehicles, loadExpenseGroups]);

  const handleNavigate = useCallback((page: PageRoute) => {
    setCurrentPage(page);
    setSelectedOrderId(null);
  }, []);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedOrderId(null);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    if (selectedOrderId && currentPage === 'work-orders') {
      return (
        <WorkOrderDetail
          orderId={selectedOrderId}
          onBack={handleBackToList}
        />
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'calendar':
        return <CalendarPage onSelectOrder={handleSelectOrder} />;
      case 'work-orders':
        return <WorkOrdersPage onSelectOrder={handleSelectOrder} />;
      case 'fleet':
        return <FleetPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'team':
        return <TeamPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </MainLayout>
  );
}
