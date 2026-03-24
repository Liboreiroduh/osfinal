import { User, WorkOrder, Vehicle, Expense, VehicleCheck, InstallationChecklist, ExpenseType, ExpenseGroupStatus } from '@/types';

// Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Administrador',
    email: 'admin@ledcollor.com.br',
    password: 'led123',
    role: 'MANAGER',
    permission: 'ADMIN',
    active: true,
    createdAt: Date.now() - 86400000 * 90,
  },
  {
    id: 'user-2',
    name: 'Supervisor',
    email: 'super@ledcollor.com.br',
    password: 'led123',
    role: 'SUPERVISOR',
    permission: 'SUPERVISOR',
    active: true,
    createdAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'user-3',
    name: 'Técnico',
    email: 'tec@ledcollor.com.br',
    password: 'led123',
    role: 'INSTALLER',
    permission: 'EDITOR',
    active: true,
    createdAt: Date.now() - 86400000 * 45,
  },
];

// Default Checklist Template - Factory function to avoid shared references
export const createDefaultChecklist = (): InstallationChecklist => ({
  structure: { conform: false, photo: undefined, notes: '' },
  power: { conform: false, photo: undefined, voltage: '', notes: '' },
  data: { conform: false, photo: undefined, notes: '' },
  epi: { conform: false, photo: undefined, notes: '' },
  processing: { quantityReceived: 0, batch: '', ok: false, notes: '', photo: undefined },
  modules: { quantityReceived: 0, batch: '', ok: false, notes: '', photo: undefined },
  peripherals: {
    CABO_AC: { checked: false, quantity: null },
    CABO_DC: { checked: false, quantity: null },
    CABO_DADOS: { checked: false, quantity: null },
    CHAPA: { checked: false, quantity: null },
    PARAFUSO: { checked: false, quantity: null },
    COMPUTADOR: { checked: false, quantity: null },
  },
  missingItems: { hasMissing: false, description: '', photo: undefined },
});

// Legacy export for compatibility
export const defaultChecklist: InstallationChecklist = createDefaultChecklist();

// Helper to generate dates
const today = new Date();
const getDateStr = (daysOffset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

// Work Orders - Vazio para começar do zero
export const mockWorkOrders: WorkOrder[] = [];

// Vehicle Checks - Vazio
export const mockVehicleChecks: VehicleCheck[] = [];

// Vehicles
export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    model: 'Fiorino Furgão 1.4',
    plate: 'ABC-1234',
    status: 'AVAILABLE',
    lastOdometer: 45480,
    nextMaintenanceOdometer: 55000,
    notes: 'Veículo em bom estado. Última revisão realizada em janeiro.',
    checks: mockVehicleChecks.filter(c => c.vehicleId === 'vehicle-1'),
    createdAt: Date.now() - 86400000 * 365,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'vehicle-2',
    model: 'Fiat Doblo Cargo 1.8',
    plate: 'DEF-5678',
    status: 'IN_USE',
    currentDriver: 'Pedro Costa',
    currentDriverId: 'user-4',
    lastOdometer: 78900,
    nextMaintenanceOdometer: 90000,
    notes: 'Carroceria ampla, ideal para painéis grandes.',
    checks: mockVehicleChecks.filter(c => c.vehicleId === 'vehicle-2'),
    createdAt: Date.now() - 86400000 * 200,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: 'vehicle-3',
    model: 'VW Saveiro Cross 1.6',
    plate: 'GHI-9012',
    status: 'IN_USE',
    currentDriver: 'Ana Lima',
    currentDriverId: 'user-5',
    lastOdometer: 32000,
    nextMaintenanceOdometer: 40000,
    notes: 'Picape para pequenos serviços e ferramentas.',
    checks: mockVehicleChecks.filter(c => c.vehicleId === 'vehicle-3'),
    createdAt: Date.now() - 86400000 * 150,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'vehicle-4',
    model: 'Ford Transit 350 2.2',
    plate: 'JKL-3456',
    status: 'MAINTENANCE',
    lastOdometer: 102500,
    nextMaintenanceOdometer: 110000,
    notes: 'Em manutenção - Troca de pneus e revisão do motor.',
    checks: mockVehicleChecks.filter(c => c.vehicleId === 'vehicle-4'),
    createdAt: Date.now() - 86400000 * 500,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'vehicle-5',
    model: 'Chevrolet S10 LS 2.8',
    plate: 'MNO-7890',
    status: 'AVAILABLE',
    lastOdometer: 67000,
    nextMaintenanceOdometer: 75000,
    notes: 'Disponível para viagens longas.',
    checks: [],
    createdAt: Date.now() - 86400000 * 300,
    updatedAt: Date.now() - 86400000 * 10,
  },
];

