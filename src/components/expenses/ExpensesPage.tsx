'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useExpenseStore } from '@/stores/expenseStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { ExpenseGroup, ExpenseGroupStatus, ExpenseType, WorkOrder } from '@/types';
import { useUpload } from '@/hooks/useUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Receipt,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  User,
  Plus,
  Trash2,
  Camera,
  Building2,
  Upload,
  RotateCcw,
} from 'lucide-react';

const expenseTypeLabels: Record<ExpenseType, string> = {
  ALIMENTACAO: 'Alimentação',
  HOSPEDAGEM: 'Hospedagem',
  GASOLINA: 'Gasolina',
  TRANSPORTE: 'Transporte',
  OUTROS: 'Outros',
};

const statusLabels: Record<ExpenseGroupStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Aguardando Aprovação',
  APPROVED: 'Aprovado',
  PENDING_FINAL: 'Aguardando Admin',
  FINAL_APPROVED: 'Aprovado Final',
  REJECTED: 'Rejeitado',
};

const statusColors: Record<ExpenseGroupStatus, string> = {
  DRAFT: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  PENDING: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  APPROVED: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
  PENDING_FINAL: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
  FINAL_APPROVED: 'bg-green-600/20 text-green-400 border-green-600/30',
  REJECTED: 'bg-red-600/20 text-red-400 border-red-600/30',
};

