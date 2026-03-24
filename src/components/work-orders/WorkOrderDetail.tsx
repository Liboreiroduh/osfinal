'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useWorkOrderStore } from '@/stores/workOrderStore';
import { WorkOrder, InstallationChecklist, MaintenanceDetails, TrainingDetails, MaintenancePart } from '@/types';
import { createDefaultChecklist, serviceTypes, statusLabels, maintenanceSubtypes, warrantyStatuses, interventionTypes } from '@/lib/mockData';
import { useUpload } from '@/hooks/useUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  ArrowLeft,
  Play,
  Pause,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
  Video,
  FileText,
  Wrench,
  Receipt,
  PenTool,
  AlertTriangle,
  Plus,
  Trash2,
  Image as ImageIcon,
  X,
  Upload,
  Check,
  Eye,
  Sparkles,
  DollarSign,
  Printer,
  Lock,
  Settings,
  Shield,
  Package,
  RotateCcw,
} from 'lucide-react';
import { peripheralLabels, peripheralItems } from '@/lib/mockData';
import { Peripherals } from '@/types';
import { SignaturePad } from '@/components/ui/SignaturePad';

interface WorkOrderDetailProps {
  orderId: string;
  onBack: () => void;
}

interface ChecklistItemState {
  conform: boolean;
  photo?: string;
  notes?: string;
  voltage?: string;
}

// ==================== MAINTENANCE FORM ====================
interface MaintenanceFormProps {
  order: WorkOrder;
  onUpdate: (data: Partial<WorkOrder>) => void;
}

