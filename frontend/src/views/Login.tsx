import React, { useState } from 'react';
import { Lock, User, Loader, AlertCircle, Wrench } from 'lucide-react';
import { login } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login(username, password);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLoginSuccess(user, token);
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <Wrench size={32} className="text-red-500" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Suporte HUB</h1>
          <p className="text-gray-500">Inovar Sistemas</p>
        </div>

        {/* Card de Login */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Usuário */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#111111] border border-[#222222] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="Seu usuário"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111111] border border-[#222222] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-red-500/50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <>
                  Acessar
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm">
          Acesso restrito a colaboradores autorizados.
        </p>
      </div>
    </div>
  );
};

export default Login;
