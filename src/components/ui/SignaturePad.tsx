'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Check, RotateCcw, PenTool } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  label: string;
  placeholder?: string;
}

export function SignaturePad({ value, onChange, label, placeholder = 'Assine aqui' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas size
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '200px';
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, rect.width, 200);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initCanvas();
    
    const handleResize = () => {
      initCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  // Get position from event
  const getPosition = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return null;
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPosition(e);
    if (!pos) return;
    
    setIsDrawing(true);
    setHasDrawn(true);
    lastPosRef.current = pos;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  // Draw
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const pos = getPosition(e);
    if (!pos) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    lastPosRef.current = pos;
  };

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  // Clear signature
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const rect = container.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, rect.width, 200);
    }
    setHasDrawn(false);
    onChange('');
  };

  // Save signature
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    
    const data = canvas.toDataURL('image/png');
    onChange(data);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400 flex items-center gap-2">
        <PenTool className="w-4 h-4" />
        {label}
      </p>
      
      {value ? (
        // Show saved signature
        <div className="space-y-3">
          <div className="relative bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden">
            <img 
              src={value} 
              alt="Assinatura" 
              className="w-full h-[200px] object-contain"
            />
          </div>
          <Button
            onClick={clearSignature}
            variant="outline"
            className="w-full border-gray-700 text-gray-300"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Assinar Novamente
          </Button>
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> Assinatura capturada
          </p>
        </div>
      ) : (
        // Show canvas for drawing
        <div className="space-y-3">
          <div 
            ref={containerRef}
            className="relative bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden touch-none"
          >
            <canvas
              ref={canvasRef}
              className="touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-600 text-sm">{placeholder}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={clearSignature}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              onClick={saveSignature}
              disabled={!hasDrawn}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