function MaintenanceForm({ order, onUpdate }: MaintenanceFormProps) {
  const { isManager, isSupervisor } = useAuthStore();
  const canEditFields = isManager || isSupervisor;
  
  const [details, setDetails] = useState<MaintenanceDetails>(() => 
    order.maintenanceDetails || {
      subtype: 'CORRETIVA',
      warrantyStatus: 'OUT_OF_WARRANTY',
    }
  );
  
  const [newPart, setNewPart] = useState({ name: '', quantity: 1, notes: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading } = useUpload({ category: 'maintenance' });

  const updateDetails = (updates: Partial<MaintenanceDetails>) => {
    const newDetails = { ...details, ...updates };
    setDetails(newDetails);
    onUpdate({ maintenanceDetails: newDetails });
  };

  const addPart = (type: 'rma' | 'replacement') => {
    if (!newPart.name) return;
    
    const part: MaintenancePart = {
      id: `part-${Date.now()}`,
      name: newPart.name,
      quantity: newPart.quantity,
      notes: newPart.notes || undefined,
    };
    
    if (type === 'rma') {
      updateDetails({ rmaParts: [...(details.rmaParts || []), part] });
    } else {
      updateDetails({ replacementParts: [...(details.replacementParts || []), part] });
    }
    
    setNewPart({ name: '', quantity: 1, notes: '' });
  };

  const removePart = (type: 'rma' | 'replacement', partId: string) => {
    if (type === 'rma') {
      updateDetails({ rmaParts: details.rmaParts?.filter(p => p.id !== partId) });
    } else {
      updateDetails({ replacementParts: details.replacementParts?.filter(p => p.id !== partId) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtipo e Garantia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#111827] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Subtipo de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={details.subtype}
              onValueChange={(v) => updateDetails({ subtype: v as 'PREVENTIVA' | 'CORRETIVA' })}
            >
              <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700">
                {maintenanceSubtypes.map(st => (
                  <SelectItem key={st.value} value={st.value} className="text-white">
                    {st.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Status de Garantia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={details.warrantyStatus}
              onValueChange={(v) => updateDetails({ warrantyStatus: v as 'IN_WARRANTY' | 'OUT_OF_WARRANTY' })}
            >
              <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700">
                {warrantyStatuses.map(ws => (
                  <SelectItem key={ws.value} value={ws.value} className="text-white">
                    {ws.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Tipo de Intervenção */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" />
            Tipo de Intervenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={details.interventionType || ''}
            onValueChange={(v) => updateDetails({ interventionType: v as 'RMA' | 'PART_REPLACEMENT' })}
          >
            <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
              <SelectValue placeholder="Selecione o tipo de intervenção" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-gray-700">
              {interventionTypes.map(it => (
                <SelectItem key={it.value} value={it.value} className="text-white">
                  {it.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* RMA - Peças utilizadas na manutenção */}
          {details.interventionType === 'RMA' && (
            <div className="mt-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-300">Peças Utilizadas (Manutenção na Peça)</h4>
              
              {/* Lista de peças */}
              {(details.rmaParts || []).length > 0 && (
                <div className="space-y-2">
                  {details.rmaParts?.map(part => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{part.name}</p>
                        <p className="text-sm text-gray-400">Qtd: {part.quantity}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePart('rma', part.id)}
                        className="text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Adicionar peça */}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Nome da peça"
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
                <Button
                  onClick={() => addPart('rma')}
                  disabled={!newPart.name}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Troca de Peça - Justificativa e peças novas */}
          {details.interventionType === 'PART_REPLACEMENT' && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Justificativa da Troca *</Label>
                <Textarea
                  placeholder="Descreva o motivo da troca da peça..."
                  value={details.replacementJustification || ''}
                  onChange={(e) => updateDetails({ replacementJustification: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                  rows={3}
                />
              </div>
              
              <h4 className="text-sm font-medium text-gray-300">Peças Trocadas (Novas)</h4>
              
              {/* Lista de peças */}
              {(details.replacementParts || []).length > 0 && (
                <div className="space-y-2">
                  {details.replacementParts?.map(part => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{part.name}</p>
                        <p className="text-sm text-gray-400">Qtd: {part.quantity}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePart('replacement', part.id)}
                        className="text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Adicionar peça */}
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Nome da peça"
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="bg-[#0a0a0a] border-gray-700 text-white"
                />
                <Button
                  onClick={() => addPart('replacement')}
                  disabled={!newPart.name}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== TRAINING FORM ====================
interface TrainingFormProps {
  order: WorkOrder;
  onUpdate: (data: Partial<WorkOrder>) => void;
}

function TrainingForm({ order, onUpdate }: TrainingFormProps) {
  const [details, setDetails] = useState<TrainingDetails>(() => 
    order.trainingDetails || {
      summary: '',
      evidencePhotos: [],
      evidenceVideos: [],
    }
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const { uploadFile, uploading } = useUpload({ category: 'training' });

  const updateDetails = (updates: Partial<TrainingDetails>) => {
    const newDetails = { ...details, ...updates };
    setDetails(newDetails);
    onUpdate({ trainingDetails: newDetails });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await uploadFile(file);
    
    if (result.success && result.url) {
      if (uploadType === 'photo') {
        updateDetails({ evidencePhotos: [...details.evidencePhotos, result.url] });
      } else {
        updateDetails({ evidenceVideos: [...details.evidenceVideos, result.url] });
      }
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeMedia = (type: 'photo' | 'video', index: number) => {
    if (type === 'photo') {
      const newPhotos = details.evidencePhotos.filter((_, i) => i !== index);
      updateDetails({ evidencePhotos: newPhotos });
    } else {
      const newVideos = details.evidenceVideos.filter((_, i) => i !== index);
      updateDetails({ evidenceVideos: newVideos });
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo do Treinamento */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Resumo do Treinamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Cole aqui o resumo técnico do treinamento realizado..."
            value={details.summary}
            onChange={(e) => updateDetails({ summary: e.target.value })}
            className="bg-[#0a0a0a] border-gray-700 text-white min-h-[150px]"
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Evidências - Fotos */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            Fotos do Treinamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <Button
            onClick={() => {
              setUploadType('photo');
              fileInputRef.current?.click();
            }}
            disabled={uploading}
            variant="outline"
            className="border-gray-700 text-gray-300"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                Enviando...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Adicionar Foto
              </>
            )}
          </Button>
          
          {details.evidencePhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {details.evidencePhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg bg-gray-800 overflow-hidden">
                    <img
                      src={photo}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia('photo', index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evidências - Vídeos */}
      <Card className="bg-[#111827] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Video className="w-4 h-4 text-emerald-400" />
            Vídeos do Treinamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />
          
          <Button
            onClick={() => {
              setUploadType('video');
              videoInputRef.current?.click();
            }}
            disabled={uploading}
            variant="outline"
            className="border-gray-700 text-gray-300"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                Enviando...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Adicionar Vídeo
              </>
            )}
          </Button>
          
          {details.evidenceVideos.length > 0 && (
            <div className="space-y-2">
              {details.evidenceVideos.map((video, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-gray-400" />
                    <span className="text-white">Vídeo {index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(video, '_blank')}
                      className="text-emerald-400"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMedia('video', index)}
                      className="text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export function WorkOrderDetail({ orderId, onBack }: WorkOrderDetailProps) {
  const { session, isManager, canEdit } = useAuthStore();
  const { workOrders, updateWorkOrder, startService, pauseService, resumeService, completeService } = useWorkOrderStore();
  
  // Find order using useMemo to avoid setState in effect
  const order = useMemo(() => workOrders.find(wo => wo.id === orderId) || null, [orderId, workOrders]);
  
  const [activeTab, setActiveTab] = useState('summary');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(() => {
    if (!order) return false;
    const lastLog = order.timeLogs[order.timeLogs.length - 1];
    return lastLog && (lastLog.type === 'START' || lastLog.type === 'RESUME');
  });
  const [pauseReason, setPauseReason] = useState('');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  
  // Checklist state - initialize from order
  const [checklist, setChecklist] = useState<InstallationChecklist>(() => order?.checklist || createDefaultChecklist());
  
  // Photo upload modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoField, setCurrentPhotoField] = useState<string>('');
  const [pendingChecklistUpdate, setPendingChecklistUpdate] = useState<(() => void) | null>(null);
  
  // Photo preview modal state
  const [showPhotoPreviewModal, setShowPhotoPreviewModal] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>('');
  
  // Parts state
  const [newPart, setNewPart] = useState({ name: '', quantity: 1 });
  
  // Expenses state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [analyzingExpense, setAnalyzingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'OUTROS',
    receiptImage: '',
    notes: '',
  });
  
  // Signatures - initialize from order
  const [techSignature, setTechSignature] = useState<string>(() => order?.techSignature || '');
  const [clientSignature, setClientSignature] = useState<string>(() => order?.clientSignature || '');
  const [clientAccepted, setClientAccepted] = useState(() => order?.clientAccepted || false);
  
  // Report
  const [technicalReport, setTechnicalReport] = useState(() => order?.technicalReport || '');
  
  // Media - initialize from order
  const [photosBefore, setPhotosBefore] = useState<string[]>(() => order?.photosBefore || []);
  const [photosDuring, setPhotosDuring] = useState<string[]>(() => order?.photosDuring || []);
  const [photosAfter, setPhotosAfter] = useState<string[]>(() => order?.photosAfter || []);
  
  // File input refs for photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const expenseFileInputRef = useRef<HTMLInputElement>(null);
  const [currentMediaType, setCurrentMediaType] = useState<'before' | 'during' | 'after'>('before');
  
  // Upload hooks
  const checklistUpload = useUpload({ category: 'checklist' });
  const mediaUpload = useUpload({ category: 'media' });
  const expenseUpload = useUpload({ category: 'expenses' });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && order) {
      interval = setInterval(() => {
        const lastLog = order.timeLogs[order.timeLogs.length - 1];
        if (lastLog && (lastLog.type === 'START' || lastLog.type === 'RESUME')) {
          const elapsed = Math.floor((Date.now() - lastLog.timestamp) / 1000);
          setTimer(order.totalTime + elapsed);
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, order]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStart = async () => {
    let location = '';
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {
      // GPS not available
    }
    
    startService(orderId, location);
    setIsRunning(true);
  };

  const handlePause = () => {
    setShowPauseModal(true);
  };

  const confirmPause = async () => {
    if (!pauseReason.trim()) return;
    
    let location = '';
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {
      // GPS not available
    }
    
    pauseService(orderId, pauseReason, location);
    setIsRunning(false);
    setShowPauseModal(false);
    setPauseReason('');
  };

  const handleResume = async () => {
    let location = '';
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      location = `${pos.coords.latitude},${pos.coords.longitude}`;
    } catch {
      // GPS not available
    }
    
    resumeService(orderId, location);
    setIsRunning(true);
  };

  const canFinalize = () => {
    return (
      photosBefore.length > 0 &&
      photosDuring.length > 0 &&
      photosAfter.length > 0 &&
      (checklist.modules?.batch?.trim() !== '' || false) &&
      techSignature !== '' &&
      clientSignature !== '' &&
      clientAccepted
    );
  };

  const handleFinalize = () => {
    if (!canFinalize()) return;
    
    updateWorkOrder(orderId, {
      checklist,
      technicalReport,
      photosBefore,
      photosDuring,
      photosAfter,
      techSignature,
      clientSignature,
      clientAccepted,
    });
    
    completeService(orderId);
    setShowFinalizeModal(false);
  };

  const handleReopen = () => {
    if (!reopenReason.trim()) return;
    
    const { reopenService } = useWorkOrderStore.getState();
    reopenService(orderId, reopenReason);
    setShowReopenModal(false);
    setReopenReason('');
  };

  // Photo upload handlers
  const handlePhotoUpload = (field: string, updateFn: () => void) => {
    setCurrentPhotoField(field);
    setPendingChecklistUpdate(() => updateFn);
    setShowPhotoModal(true);
  };

  // Real photo capture/upload for checklist
  const handleChecklistPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await checklistUpload.uploadFile(file);
    
    if (result.success && result.url) {
      const photoUrl = result.url;
      
      // Add to during photos
      const newPhotosDuring = [...photosDuring, photoUrl];
      setPhotosDuring(newPhotosDuring);
      
      // Get the section from currentPhotoField (e.g., 'structure.conform' -> 'structure')
      const section = currentPhotoField.split('.')[0] as keyof InstallationChecklist;
      const field = currentPhotoField.split('.')[1];
      
      // Update checklist with photo URL and the field value
      setChecklist(prev => {
        const sectionData = (prev[section] || {}) as Record<string, unknown>;
        return {
          ...prev,
          [section]: { 
            ...sectionData, 
            photo: photoUrl,
            [field]: field === 'conform' ? true : (field === 'notes' ? '' : true)
          },
        };
      });
      
      // Save to store
      setTimeout(() => {
        updateWorkOrder(orderId, { 
          photosDuring: newPhotosDuring,
          checklist: {
            ...checklist,
            [section]: {
              ...(checklist[section] as Record<string, unknown>),
              photo: photoUrl,
              [field || 'conform']: field === 'conform' ? true : true
            }
          }
        });
      }, 0);
    }
    
    // Close modal and reset state
    setShowPhotoModal(false);
    setCurrentPhotoField('');
    setPendingChecklistUpdate(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChecklistItemChange = (
    section: keyof InstallationChecklist,
    field: string,
    value: boolean | string,
    requiresPhoto: boolean = true
  ) => {
    if (requiresPhoto && value === true) {
      // Require photo upload when marking as conform
      handlePhotoUpload(`${section}.${field}`, () => {
        const photoUrl = `photo_${section}_${Date.now()}.jpg`;
        setChecklist(prev => {
          const sectionData = (prev[section] || {}) as Record<string, unknown>;
          return {
            ...prev,
            [section]: { ...sectionData, [field]: value, photo: photoUrl },
          };
        });
      });
    } else if (requiresPhoto && typeof value === 'string' && value.trim() !== '') {
      // Require photo upload when filling text fields
      handlePhotoUpload(`${section}.${field}`, () => {
        const photoUrl = `photo_${section}_${Date.now()}.jpg`;
        setChecklist(prev => {
          const sectionData = (prev[section] || {}) as Record<string, unknown>;
          return {
            ...prev,
            [section]: { ...sectionData, [field]: value, photo: photoUrl },
          };
        });
      });
    } else {
      // Update without photo
      setChecklist(prev => {
        const sectionData = (prev[section] || {}) as Record<string, unknown>;
        return {
          ...prev,
          [section]: { ...sectionData, [field]: value },
        };
      });
    }
  };

  const saveChecklist = () => {
    updateWorkOrder(orderId, { checklist });
  };

  const addPart = () => {
    if (!newPart.name) return;
    
    const part = { id: `part-${Date.now()}`, name: newPart.name, quantity: newPart.quantity };
    updateWorkOrder(orderId, { parts: [...(order?.parts || []), part] });
    setNewPart({ name: '', quantity: 1 });
  };

  const removePart = (partId: string) => {
    updateWorkOrder(orderId, { parts: order?.parts.filter(p => p.id !== partId) || [] });
  };

  // Expense handlers - REMOVIDO: Despesas agora são gerenciadas no Financeiro
  // As funções addExpense, removeExpense, etc. foram removidas

  // Simulate photo upload for media tab
  const handleMediaPhotoUpload = (type: 'before' | 'during' | 'after') => {
    setCurrentMediaType(type);
    mediaFileInputRef.current?.click();
  };
  
  // Handle real media file upload
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await mediaUpload.uploadFile(file);
    
    if (result.success && result.url) {
      if (currentMediaType === 'before') {
        const updated = [...photosBefore, result.url];
        setPhotosBefore(updated);
        setTimeout(() => updateWorkOrder(orderId, { photosBefore: updated }), 0);
      } else if (currentMediaType === 'during') {
        const updated = [...photosDuring, result.url];
        setPhotosDuring(updated);
        setTimeout(() => updateWorkOrder(orderId, { photosDuring: updated }), 0);
      } else {
        const updated = [...photosAfter, result.url];
        setPhotosAfter(updated);
        setTimeout(() => updateWorkOrder(orderId, { photosAfter: updated }), 0);
      }
    }
    
    // Reset file input
    if (mediaFileInputRef.current) {
      mediaFileInputRef.current.value = '';
    }
  };

  const removePhoto = (type: 'before' | 'during' | 'after', index: number) => {
    if (type === 'before') {
      const newPhotos = photosBefore.filter((_, i) => i !== index);
      setPhotosBefore(newPhotos);
      setTimeout(() => updateWorkOrder(orderId, { photosBefore: newPhotos }), 0);
    } else if (type === 'during') {
      const newPhotos = photosDuring.filter((_, i) => i !== index);
      setPhotosDuring(newPhotos);
      setTimeout(() => updateWorkOrder(orderId, { photosDuring: newPhotos }), 0);
    } else {
      const newPhotos = photosAfter.filter((_, i) => i !== index);
      setPhotosAfter(newPhotos);
      setTimeout(() => updateWorkOrder(orderId, { photosAfter: newPhotos }), 0);
    }
  };

  // Print function with two versions
  const handlePrint = (type: 'client' | 'financial') => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return `${h}h ${m}m`;
    };

    // Get checked peripherals
    const checkedPeripherals = Object.entries(checklist.peripherals || {})
      .filter(([_, data]) => data?.checked)
      .map(([key, data]) => `${peripheralLabels[key] || key}: ${data?.quantity || 0}`)
      .join(', ');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>OS ${order.osNumber} - ${type === 'client' ? 'Via Cliente' : 'Via Financeiro'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { color: #10b981; font-size: 24px; }
          .header h2 { color: #666; font-size: 14px; margin-top: 5px; }
          .section { margin-bottom: 20px; }
          .section-title { background: #f3f4f6; padding: 8px 12px; font-weight: bold; margin-bottom: 10px; border-left: 4px solid #10b981; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .field { margin-bottom: 8px; }
          .field-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
          .field-value { font-size: 14px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-progress { background: #dbeafe; color: #1e40af; }
          .badge-completed { background: #d1fae5; color: #065f46; }
          .signature-box { border: 1px solid #d1d5db; height: 80px; margin: 10px 0; }
          .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
          .photo-placeholder { background: #f3f4f6; height: 100px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; }
          .expenses-section { ${type === 'client' ? 'display: none;' : ''} }
          .watermark { position: fixed; bottom: 20px; right: 20px; font-size: 10px; color: #9ca3af; }
          @media print { .watermark { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LEDCOLLOR Field Ops</h1>
          <h2>${order.osNumber} - ${type === 'client' ? 'Via Cliente' : 'Via Financeiro'}</h2>
        </div>

        <div class="section">
          <div class="section-title">Dados da Ordem de Serviço</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Status</div>
              <div class="field-value">
                <span class="badge badge-${order.status === 'PENDING' ? 'pending' : order.status === 'IN_PROGRESS' ? 'progress' : 'completed'}">
                  ${statusLabels[order.status]}
                </span>
              </div>
            </div>
            <div class="field">
              <div class="field-label">Tipo</div>
              <div class="field-value">${serviceTypes.find(st => st.value === order.type)?.label || order.type}</div>
            </div>
            <div class="field">
              <div class="field-label">Cliente</div>
              <div class="field-value">${order.client}</div>
            </div>
            <div class="field">
              <div class="field-label">Data</div>
              <div class="field-value">${new Date(order.date).toLocaleDateString('pt-BR')}</div>
            </div>
            <div class="field">
              <div class="field-label">Técnico</div>
              <div class="field-value">${order.assignedToName}</div>
            </div>
            <div class="field">
              <div class="field-label">Tempo Total</div>
              <div class="field-value">${formatTime(order.totalTime)}</div>
            </div>
          </div>
          <div class="field" style="margin-top: 10px;">
            <div class="field-label">Endereço</div>
            <div class="field-value">${order.address}</div>
          </div>
          <div class="field">
            <div class="field-label">Descrição</div>
            <div class="field-value">${order.description || '-'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contato</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Nome</div>
              <div class="field-value">${order.clientContact.name}</div>
            </div>
            <div class="field">
              <div class="field-label">Telefone</div>
              <div class="field-value">${order.clientContact.phone}</div>
            </div>
          </div>
        </div>

        ${order.productDetails ? `
        <div class="section">
          <div class="section-title">Dados do Produto</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Tipo</div>
              <div class="field-value">${order.productDetails.moduleType || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">Quantidade</div>
              <div class="field-value">${order.productDetails.moduleQuantity || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">Pixel Pitch</div>
              <div class="field-value">${order.productDetails.pixelPitch || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">Dimensões</div>
              <div class="field-value">${order.productDetails.width}x${order.productDetails.height}m</div>
            </div>
            <div class="field">
              <div class="field-label">Processadora</div>
              <div class="field-value">${order.productDetails.processorBrand || ''} ${order.productDetails.processorModel || ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Qtd Processadora</div>
              <div class="field-value">${order.productDetails.processorQuantity || '-'}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Checklist Técnico</div>
          <div class="grid">
            <div class="field">
              <div class="field-label">Estrutura</div>
              <div class="field-value">${checklist.structure?.conform ? '✅ Conforme' : '❌ Não Conforme'}</div>
            </div>
            <div class="field">
              <div class="field-label">Energia</div>
              <div class="field-value">${checklist.power?.conform ? '✅ Conforme' : '❌ Não Conforme'} ${checklist.power?.voltage ? `(${checklist.power.voltage}V)` : ''}</div>
            </div>
            <div class="field">
              <div class="field-label">Rede/Dados</div>
              <div class="field-value">${checklist.data?.conform ? '✅ Conforme' : '❌ Não Conforme'}</div>
            </div>
            <div class="field">
              <div class="field-label">Processadora</div>
              <div class="field-value">${checklist.processing?.ok ? '✅ OK' : '❌ Pendente'} - Lote: ${checklist.processing?.batch || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">Módulos/Gabinetes</div>
              <div class="field-value">${checklist.modules?.ok ? '✅ OK' : '❌ Pendente'} - Lote: ${checklist.modules?.batch || '-'}</div>
            </div>
            <div class="field">
              <div class="field-label">Periféricos</div>
              <div class="field-value">${checkedPeripherals || 'Nenhum'}</div>
            </div>
          </div>
          ${checklist.missingItems?.hasMissing ? `
          <div class="field" style="margin-top: 10px; color: #dc2626;">
            <div class="field-label">Itens Faltantes</div>
            <div class="field-value">${checklist.missingItems?.description || ''}</div>
          </div>
          ` : ''}
        </div>

        <div class="section expenses-section">
          <div class="section-title">Despesas ${type === 'client' ? '(Oculto na via do cliente)' : ''}</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Descrição</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Categoria</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #d1d5db;">Valor</th>
            </tr>
            ${(order.expenses || []).map(e => `
              <tr>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${e.description}</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">${expenseCategories.find(c => c.value === e.category)?.label || e.category}</td>
                <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right;">R$ ${e.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f3f4f6; font-weight: bold;">
              <td colspan="2" style="padding: 8px; border: 1px solid #d1d5db;">Total</td>
              <td style="padding: 8px; border: 1px solid #d1d5db; text-align: right;">R$ ${(order.expenses || []).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Relatório Técnico</div>
          <p style="white-space: pre-wrap;">${technicalReport || 'Não preenchido'}</p>
          <p style="margin-top: 10px;"><strong>Lote do Módulo:</strong> ${checklist.modules?.batch || '-'}</p>
        </div>

        <div class="section">
          <div class="section-title">Mídias</div>
          <div class="photos-grid">
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Antes (${photosBefore.length})</p>
              <div class="photo-placeholder">Fotos registradas</div>
            </div>
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Durante (${photosDuring.length})</p>
              <div class="photo-placeholder">Fotos registradas</div>
            </div>
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Depois (${photosAfter.length})</p>
              <div class="photo-placeholder">Fotos registradas</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Assinaturas</div>
          <div class="grid">
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Técnico</p>
              <div class="signature-box" style="background: ${techSignature ? '#f9fafb' : '#fff'};">
                ${techSignature ? '<img src="' + techSignature + '" style="max-width: 100%; max-height: 100%; object-fit: contain;">' : '<p style="text-align: center; line-height: 80px; color: #9ca3af;">Não assinado</p>'}
              </div>
            </div>
            <div>
              <p style="font-size: 12px; margin-bottom: 5px;">Cliente</p>
              <div class="signature-box" style="background: ${clientSignature ? '#f9fafb' : '#fff'};">
                ${clientSignature ? '<img src="' + clientSignature + '" style="max-width: 100%; max-height: 100%; object-fit: contain;">' : '<p style="text-align: center; line-height: 80px; color: #9ca3af;">Não assinado</p>'}
              </div>
            </div>
          </div>
          ${clientAccepted ? '<p style="margin-top: 10px; font-size: 12px; color: #065f46;">✅ Cliente confirmou aceite do serviço</p>' : ''}
        </div>

        <div class="watermark">
          Impresso em ${new Date().toLocaleString('pt-BR')} - LEDCOLLOR Field Ops
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'IN_PROGRESS': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'COMPLETED': return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'BLOCKED': return 'bg-red-600/20 text-red-400 border-red-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  // Check if photo URL is valid (not a fake URL from old system)
  const isValidPhotoUrl = (url: string): boolean => {
    if (!url) return false;
    // Valid URLs start with /uploads/, http, or data:
    return url.startsWith('/uploads/') || url.startsWith('http') || url.startsWith('data:');
  };

  // Check if checklist item has photo
  const hasPhoto = (section: keyof InstallationChecklist) => {
    const sectionData = checklist[section] as { photo?: string };
    return sectionData?.photo !== undefined && isValidPhotoUrl(sectionData?.photo || '');
  };
  
  // Open photo preview
  const openPhotoPreview = (url: string) => {
    if (!isValidPhotoUrl(url)) return;
    setPreviewPhotoUrl(url);
    setShowPhotoPreviewModal(true);
  };
  
  // Get photo URL from checklist section
  const getPhotoUrl = (section: keyof InstallationChecklist): string => {
    const sectionData = checklist[section] as { photo?: string };
    return sectionData?.photo || '';
  };

  if (!order) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-gray-400 hover:text-white w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-white">{order.osNumber}</h1>
            <Badge className={`${getStatusColor(order.status)} border`}>
              {statusLabels[order.status]}
            </Badge>
          </div>
          <p className="text-gray-400">{order.title}</p>
        </div>

        {/* Timer */}
        {order.status !== 'COMPLETED' && order.status !== 'PENDING' && (
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-mono text-white">{formatTime(timer)}</p>
              <p className="text-xs text-gray-500">Tempo de execução</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {order.status !== 'COMPLETED' && (
        <div className="flex flex-wrap gap-3">
          {order.status === 'PENDING' && (
            <Button onClick={handleStart} className="bg-emerald-600 hover:bg-emerald-700">
              <Play className="w-4 h-4 mr-2" />
              Iniciar Serviço
            </Button>
          )}
          
          {order.status === 'IN_PROGRESS' && isRunning && (
            <Button onClick={handlePause} variant="outline" className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20">
              <Pause className="w-4 h-4 mr-2" />
              Pausar Serviço
            </Button>
          )}
          
          {order.status === 'IN_PROGRESS' && !isRunning && (
            <Button onClick={handleResume} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              Retomar Serviço
            </Button>
          )}
          
          {order.status === 'IN_PROGRESS' && canFinalize() && (
            <Button onClick={() => setShowFinalizeModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Finalizar OS
            </Button>
          )}
        </div>
      )}

      {/* Reopen Button - Supervisor/Admin only for completed orders */}
      {order.status === 'COMPLETED' && (isManager || isSupervisor) && (
        <div className="flex gap-3">
          <Button
            onClick={() => setShowReopenModal(true)}
            variant="outline"
            className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reabrir OS
          </Button>
        </div>
      )}

      {/* Reopened Info */}
      {order.status === 'REOPENED' && order.reopenedBy && (
        <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>Reaberta por:</strong> {order.reopenedByName} em {new Date(order.reopenedAt!).toLocaleString('pt-BR')}
          </p>
          {order.reopenReason && (
            <p className="text-yellow-400/80 text-sm mt-1">
              <strong>Motivo:</strong> {order.reopenReason}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#111827] border border-gray-800 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="summary" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            Resumo
          </TabsTrigger>
          <TabsTrigger value="checklist" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            Checklist
            {checklist.structure?.photo && <Check className="w-3 h-3 ml-1 text-emerald-400" />}
          </TabsTrigger>
          {/* Tab específica por tipo */}
          {order.type === 'MANUTENCAO' && (
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              Manutenção
            </TabsTrigger>
          )}
          {order.type === 'TREINAMENTO' && (
            <TabsTrigger value="training" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              Treinamento
            </TabsTrigger>
          )}
          <TabsTrigger value="media" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            Mídias
          </TabsTrigger>
          <TabsTrigger value="peripherals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            Periféricos
          </TabsTrigger>
          <TabsTrigger value="signatures" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="report" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
            Relatório
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          {/* Dados Bloqueados - Aviso para técnicos */}
          {!isManager && (
            <div className="p-3 bg-amber-600/10 border border-amber-600/20 rounded-lg flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-amber-400 font-medium text-sm">Dados definidos pelo gerente</p>
                <p className="text-amber-400/70 text-xs">As informações abaixo são apenas para visualização e não podem ser editadas.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Order Info */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Dados da OS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Tipo</p>
                    <p className="text-white">{serviceTypes.find(st => st.value === order.type)?.label || order.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Data</p>
                    <p className="text-white">{new Date(order.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p className="text-white">{order.client}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Técnico</p>
                    <p className="text-white">{order.assignedToName}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Endereço</p>
                  <p className="text-white text-sm">{order.address}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Descrição</p>
                  <p className="text-white text-sm">{order.description}</p>
                </div>

                {order.productDetails && (
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-2">Detalhes do Produto</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-400">Tipo:</span> <span className="text-white">{order.productDetails.moduleType || '-'}</span></div>
                      <div><span className="text-gray-400">Quantidade:</span> <span className="text-white">{order.productDetails.moduleQuantity || '-'}</span></div>
                      <div><span className="text-gray-400">Pixel:</span> <span className="text-white">{order.productDetails.pixelPitch}</span></div>
                      <div><span className="text-gray-400">Dimensões:</span> <span className="text-white">{order.productDetails.width}x{order.productDetails.height}m</span></div>
                    </div>
                    {(order.productDetails.processorBrand || order.productDetails.processorModel) && (
                      <div className="mt-2 pt-2 border-t border-gray-800/50">
                        <p className="text-xs text-gray-500 mb-1">Processadora</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-400">Marca:</span> <span className="text-white">{order.productDetails.processorBrand || '-'}</span></div>
                          <div><span className="text-gray-400">Modelo:</span> <span className="text-white">{order.productDetails.processorModel || '-'}</span></div>
                          <div><span className="text-gray-400">Quantidade:</span> <span className="text-white">{order.productDetails.processorQuantity || '-'}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Nome</p>
                    <p className="text-white">{order.clientContact.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="text-white">{order.clientContact.phone}</p>
                  </div>
                </div>
                {order.clientContact.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">E-mail</p>
                      <p className="text-white">{order.clientContact.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Logs */}
            <Card className="bg-[#111827] border-gray-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-base">Histórico de Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.timeLogs.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum registro de tempo.</p>
                  ) : (
                    order.timeLogs.map((log) => (
                      <div key={log.id} className="flex items-center gap-3 p-2 rounded bg-gray-800/50">
                        <div className={`w-2 h-2 rounded-full ${
                          log.type === 'START' ? 'bg-green-500' :
                          log.type === 'PAUSE' ? 'bg-yellow-500' :
                          log.type === 'RESUME' ? 'bg-blue-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-white">
                            {log.type === 'START' ? 'Início' :
                             log.type === 'PAUSE' ? `Pausa: ${log.reason}` :
                             log.type === 'RESUME' ? 'Retomada' : 'Fim'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Checklist Tab - WITH AUTO PHOTO UPLOAD */}
        <TabsContent value="checklist" className="space-y-4 mt-4">
          <div className="p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg mb-4">
            <p className="text-blue-400 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Ao marcar cada item como conforme, será solicitado o upload de uma foto comprobatória.
            </p>
          </div>

          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Conferência Técnica de Instalação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Structure */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">1. Estrutura</h4>
                  {hasPhoto('structure') && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                      <Check className="w-3 h-3 mr-1" /> Foto anexada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={checklist.structure?.conform || false}
                      onCheckedChange={(checked) => handleChecklistItemChange('structure', 'conform', checked)}
                    />
                    <Label className="text-gray-300">Conforme</Label>
                  </div>
                  <Input
                    placeholder="Observações"
                    value={checklist.structure?.notes || ''}
                    onChange={(e) => handleChecklistItemChange('structure', 'notes', e.target.value, false)}
                    className="bg-[#0a0a0a] border-gray-700 text-white flex-1"
                  />
                  {checklist.structure?.photo && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-emerald-700 text-emerald-400"
                      onClick={() => openPhotoPreview(getPhotoUrl('structure'))}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Ver Foto
                    </Button>
                  )}
                </div>
              </div>

              {/* Power */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">2. Alimentação Elétrica</h4>
                  {hasPhoto('power') && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                      <Check className="w-3 h-3 mr-1" /> Foto anexada
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={checklist.power?.conform || false}
                      onCheckedChange={(checked) => handleChecklistItemChange('power', 'conform', checked)}
                    />
                    <Label className="text-gray-300">Conforme</Label>
                  </div>
                  <Input
                    placeholder="Tensão medida"
                    value={checklist.power?.voltage || ''}
                    onChange={(e) => handleChecklistItemChange('power', 'voltage', e.target.value, false)}
                    onBlur={() => {
                      // Salva ao sair do campo
                      if (checklist.power?.voltage) {
                        saveChecklist();
                      }
                    }}
                    className="bg-[#0a0a0a] border-gray-700 text-white"
                  />
                  <Input
                    placeholder="Observações"
                    value={checklist.power?.notes || ''}
                    onChange={(e) => handleChecklistItemChange('power', 'notes', e.target.value, false)}
                    className="bg-[#0a0a0a] border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Data */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">3. Rede/Dados</h4>
                  {hasPhoto('data') && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                      <Check className="w-3 h-3 mr-1" /> Foto anexada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={checklist.data?.conform || false}
                      onCheckedChange={(checked) => handleChecklistItemChange('data', 'conform', checked)}
                    />
                    <Label className="text-gray-300">Conforme</Label>
                  </div>
                  <Input
                    placeholder="Observações"
                    value={checklist.data?.notes || ''}
                    onChange={(e) => handleChecklistItemChange('data', 'notes', e.target.value, false)}
                    className="bg-[#0a0a0a] border-gray-700 text-white flex-1"
                  />
                </div>
              </div>

              {/* EPI */}
              {order.requiresEPI && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">4. EPI</h4>
                    {hasPhoto('epi') && (
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                        <Check className="w-3 h-3 mr-1" /> Foto anexada
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={checklist.epi?.conform || false}
                        onCheckedChange={(checked) => handleChecklistItemChange('epi', 'conform', checked)}
                      />
                      <Label className="text-gray-300">Conforme</Label>
                    </div>
                    <Input
                      placeholder="Observações sobre EPI"
                      value={checklist.epi?.notes || ''}
                      onChange={(e) => handleChecklistItemChange('epi', 'notes', e.target.value, false)}
                      className="bg-[#0a0a0a] border-gray-700 text-white flex-1"
                    />
                    {checklist.epi?.photo && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-emerald-700 text-emerald-400"
                        onClick={() => openPhotoPreview(getPhotoUrl('epi'))}
                      >
                        <Eye className="w-4 h-4 mr-1" /> Ver Foto
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Processing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">5. Processadora</h4>
                  {checklist.processing?.ok && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                      <Check className="w-3 h-3 mr-1" /> OK
                    </Badge>
                  )}
                </div>
                
                {/* Dados esperados - mostra marca/modelo/qtd da criação da OS */}
                {order.productDetails?.processorBrand && (
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Dados Esperados (conforme OS)</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Marca:</span>
                        <p className="text-white font-medium">{order.productDetails.processorBrand}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Modelo:</span>
                        <p className="text-white font-medium">{order.productDetails.processorModel || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Quantidade:</span>
                        <p className="text-white font-medium">{order.productDetails.processorQuantity || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-gray-500 text-xs">Quantidade Recebida</Label>
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={checklist.processing?.quantityReceived || 0}
                      onChange={(e) => setChecklist(prev => ({ 
                        ...prev, 
                        processing: { ...prev.processing, quantityReceived: parseInt(e.target.value) || 0 } 
                      }))}
                      className="bg-[#0a0a0a] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Lote</Label>
                    <Input
                      placeholder="Nº do Lote"
                      value={checklist.processing?.batch || ''}
                      onChange={(e) => setChecklist(prev => ({ 
                        ...prev, 
                        processing: { ...prev.processing, batch: e.target.value } 
                      }))}
                      className="bg-[#0a0a0a] border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2 pb-2">
                      <Switch
                        checked={checklist.processing?.ok || false}
                        onCheckedChange={(checked) => setChecklist(prev => ({ 
                          ...prev, 
                          processing: { ...prev.processing, ok: checked } 
                        }))}
                      />
                      <Label className="text-gray-300">OK</Label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Observações</Label>
                    <Input
                      placeholder="Obs"
                      value={checklist.processing?.notes || ''}
                      onChange={(e) => setChecklist(prev => ({ 
                        ...prev, 
                        processing: { ...prev.processing, notes: e.target.value } 
                      }))}
                      className="bg-[#0a0a0a] border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">6. Módulos/Gabinetes</h4>
                  {checklist.modules?.ok && (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                      <Check className="w-3 h-3 mr-1" /> OK
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-gray-500 text-xs">Quantidade Recebida</Label>
                    <Input
                      type="number"
                      placeholder="Qtd"
                      value={checklist.modules?.quantityReceived || 0}
                      onChange={(e) => setChecklist(prev => ({ 
                        ...prev, 
                        modules: { ...prev.modules, quantityReceived: parseInt(e.target.value) || 0 } 
                      }))}
                      className="bg-[#0a0a0a] border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Lote</Label>
                    <Input
                      placeholder="Nº do Lote"
                      value={checklist.modules?.batch || ''}
                      onChange={(e) => setChecklist(prev => ({ 
                        ...prev, 
                        modules: { ...prev.modules, batch: e.target.value } 
                      }))}
                      className="bg-[#0a0a0a] border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2 pb-2">
                      <Switch
                        checked={checklist.modules?.ok || false}
                        onCheckedChange={(checked) => setChecklist(prev => ({ 
                          ...prev, 
                          modules: { ...prev.modules, ok: checked } 
                        }))}
                      />
                      <Label className="text-gray-300">OK</Label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Observações</Label>
                    <Input
                      placeholder="Obs"
                      value={checklist.modules?.notes || ''}
                      onChange={(e) => setChecklist(prev => ({ 
                        ...prev, 
                        modules: { ...prev.modules, notes: e.target.value } 
                      }))}
                      className="bg-[#0a0a0a] border-gray-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Missing Items */}
              <div className="space-y-3">
                <h4 className="font-medium text-white">Itens Faltantes</h4>
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 mt-2">
                    <Switch
                      checked={checklist.missingItems?.hasMissing || false}
                      onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, missingItems: { ...prev.missingItems, hasMissing: checked } }))}
                    />
                    <Label className="text-gray-300">Possui itens faltantes</Label>
                  </div>
                  {checklist.missingItems?.hasMissing && (
                    <Textarea
                      placeholder="Descreva os itens faltantes"
                      value={checklist.missingItems?.description || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, missingItems: { ...prev.missingItems, description: e.target.value } }))}
                      className="bg-[#0a0a0a] border-gray-700 text-white flex-1"
                    />
                  )}
                </div>
              </div>

              <Button onClick={saveChecklist} className="bg-emerald-600 hover:bg-emerald-700">
                Salvar Checklist
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4 mt-4">
          {/* Hidden file inputs */}
          <input
            type="file"
            ref={mediaFileInputRef}
            onChange={handleMediaFileUpload}
            accept="image/*,video/*"
            className="hidden"
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Before */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  Antes ({photosBefore.length})
                  <Button 
                    onClick={() => handleMediaPhotoUpload('before')} 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={mediaUpload.uploading}
                  >
                    {mediaUpload.uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1" />
                    ) : (
                      <Camera className="w-4 h-4 mr-1" />
                    )}
                    Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {photosBefore.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => openPhotoPreview(photo)}
                    >
                      {isValidPhotoUrl(photo) ? (
                        <img 
                          src={photo} 
                          alt={`Foto antes ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto('before', index);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {photosBefore.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                      Nenhuma foto
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* During */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  Durante ({photosDuring.length})
                  <Button 
                    onClick={() => handleMediaPhotoUpload('during')} 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={mediaUpload.uploading}
                  >
                    {mediaUpload.uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1" />
                    ) : (
                      <Camera className="w-4 h-4 mr-1" />
                    )}
                    Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {photosDuring.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => openPhotoPreview(photo)}
                    >
                      {isValidPhotoUrl(photo) ? (
                        <img 
                          src={photo} 
                          alt={`Foto durante ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto('during', index);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {photosDuring.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                      Nenhuma foto
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* After */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center justify-between">
                  Depois ({photosAfter.length})
                  <Button 
                    onClick={() => handleMediaPhotoUpload('after')} 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={mediaUpload.uploading}
                  >
                    {mediaUpload.uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1" />
                    ) : (
                      <Camera className="w-4 h-4 mr-1" />
                    )}
                    Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {photosAfter.map((photo, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => openPhotoPreview(photo)}
                    >
                      {isValidPhotoUrl(photo) ? (
                        <img 
                          src={photo} 
                          alt={`Foto depois ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto('after', index);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {photosAfter.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                      Nenhuma foto
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
            <p className="text-yellow-400 text-sm">
              * É obrigatório enviar pelo menos uma foto para cada etapa (Antes, Durante, Depois) para finalizar a OS.
            </p>
          </div>
        </TabsContent>

        {/* Peripherals Tab - CHECKBOX DINÂMICO */}
        <TabsContent value="peripherals" className="space-y-4 mt-4">
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Periféricos</CardTitle>
              <p className="text-sm text-gray-400">Marque os itens utilizados e informe a quantidade</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {peripheralItems.map((item) => {
                const peripheralKey = item as keyof Peripherals;
                const itemData = checklist.peripherals?.[peripheralKey];
                
                return (
                  <div key={item} className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <Switch
                        checked={itemData?.checked || false}
                        onCheckedChange={(checked) => {
                          setChecklist(prev => ({
                            ...prev,
                            peripherals: {
                              ...prev.peripherals,
                              [peripheralKey]: {
                                checked,
                                quantity: checked ? (itemData?.quantity || 1) : null,
                              },
                            },
                          }));
                        }}
                      />
                      <Label className="text-gray-300 cursor-pointer">
                        {peripheralLabels[item]}
                      </Label>
                    </div>
                    
                    {itemData?.checked && (
                      <div className="flex items-center gap-2">
                        <Label className="text-gray-500 text-sm">Qtd:</Label>
                        <Input
                          type="number"
                          min={1}
                          value={itemData.quantity || 1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setChecklist(prev => ({
                              ...prev,
                              peripherals: {
                                ...prev.peripherals,
                                [peripheralKey]: {
                                  ...prev.peripherals[peripheralKey],
                                  quantity: value > 0 ? value : 1,
                                },
                              },
                            }));
                          }}
                          className="bg-[#0a0a0a] border-gray-700 text-white w-20 h-8"
                        />
                      </div>
                    )}
                    
                    {itemData?.checked && (
                      <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                        <Check className="w-3 h-3 mr-1" /> Selecionado
                      </Badge>
                    )}
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-500">
                  * Apenas itens marcados com quantidade serão salvos.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Button onClick={saveChecklist} className="bg-emerald-600 hover:bg-emerald-700">
            Salvar Periféricos
          </Button>
        </TabsContent>

        {/* Expenses Tab - REMOVIDO - Despesas agora são lançadas no Financeiro */}

        {/* Maintenance Tab - Específico para tipo MANUTENCAO */}
        {order.type === 'MANUTENCAO' && (
          <TabsContent value="maintenance" className="space-y-4 mt-4">
            <MaintenanceForm 
              order={order} 
              onUpdate={(data) => updateWorkOrder(orderId, data)}
            />
          </TabsContent>
        )}

        {/* Training Tab - Específico para tipo TREINAMENTO */}
        {order.type === 'TREINAMENTO' && (
          <TabsContent value="training" className="space-y-4 mt-4">
            <TrainingForm 
              order={order} 
              onUpdate={(data) => updateWorkOrder(orderId, data)}
            />
          </TabsContent>
        )}

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tech Signature */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Assinatura do Técnico</CardTitle>
              </CardHeader>
              <CardContent>
                <SignaturePad
                  value={techSignature}
                  onChange={(signature) => {
                    setTechSignature(signature);
                    if (signature) {
                      updateWorkOrder(orderId, { techSignature: signature });
                    }
                  }}
                  label="Use o dedo ou mouse para assinar"
                  placeholder="Toque ou clique para assinar"
                />
              </CardContent>
            </Card>

            {/* Client Signature */}
            <Card className="bg-[#111827] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Assinatura do Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <SignaturePad
                  value={clientSignature}
                  onChange={(signature) => {
                    setClientSignature(signature);
                    if (signature) {
                      updateWorkOrder(orderId, { clientSignature: signature });
                    }
                  }}
                  label="Cliente deve assinar aqui"
                  placeholder="Toque ou clique para assinar"
                />
              </CardContent>
            </Card>
          </div>

          {/* Accept Terms */}
          <Card className="bg-[#111827] border-gray-800">
            <CardContent className="p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientAccepted}
                  onChange={(e) => {
                    setClientAccepted(e.target.checked);
                    updateWorkOrder(orderId, { clientAccepted: e.target.checked });
                  }}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 accent-emerald-500"
                />
                <div>
                  <p className="text-white font-medium">Aceite do Cliente</p>
                  <p className="text-gray-400 text-sm">
                    Declaro que o serviço foi realizado conforme especificado e estou satisfeito com o resultado.
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>
          
          <div className="p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
            <p className="text-yellow-400 text-sm">
              * Ambas as assinaturas e o aceite do cliente são obrigatórios para finalizar a OS.
            </p>
          </div>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="space-y-4 mt-4">
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Relatório Técnico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mostra o lote do checklist (somente leitura) */}
              <div className="space-y-2">
                <Label className="text-gray-300">Lote do Módulo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={checklist.modules?.batch || ''}
                    disabled
                    placeholder="Preencha no checklist (Módulos/Gabinetes)"
                    className="bg-[#0a0a0a] border-gray-700 text-white disabled:opacity-70"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('checklist')}
                    className="border-gray-700 text-gray-300 whitespace-nowrap"
                  >
                    Editar
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Preenchido na aba Checklist → Módulos/Gabinetes</p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Relatório Final</Label>
                <Textarea
                  value={technicalReport}
                  onChange={(e) => setTechnicalReport(e.target.value)}
                  placeholder="Descreva o trabalho realizado, observações técnicas e recomendações..."
                  className="bg-[#0a0a0a] border-gray-700 text-white min-h-[150px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Validation Summary */}
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Checklist de Finalização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {photosBefore.length > 0 ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className={photosBefore.length > 0 ? 'text-white' : 'text-gray-500'}>Foto(s) Antes</span>
                </div>
                <div className="flex items-center gap-2">
                  {photosDuring.length > 0 ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className={photosDuring.length > 0 ? 'text-white' : 'text-gray-500'}>Foto(s) Durante</span>
                </div>
                <div className="flex items-center gap-2">
                  {photosAfter.length > 0 ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className={photosAfter.length > 0 ? 'text-white' : 'text-gray-500'}>Foto(s) Depois</span>
                </div>
                <div className="flex items-center gap-2">
                  {checklist.modules?.batch ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className={checklist.modules?.batch ? 'text-white' : 'text-gray-500'}>Lote do Módulo</span>
                </div>
                <div className="flex items-center gap-2">
                  {techSignature ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className={techSignature ? 'text-white' : 'text-gray-500'}>Assinatura Técnico</span>
                </div>
                <div className="flex items-center gap-2">
                  {clientSignature ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className={clientSignature ? 'text-white' : 'text-gray-500'}>Assinatura Cliente</span>
                </div>
                <div className="flex items-center gap-2">
                  {clientAccepted ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className={clientAccepted ? 'text-white' : 'text-gray-500'}>Aceite do Cliente</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Print Buttons */}
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Impressão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-400">
                Selecione o tipo de relatório para impressão:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handlePrint('client')}
                  variant="outline"
                  className="flex-1 border-emerald-700 text-emerald-400 hover:bg-emerald-900/20"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Via Cliente
                </Button>
                <Button
                  onClick={() => handlePrint('financial')}
                  variant="outline"
                  className="flex-1 border-blue-700 text-blue-400 hover:bg-blue-900/20"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Via Financeiro
                </Button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="text-emerald-400">Via Cliente:</span> Relatório completo sem valores de despesas</p>
                <p><span className="text-blue-400">Via Financeiro:</span> Relatório completo com todas as despesas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pause Modal */}
      <Dialog open={showPauseModal} onOpenChange={setShowPauseModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Pausar Serviço</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-gray-300">Motivo da Pausa *</Label>
            <Textarea
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Descreva o motivo da pausa..."
              className="bg-[#0a0a0a] border-gray-700 text-white mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPauseModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmPause}
              disabled={!pauseReason.trim()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Confirmar Pausa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finalize Modal */}
      <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Finalizar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-400 text-sm mb-4">
              Ao finalizar, a OS será marcada como concluída e não poderá ser editada.
            </p>
            <div className="p-3 bg-emerald-600/10 border border-emerald-600/20 rounded-lg">
              <p className="text-emerald-400 text-sm">
                Todos os requisitos foram atendidos. Deseja confirmar a finalização?
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalizeModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFinalize}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Finalização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Modal */}
      <Dialog open={showReopenModal} onOpenChange={setShowReopenModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Reabrir Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-gray-400 text-sm">
              Esta OS será reaberta para que o técnico possa fazer correções ou complementar informações.
            </p>
            <div className="space-y-2">
              <Label className="text-gray-300">Motivo da Reabertura *</Label>
              <Textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Descreva o motivo da reabertura..."
                className="bg-[#0a0a0a] border-gray-700 text-white"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReopenModal(false);
                setReopenReason('');
              }}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReopen}
              disabled={!reopenReason.trim()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Confirmar Reabertura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Upload Modal */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              Anexar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-gray-400 text-sm">
              Selecione ou tire uma foto para documentar este item do checklist.
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleChecklistPhotoUpload}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            
            <label className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-700 cursor-pointer hover:border-emerald-600 transition-colors">
              <div className="text-center">
                {checklistUpload.uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Enviando... {checklistUpload.progress}%</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Clique para selecionar foto</p>
                    <p className="text-gray-600 text-xs mt-1">JPG, PNG, WEBP (máx 50MB)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                onChange={handleChecklistPhotoUpload}
                accept="image/*"
                capture="environment"
                className="hidden"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPhotoModal(false);
                setCurrentPhotoField('');
                setPendingChecklistUpdate(null);
              }}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="max-w-md bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              Nova Despesa
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* OCR Button */}
            <Button
              onClick={handleOCRAnalysis}
              disabled={analyzingExpense}
              variant="outline"
              className="w-full border-purple-700 text-purple-400 hover:bg-purple-900/20"
            >
              {analyzingExpense ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-400 mr-2" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ler Comprovante com IA
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1a1a1a] px-2 text-gray-500">ou preencha manualmente</span>
              </div>
            </div>

            {/* Receipt Photo */}
            <input
              type="file"
              ref={expenseFileInputRef}
              onChange={handleExpenseFileUpload}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            
            <div className="space-y-2">
              <Label className="text-gray-300">Foto do Comprovante</Label>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleExpensePhotoUpload}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300"
                  disabled={expenseUpload.uploading}
                >
                  {expenseUpload.uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400 mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      {newExpense.receiptImage ? 'Trocar Foto' : 'Tirar Foto'}
                    </>
                  )}
                </Button>
                {newExpense.receiptImage && (
                  <div className="flex items-center gap-2">
                    {isValidPhotoUrl(newExpense.receiptImage) && (
                      <img 
                        src={newExpense.receiptImage} 
                        alt="Comprovante" 
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                      <Check className="w-3 h-3 mr-1" /> Anexada
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Descrição *</Label>
              <Input
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da despesa"
                className="bg-[#0a0a0a] border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-gray-300">Categoria</Label>
                <Select value={newExpense.category} onValueChange={(v) => setNewExpense(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="bg-[#0a0a0a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <p className="text-blue-400 text-xs">
                Esta despesa será vinculada à OS {order?.osNumber} e aparecerá no relatório final.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowExpenseModal(false);
                setNewExpense({ description: '', amount: '', category: 'OUTROS', receiptImage: '', notes: '' });
              }}
              className="border-gray-700 text-gray-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={addExpense}
              disabled={!newExpense.description || !newExpense.amount}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Adicionar Despesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Photo Preview Modal */}
      <Dialog open={showPhotoPreviewModal} onOpenChange={setShowPhotoPreviewModal}>
        <DialogContent className="max-w-3xl bg-[#1a1a1a] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              Visualizar Foto
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {previewPhotoUrl && (
              <div className="relative w-full max-h-[70vh] overflow-hidden rounded-lg bg-gray-900 flex items-center justify-center">
                <img 
                  src={previewPhotoUrl} 
                  alt="Foto" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPhotoPreviewModal(false)}
              className="border-gray-700 text-gray-300"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