export function ExpensesPage() {
  const { session, isAdmin, isSupervisor, isInstaller, canApproveExpenses, canFinalApproveExpenses } = useAuthStore();
  const { expenseGroups, loadExpenseGroups, syncWithWorkOrders, submitForApproval, approveExpenseGroup, finalApproveExpenseGroup, rejectExpenseGroup, returnToDraft, addExpense, removeExpense } = useExpenseStore();
  const { workOrders, loadWorkOrders } = useWorkOrderStore();
  const { uploadFile, uploading, progress } = useUpload({ category: 'receipts' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseGroupStatus | 'ALL'>('ALL');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ExpenseGroup | null>(null);
  const [justification, setJustification] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  
  // New expense form
  const [newExpense, setNewExpense] = useState<{
    type: ExpenseType;
    customType: string;
    description: string;
    amount: string;
    receiptPhoto: string;
  }>({
    type: 'ALIMENTACAO',
    customType: '',
    description: '',
    amount: '',
    receiptPhoto: '',
  });

  useEffect(() => {
    if (session) {
      loadWorkOrders(session.userId, session.role === 'MANAGER');
      loadExpenseGroups();
    }
  }, [session, loadWorkOrders, loadExpenseGroups]);

  // Sync completed work orders with expense groups
  useEffect(() => {
    if (workOrders.length > 0 && session) {
      syncWithWorkOrders();
    }
  }, [workOrders, session, syncWithWorkOrders]);

  // Filter expense groups based on user role
  const filteredGroups = expenseGroups.filter(group => {
    // Técnico só vê suas próprias despesas
    if (isInstaller && group.technicianId !== session?.userId) {
      return false;
    }
    
    if (statusFilter !== 'ALL' && group.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return group.workOrderNumber.toLowerCase().includes(term) ||
             group.technicianName.toLowerCase().includes(term);
    }
    return true;
  });

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleApprove = (group: ExpenseGroup) => {
    setSelectedGroup(group);
    setJustification('');
    setShowApproveModal(true);
  };

  const handleFinalApprove = (group: ExpenseGroup) => {
    setSelectedGroup(group);
    setShowFinalModal(true);
  };

  const handleReject = (group: ExpenseGroup) => {
    setSelectedGroup(group);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReturnToDraft = (group: ExpenseGroup) => {
    if (confirm(`Devolver ${group.workOrderNumber} para o técnico corrigir?`)) {
      returnToDraft(group.id);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadFile(file);
    if (result.success && result.url) {
      setNewExpense(prev => ({ ...prev, receiptPhoto: result.url! }));
    } else {
      alert(result.error || 'Erro ao fazer upload da foto');
    }
  };

  const handleAddExpense = (group: ExpenseGroup) => {
    setSelectedGroup(group);
    setNewExpense({
      type: 'ALIMENTACAO',
      customType: '',
      description: '',
      amount: '',
      receiptPhoto: '',
    });
    setShowAddExpenseModal(true);
  };

  const handleRemoveExpense = (groupId: string, expenseId: string) => {
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
      removeExpense(groupId, expenseId);
    }
  };

  const handleSubmitForApproval = (group: ExpenseGroup) => {
    if (group.expenses.length === 0) {
      alert('Adicione pelo menos uma despesa antes de enviar para aprovação');
      return;
    }
    
    if (confirm(`Confirmar envio das despesas de ${group.workOrderNumber} para aprovação?`)) {
      const result = submitForApproval(group.id);
      if (!result.success) {
        alert(result.error || 'Erro ao enviar para aprovação');
      }
    }
  };

  const confirmAddExpense = () => {
    if (!selectedGroup || !newExpense.description || !newExpense.amount) return;
    
    addExpense(selectedGroup.id, {
      type: newExpense.type,
      customType: newExpense.type === 'OUTROS' ? newExpense.customType : undefined,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      receiptPhoto: newExpense.receiptPhoto || '/placeholder-receipt.jpg',
      date: Date.now(),
      createdBy: session?.userId || '',
      createdByName: session?.name || '',
    });
    
    setShowAddExpenseModal(false);
    setSelectedGroup(null);
  };

  const confirmApprove = () => {
    if (!selectedGroup) return;
    
    const exceedsBudget = selectedGroup.totalAmount > selectedGroup.budget && selectedGroup.budget > 0;
    
    if (exceedsBudget && !justification.trim()) {
      return;
    }
    
    approveExpenseGroup(selectedGroup.id, justification.trim() || undefined);
    setShowApproveModal(false);
    setSelectedGroup(null);
    setJustification('');
  };

  const confirmFinalApprove = () => {
    if (!selectedGroup) return;
    
    finalApproveExpenseGroup(selectedGroup.id);
    setShowFinalModal(false);
    setSelectedGroup(null);
  };

  const confirmReject = () => {
    if (!selectedGroup || !rejectReason.trim()) return;
    
    rejectExpenseGroup(selectedGroup.id, rejectReason);
    setShowRejectModal(false);
    setSelectedGroup(null);
    setRejectReason('');
  };

  const stats = {
    total: filteredGroups.length,
    draft: filteredGroups.filter(g => g.status === 'DRAFT').length,
    pending: filteredGroups.filter(g => g.status === 'PENDING').length,
    pendingFinal: filteredGroups.filter(g => g.status === 'PENDING_FINAL').length,
    approved: filteredGroups.filter(g => g.status === 'APPROVED' || g.status === 'FINAL_APPROVED').length,
    rejected: filteredGroups.filter(g => g.status === 'REJECTED').length,
    totalAmount: filteredGroups.reduce((sum, g) => sum + g.totalAmount, 0),
    pendingAmount: filteredGroups
      .filter(g => g.status === 'PENDING' || g.status === 'PENDING_FINAL' || g.status === 'APPROVED')
      .reduce((sum, g) => sum + g.totalAmount, 0),
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getBudgetPercentage = (total: number, budget: number) => {
    if (budget <= 0) return 0;
    return Math.min(100, Math.round((total / budget) * 100));
  };

  // Check if technician can edit expenses (DRAFT status only)
  const canEditExpenses = (group: ExpenseGroup) => {
    return isInstaller && group.status === 'DRAFT' && group.technicianId === session?.userId;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isInstaller ? 'Minhas Despesas' : 'Financeiro'}
          </h1>
          <p className="text-gray-400 text-sm">
            {isInstaller 
              ? 'Gerencie as despesas das suas OS concluídas' 
              : 'Gestão de despesas de OS concluídas'
            }
          </p>
        </div>
        {stats.pendingFinal > 0 && isAdmin && (
          <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30 px-3 py-1">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {stats.pendingFinal} aguardando aprovação final
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-500">Total OSs</p>
          </CardContent>
        </Card>
        {isInstaller && (
          <Card className="bg-[#111827] border-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-gray-400">{stats.draft}</p>
              <p className="text-xs text-gray-500">Rascunhos</p>
            </CardContent>
          </Card>
        )}
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-gray-500">Aguard. Aprovação</p>
          </CardContent>
        </Card>
        {!isInstaller && (
          <Card className="bg-[#111827] border-gray-800">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.pendingFinal}</p>
              <p className="text-xs text-gray-500">Aguard. Admin</p>
            </CardContent>
          </Card>
        )}
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
            <p className="text-xs text-gray-500">Aprovados</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
            <p className="text-xs text-gray-500">Rejeitados</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold text-white">{formatCurrency(stats.pendingAmount)}</p>
            <p className="text-xs text-gray-500">A pagar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar por OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#111827] border-gray-800 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExpenseGroupStatus | 'ALL')}>
          <SelectTrigger className="w-full sm:w-48 bg-[#111827] border-gray-800 text-white">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-gray-800">
            <SelectItem value="ALL" className="text-white">Todos os Status</SelectItem>
            <SelectItem value="DRAFT" className="text-white">Rascunho</SelectItem>
            <SelectItem value="PENDING" className="text-white">Aguardando Aprovação</SelectItem>
            <SelectItem value="APPROVED" className="text-white">Aprovado</SelectItem>
            <SelectItem value="PENDING_FINAL" className="text-white">Aguardando Admin</SelectItem>
            <SelectItem value="FINAL_APPROVED" className="text-white">Aprovado Final</SelectItem>
            <SelectItem value="REJECTED" className="text-white">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expense Groups List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma despesa encontrada.</p>
            <p className="text-sm mt-2">
              {isInstaller 
                ? 'Suas despesas aparecerão aqui após concluir uma OS.'
                : 'As despesas aparecem aqui após a OS ser concluída.'
              }
            </p>
          </div>
        ) : (
          filteredGroups.map(group => {
            const isExpanded = expandedGroups.has(group.id);
            const exceedsBudget = group.totalAmount > group.budget && group.budget > 0;
            const budgetPercentage = getBudgetPercentage(group.totalAmount, group.budget);
            const canEdit = canEditExpenses(group);
            
            return (
              <Card key={group.id} className="bg-[#111827] border-gray-800">
                <CardContent className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(group.id)}>
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-medium text-white">{group.workOrderNumber}</h3>
                        <Badge className={`${statusColors[group.status]} border`}>
                          {statusLabels[group.status]}
                        </Badge>
                        {exceedsBudget && (
                          <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Acima do Budget
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{group.technicianName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Receipt className="w-4 h-4" />
                          <span>{group.expenses.length} despesa(s)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(group.completedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(group.totalAmount)}
                      </p>
                      {group.budget > 0 && (
                        <p className="text-sm text-gray-500">
                          Budget: {formatCurrency(group.budget)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Budget Progress */}
                  {group.budget > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Utilização do Budget</span>
                        <span className={exceedsBudget ? 'text-red-400' : 'text-emerald-400'}>
                          {budgetPercentage}%
                        </span>
                      </div>
                      <Progress 
                        value={budgetPercentage} 
                        className={`h-2 ${exceedsBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className="text-gray-500">
                          Gasto: {formatCurrency(group.totalAmount)}
                        </span>
                        <span className={exceedsBudget ? 'text-red-400' : 'text-emerald-400'}>
                          {exceedsBudget 
                            ? `${formatCurrency(group.totalAmount - group.budget)} acima` 
                            : `${formatCurrency(group.budget - group.totalAmount)} disponível`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Approval Info */}
                  {group.approvedBy && (
                    <div className="mt-3 p-2 bg-gray-800/50 rounded text-sm">
                      <p className="text-gray-400">
                        Aprovado por <span className="text-white">{group.approvedByName}</span> em {formatDate(group.approvedAt!)}
                      </p>
                      {group.justification && (
                        <p className="text-orange-400 mt-1">
                          <strong>Justificativa:</strong> {group.justification}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {group.finalApprovedBy && (
                    <div className="mt-3 p-2 bg-emerald-900/20 rounded text-sm">
                      <p className="text-emerald-400">
                        Aprovação final por <span className="text-white">{group.finalApprovedByName}</span> em {formatDate(group.finalApprovedAt!)}
                      </p>
                    </div>
                  )}
                  
                  {group.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-900/20 rounded text-sm">
                      <p className="text-red-400">
                        <strong>Rejeitado por:</strong> {group.rejectedByName || 'N/A'} 
                        {group.rejectedAt && ` em ${formatDate(group.rejectedAt)}`}
                      </p>
                      <p className="text-red-400 mt-1">
                        <strong>Motivo:</strong> {group.rejectionReason}
                      </p>
                    </div>
                  )}
                  
                  {/* Action Buttons - Technician can add expenses */}
                  {canEdit && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleAddExpense(group)}
                        variant="outline"
                        className="border-gray-700 text-gray-300 flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Despesa
                      </Button>
                      <Button
                        onClick={() => handleSubmitForApproval(group)}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                        disabled={group.expenses.length === 0}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Enviar para Aprovação
                      </Button>
                    </div>
                  )}
                  
                  {/* Info for technician - DRAFT without expenses */}
                  {canEdit && group.expenses.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Adicione pelo menos uma despesa para enviar para aprovação
                    </p>
                  )}
                  
                  {/* Action Buttons - Supervisor/Admin approve/reject/return */}
                  {group.status === 'PENDING' && canApproveExpenses() && !isInstaller && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleApprove(group)}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleReturnToDraft(group)}
                        variant="outline"
                        className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20 flex-1"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Devolver
                      </Button>
                      <Button
                        onClick={() => handleReject(group)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                  
                  {group.status === 'PENDING_FINAL' && canFinalApproveExpenses() && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleFinalApprove(group)}
                        className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar Final
                      </Button>
                      <Button
                        onClick={() => handleReject(group)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Detalhes das Despesas</h4>
                      <div className="space-y-2">
                        {group.expenses.map(expense => (
                          <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{expense.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{expenseTypeLabels[expense.type]}</span>
                                  {expense.customType && <span>({expense.customType})</span>}
                                  <span>•</span>
                                  <span>{formatDate(expense.date)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-white font-bold">{formatCurrency(expense.amount)}</p>
                                {expense.receiptPhoto && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-emerald-400 h-6 px-2"
                                    onClick={() => window.open(expense.receiptPhoto, '_blank')}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    Ver recibo
                                  </Button>
                                )}
                              </div>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-400 hover:bg-red-900/20"
                                  onClick={() => handleRemoveExpense(group.id, expense.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Expand Toggle */}
                  <button
                    onClick={() => toggleExpand(group.id)}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-400 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Ocultar detalhes
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Ver detalhes
                      </>
                    )}
                  </button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Expense Modal */}
      <Dialog open={showAddExpenseModal} onOpenChange={setShowAddExpenseModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar Despesa</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedGroup?.workOrderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo de Despesa</Label>
              <Select 
                value={newExpense.type} 
                onValueChange={(v) => setNewExpense(prev => ({ ...prev, type: v as ExpenseType }))}
              >
                <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700">
                  <SelectItem value="ALIMENTACAO" className="text-white">Alimentação</SelectItem>
                  <SelectItem value="HOSPEDAGEM" className="text-white">Hospedagem</SelectItem>
                  <SelectItem value="GASOLINA" className="text-white">Gasolina</SelectItem>
                  <SelectItem value="TRANSPORTE" className="text-white">Transporte</SelectItem>
                  <SelectItem value="OUTROS" className="text-white">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newExpense.type === 'OUTROS' && (
              <div className="space-y-2">
                <Label className="text-gray-300">Especificar Tipo</Label>
                <Input
                  value={newExpense.customType}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, customType: e.target.value }))}
                  placeholder="Ex: Material, Estacionamento..."
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-gray-300">Descrição *</Label>
              <Input
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da despesa"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Foto do Comprovante</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-700 text-gray-300 flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-pulse" />
                        Enviando... {progress}%
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        {newExpense.receiptPhoto ? 'Trocar Foto' : 'Tirar Foto / Upload'}
                      </>
                    )}
                  </Button>
                  {newExpense.receiptPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => setNewExpense(prev => ({ ...prev, receiptPhoto: '' }))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {newExpense.receiptPhoto && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-800">
                    <img 
                      src={newExpense.receiptPhoto} 
                      alt="Recibo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {selectedGroup && selectedGroup.budget > 0 && (
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Budget restante:</span>
                  <span className={`font-medium ${
                    (selectedGroup.budget - selectedGroup.totalAmount - (parseFloat(newExpense.amount) || 0)) < 0 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  }`}>
                    {formatCurrency(Math.max(0, selectedGroup.budget - selectedGroup.totalAmount - (parseFloat(newExpense.amount) || 0)))}
                  </span>
                </div>
                {(selectedGroup.totalAmount + (parseFloat(newExpense.amount) || 0)) > selectedGroup.budget && (
                  <p className="text-xs text-orange-400 mt-1">
                    ⚠️ Esta despesa excederá o budget
                  </p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddExpenseModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmAddExpense}
              disabled={!newExpense.description || !newExpense.amount}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Aprovar Despesas</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedGroup?.workOrderNumber} - {selectedGroup?.technicianName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && selectedGroup.totalAmount > selectedGroup.budget && selectedGroup.budget > 0 && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 font-medium">
                <AlertTriangle className="w-5 h-5" />
                Despesas acima do budget
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Excedente: {formatCurrency(selectedGroup.totalAmount - selectedGroup.budget)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Justificativa obrigatória para encaminhar ao Admin.
              </p>
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">
                Justificativa {selectedGroup && selectedGroup.totalAmount > selectedGroup.budget && selectedGroup.budget > 0 && '*'}
              </Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Motivo da aprovação ou justificativa para excedente..."
                className="bg-[#0a0a0a] border-gray-700 text-white"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmApprove}
              disabled={selectedGroup && selectedGroup.totalAmount > selectedGroup.budget && selectedGroup.budget > 0 && !justification.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Approve Modal */}
      <Dialog open={showFinalModal} onOpenChange={setShowFinalModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Aprovação Final</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedGroup?.workOrderNumber} - {selectedGroup?.technicianName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-orange-900/20 border border-orange-800 rounded-lg">
                <p className="text-orange-400 font-medium">Despesas com excedente</p>
                <p className="text-sm text-gray-400 mt-1">
                  Total: {formatCurrency(selectedGroup.totalAmount)} | Budget: {formatCurrency(selectedGroup.budget)}
                </p>
                {selectedGroup.justification && (
                  <p className="text-sm text-gray-300 mt-2">
                    <strong>Justificativa do Supervisor:</strong> {selectedGroup.justification}
                  </p>
                )}
              </div>
              
              <p className="text-gray-400 text-sm">
                Ao aprovar, as despesas serão finalizadas para pagamento.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmFinalApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar Final
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white text-red-400">Rejeitar Despesas</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedGroup?.workOrderNumber} - {selectedGroup?.technicianName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Motivo da Rejeição *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                className="bg-[#0a0a0a] border-gray-700 text-white"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
              variant="destructive"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
