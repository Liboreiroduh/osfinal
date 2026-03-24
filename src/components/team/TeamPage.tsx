'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/lib/services';
import { User, UserRole, UserPermission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Key,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function TeamPage() {
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>(authService.getUsers());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'INSTALLER' as UserRole,
    permission: 'EDITOR' as UserPermission,
    active: true,
  });

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'INSTALLER' as UserRole,
    permission: 'EDITOR' as UserPermission,
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const refreshUsers = () => {
    setUsers(authService.getUsers());
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    if (role === 'MANAGER') {
      return <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 border">Gerente</Badge>;
    }
    return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 border">Técnico</Badge>;
  };

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'ADMIN':
        return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border">Admin</Badge>;
      case 'EDITOR':
        return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border">Editor</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30 border">Visualizador</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      permission: user.permission,
      active: user.active,
    });
    setError('');
    setSuccess('');
    setShowEditModal(true);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setShowPasswordModal(true);
  };

  const handleEdit = () => {
    if (!selectedUser) return;
    
    const result = authService.updateUser(selectedUser.id, editForm);
    
    if (result.success) {
      refreshUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      setSuccess('Usuário atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Erro ao atualizar usuário');
    }
  };

  const handleNew = () => {
    const result = authService.createUser(newUser);
    
    if (result.success) {
      refreshUsers();
      setShowNewModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'INSTALLER',
        permission: 'EDITOR',
      });
      setSuccess('Usuário criado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Erro ao criar usuário');
    }
  };

  const handleChangePassword = () => {
    if (!selectedUser) return;
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (newPassword.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }
    
    const result = authService.changePassword(selectedUser.id, newPassword);
    
    if (result.success) {
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Erro ao alterar senha');
    }
  };

  const toggleActive = (user: User) => {
    const result = authService.toggleUserActive(user.id);
    
    if (result.success) {
      refreshUsers();
    }
  };

  const handleDelete = (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) return;
    
    const result = authService.deleteUser(user.id);
    
    if (result.success) {
      refreshUsers();
      setSuccess('Usuário excluído com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Erro ao excluir usuário');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-gray-400">Apenas administradores podem gerenciar a equipe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe</h1>
          <p className="text-gray-400 text-sm">Gerenciamento de usuários</p>
        </div>
        <Button
          onClick={() => {
            setError('');
            setShowNewModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="bg-red-900/50 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-emerald-900/50 border-emerald-800 text-emerald-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-white">{users.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'MANAGER').length}</p>
            <p className="text-xs text-gray-500">Gerentes</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{users.filter(u => u.role === 'INSTALLER').length}</p>
            <p className="text-xs text-gray-500">Técnicos</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{users.filter(u => u.active).length}</p>
            <p className="text-xs text-gray-500">Ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#111827] border-gray-800 text-white"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-[#111827] border-gray-800 text-white">
            <SelectValue placeholder="Função" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800">
            <SelectItem value="ALL" className="text-white">Todos</SelectItem>
            <SelectItem value="MANAGER" className="text-white">Gerentes</SelectItem>
            <SelectItem value="INSTALLER" className="text-white">Técnicos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map(user => (
          <Card key={user.id} className="bg-[#111827] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className={`w-12 h-12 ${user.active ? 'bg-emerald-600' : 'bg-gray-600'}`}>
                  <AvatarFallback className="text-white font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-white">{user.name}</h3>
                    {!user.active && (
                      <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30 border">
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getRoleBadge(user.role)}
                    {getPermissionBadge(user.permission)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPasswordModal(user)}
                    className="border-amber-700 text-amber-400 hover:bg-amber-900/20"
                    title="Alterar senha"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(user)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(user)}
                    className={user.active 
                      ? 'border-red-700 text-red-400 hover:bg-red-900/20'
                      : 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20'
                    }
                    title={user.active ? 'Desativar' : 'Ativar'}
                  >
                    {user.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(user)}
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">E-mail</Label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Função</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm(prev => ({ ...prev, role: v as UserRole }))}>
                  <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="MANAGER" className="text-white">Gerente</SelectItem>
                    <SelectItem value="INSTALLER" className="text-white">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Permissão</Label>
                <Select value={editForm.permission} onValueChange={(v) => setEditForm(prev => ({ ...prev, permission: v as UserPermission }))}>
                  <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="ADMIN" className="text-white">Admin</SelectItem>
                    <SelectItem value="EDITOR" className="text-white">Editor</SelectItem>
                    <SelectItem value="VIEWER" className="text-white">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-800 accent-emerald-500"
              />
              <Label className="text-gray-300">Usuário ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              Alterar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-400 text-sm">
              Alterando senha de: <span className="text-white font-medium">{selectedUser?.name}</span>
            </p>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Confirmar Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <p className="text-xs text-gray-500">
              A senha deve ter pelo menos 4 caracteres.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Key className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New User Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Nome *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">E-mail *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Senha *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Função</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser(prev => ({ ...prev, role: v as UserRole }))}>
                  <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="MANAGER" className="text-white">Gerente</SelectItem>
                    <SelectItem value="INSTALLER" className="text-white">Técnico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Permissão</Label>
                <Select value={newUser.permission} onValueChange={(v) => setNewUser(prev => ({ ...prev, permission: v as UserPermission }))}>
                  <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="ADMIN" className="text-white">Admin</SelectItem>
                    <SelectItem value="EDITOR" className="text-white">Editor</SelectItem>
                    <SelectItem value="VIEWER" className="text-white">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleNew}
              disabled={!newUser.name || !newUser.email || !newUser.password}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
