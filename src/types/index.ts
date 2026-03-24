// User Types
export type UserRole = 'MANAGER' | 'INSTALLER' | 'SUPERVISOR';
export type UserPermission = 'ADMIN' | 'SUPERVISOR' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: UserRole;
  permission: UserPermission;
  active: boolean;
  createdAt: number;
}

// Work Order Types - APENAS 3 TIPOS
export type ServiceType = 'INSTALACAO' | 'MANUTENCAO' | 'TREINAMENTO';
export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED' | 'REOPENED';

// Manutenção - Subtipos e campos específicos
export type MaintenanceSubtype = 'PREVENTIVA' | 'CORRETIVA';
export type WarrantyStatus = 'IN_WARRANTY' | 'OUT_OF_WARRANTY';
export type InterventionType = 'RMA' | 'PART_REPLACEMENT';

// Peça utilizada em manutenção
export interface MaintenancePart {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

// Detalhes específicos de Manutenção
export interface MaintenanceDetails {
  subtype: MaintenanceSubtype;
  warrantyStatus: WarrantyStatus;
  interventionType?: InterventionType;
  
  // Se RMA - peças utilizadas na manutenção da peça
  rmaParts?: MaintenancePart[];
  
  // Se Troca de Peça - justificativa e peças novas
  replacementJustification?: string;
  replacementParts?: MaintenancePart[];
}

// Detalhes específicos de Treinamento
export interface TrainingDetails {
  summary: string; // Resumo técnico colado das calls
  evidencePhotos: string[]; // Fotos do treinamento
  evidenceVideos: string[]; // Vídeos do treinamento
}

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface StructuredAddress {
  state: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  district?: string;
  zipCode: string;
  reference?: string;
}

export interface ProductDetails {
  type: 'IN' | 'OUT';
  pixelPitch: string;
  width: number;
  height: number;
  cabinetCount?: number;
  reportedProblem?: string;
  // Novos campos para criação da OS
  moduleType?: 'MODULO' | 'GABINETE';
  moduleQuantity?: number;
  processorBrand?: string;
  processorModel?: string;
  processorQuantity?: number;
}

export interface TimeLogEntry {
  id: string;
  type: 'START' | 'PAUSE' | 'RESUME' | 'END';
  timestamp: number;
  location?: string;
  reason?: string;
}

export interface WorkOrderPart {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

// Novo sistema de despesas
export type ExpenseType = 'ALIMENTACAO' | 'HOSPEDAGEM' | 'GASOLINA' | 'TRANSPORTE' | 'OUTROS';

export type ExpenseGroupStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PENDING_FINAL' | 'FINAL_APPROVED' | 'REJECTED';

export interface ExpenseItem {
  id: string;
  expenseGroupId: string;
  type: ExpenseType;
  customType?: string;
  description: string;
  amount: number;
  receiptPhoto: string;
  date: number;
  createdBy: string;
  createdByName: string;
}

export interface ExpenseGroup {
  id: string;
  workOrderId: string;
  workOrderNumber: string;
  technicianId: string;
  technicianName: string;
  budget: number;
  totalAmount: number;
  status: ExpenseGroupStatus;
  expenses: ExpenseItem[];
  
  // Aprovação do Supervisor
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  justification?: string; // Justificativa quando acima do budget
  
  // Aprovação final do Admin (quando acima do budget)
  finalApprovedBy?: string;
  finalApprovedByName?: string;
  finalApprovedAt?: number;
  
  // Rejeição (pode ser feita por Supervisor ou Admin)
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: number;
  rejectionReason?: string;
  
