import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, XCircle,
  Clock, RefreshCw, TrendingUp, Server, Zap
} from 'lucide-react';
import { getStats, testAllClients } from '../services/api';

interface Stats {
  clients: {
    total: number;
    ok_count: number;
    error_count: number;
    pending_count: number;
    avg_response: number | null;
  };
  total_logs: number;
  recent_logs: any[];
}

const statusBadge = (status: string) => {
  if (status === 'OK')      return 'badge badge-ok';
  if (status === 'ERROR')   return 'badge badge-error';
  return 'badge badge-pending';
};

const statusDot = (status: string) => {
  if (status === 'OK')      return 'status-dot status-dot-ok';
  if (status === 'ERROR')   return 'status-dot status-dot-error';
  return 'status-dot status-dot-pending';
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleTestAll = async () => {
    setTesting(true);
    try {
      await testAllClients();
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  const c = stats?.clients;
  const uptime = c && c.total > 0
    ? ((c.ok_count / c.total) * 100).toFixed(1)
    : '—';

  const STAT_CARDS = [
    {
      label: 'Total Monitorado',
      value: c?.total ?? '—',
      icon: Server,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/10',
      delay: 'animate-fade-up',
    },
    {
      label: 'Operacionais',
      value: c?.ok_count ?? '—',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/10',
      delay: 'animate-fade-up-1',
    },
    {
      label: 'Com Falha',
      value: c?.error_count ?? '—',
      icon: XCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/10',
      delay: 'animate-fade-up-2',
    },
  ];

  return (
    <div className="space-y-8 bg-bg-main animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Visão <span className="text-blue-400">Geral</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">Monitoramento em tempo real da sua infraestrutura</p>
        </div>
        <button
          onClick={handleTestAll}
          disabled={testing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/30 disabled:opacity-60"
        >
          {testing ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
          {testing ? 'Testando...' : 'Testar Tudo'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, border, delay }) => (
          <div key={label} className={`dark-card p-5 border ${border} ${delay}`}>
            <div className={`${bg} p-2.5 rounded-xl w-fit mb-4`}>
              <Icon className={`${color} w-5 h-5`} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-3xl font-black text-white mt-1">
              {loading ? <span className="text-slate-700">—</span> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uptime / Response */}
        <div className="dark-card p-6 space-y-5 animate-fade-up-1">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" /> Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Disponibilidade</span>
                <span className="text-2xl font-black text-emerald-400">{uptime}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${uptime}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Latência Média</span>
              <span className="text-sm font-black text-blue-400 font-mono">
                {c?.avg_response ? `${Math.round(c.avg_response)}ms` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total de Testes</span>
              <span className="text-sm font-black text-slate-300 font-mono">
                {stats?.total_logs ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="lg:col-span-2 dark-card overflow-hidden animate-fade-up-2">
          <div className="px-6 py-4 border-b border-border-dark flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Atividade Recente</h3>
          </div>
          <div className="divide-y divide-border-dark">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-3 flex items-center gap-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                  <div className="flex-1 h-3 bg-slate-800 rounded" />
                  <div className="w-16 h-3 bg-slate-800 rounded" />
                </div>
              ))
            ) : stats?.recent_logs.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-600 text-sm">
                Nenhum teste registrado ainda. Execute um teste para começar.
              </div>
            ) : (
              stats?.recent_logs.map((log: any) => (
                <div key={log.id} className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={statusDot(log.status)} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-300 truncate">{log.client_name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {log.duration_ms > 0 && (
                      <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">
                        {Math.round(log.duration_ms)}ms
                      </span>
                    )}
                    <span className={statusBadge(log.status)}>{log.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {c && c.error_count > 0 && (
        <div className="dark-card border-rose-500/20 bg-rose-500/5 p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={16} className="text-rose-400" />
            <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest">
              {c.error_count} cliente{c.error_count > 1 ? 's' : ''} com falha
            </h3>
          </div>
          <p className="text-sm text-slate-500">
            Acesse a aba <span className="text-white font-bold">Clientes</span> para verificar e testar os pontos com erro.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