// Expenses - Vazio
export const mockExpenses: Expense[] = [];

// Service Types for dropdown - APENAS 3 TIPOS
export const serviceTypes = [
  { value: 'INSTALACAO', label: 'Instalação' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
  { value: 'TREINAMENTO', label: 'Treinamento' },
];

// Maintenance Subtypes
export const maintenanceSubtypes = [
  { value: 'PREVENTIVA', label: 'Preventiva' },
  { value: 'CORRETIVA', label: 'Corretiva' },
];

// Warranty Status
export const warrantyStatuses = [
  { value: 'IN_WARRANTY', label: 'Em Garantia' },
  { value: 'OUT_OF_WARRANTY', label: 'Fora da Garantia' },
];

// Intervention Types
export const interventionTypes = [
  { value: 'RMA', label: 'RMA - Manutenção na Peça' },
  { value: 'PART_REPLACEMENT', label: 'Troca de Peça Nova' },
];

// Status labels
export const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  BLOCKED: 'Bloqueada',
  CANCELLED: 'Cancelada',
  REOPENED: 'Reaberta',
};

// Expense Types - Novo sistema
export const expenseTypes: { value: ExpenseType; label: string }[] = [
  { value: 'ALIMENTACAO', label: 'Alimentação' },
  { value: 'HOSPEDAGEM', label: 'Hospedagem' },
  { value: 'GASOLINA', label: 'Gasolina' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'OUTROS', label: 'Outros' },
];

// Expense Type Labels
export const expenseTypeLabels: Record<ExpenseType, string> = {
  ALIMENTACAO: 'Alimentação',
  HOSPEDAGEM: 'Hospedagem',
  GASOLINA: 'Gasolina',
  TRANSPORTE: 'Transporte',
  OUTROS: 'Outros',
};

// Expense Group Status Labels
export const expenseGroupStatusLabels: Record<ExpenseGroupStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'gray' },
  PENDING: { label: 'Aguardando Aprovação', color: 'yellow' },
  APPROVED: { label: 'Aprovado', color: 'emerald' },
  PENDING_FINAL: { label: 'Pendente Final', color: 'amber' },
  FINAL_APPROVED: { label: 'Aprovado Final', color: 'emerald' },
  REJECTED: { label: 'Rejeitado', color: 'red' },
};

// Expense categories (legado - mantido para compatibilidade)
export const expenseCategories = [
  { value: 'COMBUSTIVEL', label: 'Combustível' },
  { value: 'ALIMENTACAO', label: 'Alimentação' },
  { value: 'HOSPEDAGEM', label: 'Hospedagem' },
  { value: 'PEDAGIO', label: 'Pedágio' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'OUTROS', label: 'Outros' },
];

// Peripheral items
export const peripheralItems = [
  'CABO_AC',
  'CABO_DC',
  'CABO_DADOS',
  'CHAPA',
  'PARAFUSO',
  'COMPUTADOR',
];

// Peripheral labels for display
export const peripheralLabels: Record<string, string> = {
  CABO_AC: 'Cabo AC',
  CABO_DC: 'Cabo DC',
  CABO_DADOS: 'Cabo de Dados',
  CHAPA: 'Chapa',
  PARAFUSO: 'Parafuso',
  COMPUTADOR: 'Computador',
};

// State options for Brazil
export const brazilianStates = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];