  completedAt: number;
  createdAt: number;
  updatedAt: number;
}

// Despesa antiga (mantida para compatibilidade durante transição)
export interface WorkOrderExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  receiptImage?: string;
  date: number;
}

export interface PeripheralItem {
  checked: boolean;
  quantity: number | null;
}

export interface Peripherals {
  CABO_AC: PeripheralItem;
  CABO_DC: PeripheralItem;
  CABO_DADOS: PeripheralItem;
  CHAPA: PeripheralItem;
  PARAFUSO: PeripheralItem;
  COMPUTADOR: PeripheralItem;
}

export interface InstallationChecklist {
  structure: { conform: boolean; photo?: string; notes?: string };
  power: { conform: boolean; photo?: string; voltage?: string; notes?: string };
  data: { conform: boolean; photo?: string; notes?: string };
  epi: { conform: boolean; photo?: string; notes?: string };
  processing: { quantityReceived: number; batch: string; ok: boolean; notes?: string; photo?: string };
  modules: { quantityReceived: number; batch: string; ok: boolean; notes?: string; photo?: string };
  peripherals: Peripherals;
  missingItems: { hasMissing: boolean; description: string; photo?: string };
}

export interface CompletionData {
  materialSealed: boolean;
  materialVerified: boolean;
  damageSuspected: boolean;
  structureCondition: string;
  installationPerfect: boolean;
  cablesOrganized: boolean;
  powerStable: boolean;
  powerBoardCondition: string;
  voltageMeasured: string;
  processorModel: string;
  computerInstalled: boolean;
  mappingSolidified: boolean;
  brightnessAdjusted: boolean;
  redundancyConfigured: boolean;
  redundancyJustification?: string;
  trainingGiven: boolean;
  traineeName?: string;
  remoteAccess?: string;
  defectiveModules: boolean;
  defectiveCount?: number;
  defectiveDestination?: string;
  backupKitDelivered: boolean;
  backupKitContent?: string;
  spareFilesCreated: boolean;
  sparePartsPhotos?: string[];
  powerOrientations?: string;
  processorOrientations?: string;
  supervisorName?: string;
}

export interface WorkOrder {
  id: string;
  osNumber: string;
  type: ServiceType;
  // title REMOVIDO - era redundante com o tipo de serviço
  
  client: string;
  clientContact: ContactInfo;
  address: string;
  structuredAddress?: StructuredAddress;
  description: string;
  status: WorkOrderStatus;
  assignedToUserId: string;
  assignedToName: string;
  assignedToEmail: string;
  date: string;
  requiresEPI: boolean;
  timeLogs: TimeLogEntry[];
  totalTime: number;
  productDetails?: ProductDetails;
  parts: WorkOrderPart[];
  
  // Campos específicos por tipo
  maintenanceDetails?: MaintenanceDetails; // Para MANUTENCAO
  trainingDetails?: TrainingDetails; // Para TREINAMENTO
  
  technicalReport?: string;
  moduleBatch?: string;
  executionLocation?: string;
  photosBefore: string[];
  photosDuring: string[];
  photosAfter: string[];
  videosBefore: string[];
  videosDuring: string[];
  videosAfter: string[];
  checklist?: InstallationChecklist;
  completionData?: CompletionData;
  techSignature?: string;
  clientSignature?: string;
  clientAccepted: boolean;
  
  // Orçamento de despesas
  expenseBudget: number;
  
  // Controle de reabertura
  reopenedBy?: string;
  reopenedByName?: string;
  reopenedAt?: number;
  reopenReason?: string;
  
  createdAt: number;
  updatedAt: number;
}

// Vehicle Types
export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
export type VehicleCheckType = 'CHECK_OUT' | 'CHECK_IN' | 'MAINTENANCE';

export interface VehicleChecklist {
  tires: boolean;
  mirrors: boolean;
  lights: boolean;
  fluids: boolean;
  brakes: boolean;
}

export interface VehicleCheck {
  id: string;
  vehicleId: string;
  userId: string;
  userName: string;
  type: VehicleCheckType;
  timestamp: number;
  odometer: number;
  fuelLevel: number;
  destination?: string;
  reason?: string;
  photos: string[];
  video?: string;
  checklist: VehicleChecklist;
  checklistSignature: boolean;
  cost?: number;
  provider?: string;
  budgetPhoto?: string;
  maintenanceDate?: string;
}

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  status: VehicleStatus;
  currentDriver?: string;
  currentDriverId?: string;
  lastOdometer: number;
  nextMaintenanceOdometer?: number;
  notes?: string;
  checks: VehicleCheck[];
  createdAt: number;
  updatedAt: number;
}

// Notification Types
export type NotificationType = 'EXPENSE_APPROVAL_NEEDED' | 'EXPENSE_APPROVED' | 'EXPENSE_REJECTED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  workOrderId?: string;
  workOrderNumber?: string;
  expenseGroupId?: string;
  read: boolean;
  createdAt: number;
}

// App Settings
export interface AppSettings {
  financeEmail: string;
  newAssignments: boolean;
  statusUpdates: boolean;
  deadlines: boolean;
}

// Session
export interface Session {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  permission: UserPermission;
  avatar?: string;
  loginAt: number;
}
