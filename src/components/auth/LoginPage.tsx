'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Monitor, User, Shield, Wrench } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    }
    
    setLoading(false);
  };

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    setError('');
    setLoading(true);
    
    const result = await login(userEmail, userPassword);
    
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111827] to-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 mb-4 shadow-lg shadow-emerald-500/20">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">LEDCOLLOR</h1>
          <p className="text-gray-400 text-sm">Field Operations System</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Acesso ao Sistema</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-[#0a0a0a] border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-[#0a0a0a] border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Quick Login Buttons - TEMPORÁRIO PARA TESTES */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-3 text-center">Login rápido (apenas para testes)</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin('admin@ledcollor.com.br', 'led123')}
                disabled={loading}
                className="border-purple-600/50 text-purple-400 hover:bg-purple-600/20 flex flex-col items-center py-3 h-auto"
              >
                <Shield className="w-5 h-5 mb-1" />
                <span className="text-xs">Admin</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin('super@ledcollor.com.br', 'led123')}
                disabled={loading}
                className="border-blue-600/50 text-blue-400 hover:bg-blue-600/20 flex flex-col items-center py-3 h-auto"
              >
                <User className="w-5 h-5 mb-1" />
                <span className="text-xs">Supervisor</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin('tec@ledcollor.com.br', 'led123')}
                disabled={loading}
                className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/20 flex flex-col items-center py-3 h-auto"
              >
                <Wrench className="w-5 h-5 mb-1" />
                <span className="text-xs">Técnico</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          © 2025 LEDCOLLOR. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
