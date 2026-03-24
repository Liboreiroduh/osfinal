'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Truck,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Monitor,
  ChevronDown,
  DollarSign,
} from 'lucide-react';
import { PageRoute } from '@/app/page';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
}

// Menu items com controle de acesso por perfil
// allowedRoles: se undefined, todos podem acessar
// IMPORTANTE: Técnico (INSTALLER) só vê Ordens de Serviço e Financeiro
const menuItems: { id: PageRoute; label: string; icon: React.ReactNode; allowedRoles?: ('MANAGER' | 'SUPERVISOR' | 'INSTALLER')[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, allowedRoles: ['MANAGER', 'SUPERVISOR'] },
  { id: 'calendar', label: 'Calendário', icon: <Calendar className="w-5 h-5" />, allowedRoles: ['MANAGER', 'SUPERVISOR'] },
  { id: 'work-orders', label: 'Ordens de Serviço', icon: <ClipboardList className="w-5 h-5" /> }, // Todos podem ver
  { id: 'fleet', label: 'Frota', icon: <Truck className="w-5 h-5" />, allowedRoles: ['MANAGER', 'SUPERVISOR'] },
  { id: 'expenses', label: 'Financeiro', icon: <DollarSign className="w-5 h-5" /> }, // Todos podem ver
  { id: 'team', label: 'Equipe', icon: <Users className="w-5 h-5" />, allowedRoles: ['MANAGER'] },
  { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" />, allowedRoles: ['MANAGER'] },
];

export function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session, isManager, isAdmin, isSupervisor, logout } = useAuthStore();

  const filteredMenuItems = menuItems.filter(item => {
    // Se não tem restrição de allowedRoles, todos podem ver
    if (!item.allowedRoles) return true;
    
    // Verifica se o role do usuário está na lista permitida
    const userRole = session?.role;
    if (userRole && item.allowedRoles.includes(userRole as 'MANAGER' | 'SUPERVISOR' | 'INSTALLER')) {
      return true;
    }
    
    return false;
  });

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    if (role === 'MANAGER') {
      return (
        <span className="px-2 py-0.5 text-xs bg-emerald-600/20 text-emerald-400 rounded-full">
          Gerente
        </span>
      );
    }
    if (role === 'SUPERVISOR') {
      return (
        <span className="px-2 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded-full">
          Supervisor
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded-full">
        Técnico
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#111827] border-b border-gray-800 z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-gray-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">LEDCOLLOR</span>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#111827] border-r border-gray-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">LEDCOLLOR</h1>
                <p className="text-xs text-gray-500">Field Ops</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    currentPage === item.id
                      ? 'bg-emerald-600/20 text-emerald-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </ScrollArea>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-800">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center gap-3 p-2 h-auto hover:bg-gray-800"
                >
                  <Avatar className="w-9 h-9 bg-emerald-600">
                    <AvatarFallback className="bg-emerald-600 text-white text-sm font-medium">
                      {session ? getInitials(session.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {session?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.email || ''}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#1a1a1a] border-gray-800"
              >
                <DropdownMenuLabel className="text-gray-300">
                  <div className="flex flex-col gap-1">
                    <span>{session?.name}</span>
                    {session && getRoleBadge(session.role)}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 focus:text-red-400 focus:bg-red-900/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
