import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, ShieldCheck, ShieldAlert, Clock,
  RefreshCw, Search, ChevronDown, ChevronRight,
  Server
} from 'lucide-react';
import { getLogs, getStats } from '../services/api';

const statusBadge = (status: string) => {
  if (status === 'OK')      return 'badge badge-ok';
  if (status === 'ERROR')   return 'badge badge-error';
  return 'badge badge-pending';
};

const Reports: React.FC = () => {
  const [logs, setLogs]   = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [limit, setLimit] = useState(50);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logsR, statsR] = await Promise.all([
        getLogs({ limit }),
        getStats(),
      ]);
      setLogs(logsR.data);
      setStats(statsR.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQ = !q || l.client_name.toLowerCase().includes(q);
    const matchS = !filterStatus || l.status === filterStatus;
    return matchQ && matchS;
  });

  const c = stats?.clients;
  const uptime = c && c.total > 0
    ? ((c.ok_count / c.total) * 100).toFixed(1)
    : '—';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const incidentsToday = logs.filter(l =>
    l.status === 'ERROR' && new Date(l.timestamp) >= today
  ).length;

  return (
    <div className="space-y-6 animate-fade-up bg-bg-main">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Relatórios</h2>
          <p className="text-slate-500 text-sm mt-1">Histórico de testes e análise de disponibilidade</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-dark text-slate-400 hover:text-white hover:border-slate-500 font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dark-card p-5 border-emerald-500/10 bg-emerald-500/5">
          <ShieldCheck className="text-emerald-400 mb-3" size={22} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disponibilidade</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{uptime}%</p>
          <p className="text-[10px] text-slate-600 mt-1">Baseado no estado atual</p>
        </div>
        <div className="dark-card p-5 border-rose-500/10 bg-rose-500/5">
          <ShieldAlert className="text-rose-400 mb-3" size={22} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Incidentes Hoje</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{incidentsToday}</p>
          <p className="text-[10px] text-slate-600 mt-1">Falhas registradas no dia</p>
        </div>
        <div className="dark-card p-5 border-blue-500/10 bg-blue-500/5">
          <Clock className="text-blue-400 mb-3" size={22} />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Registros</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{stats?.total_logs ?? '—'}</p>
          <p className="text-[10px] text-slate-600 mt-1">Testes históricos</p>
        </div>
      </div>

      {/* Logs table */}
      <div className="dark-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              className="dark-input pl-9 py-2.5 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="dark-input py-2.5 text-xs appearance-none cursor-pointer min-w-[120px]"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Todos Status</option>
              <option value="OK">OK</option>
              <option value="ERROR">Erro</option>
            </select>
            <select
              className="dark-input py-2.5 text-xs appearance-none cursor-pointer min-w-[110px]"
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
            >
              <option value={25}>25 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={200}>200 registros</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-dark bg-white/[0.015]">
                <th className="px-6 py-3 w-8" />
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data / Hora</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Duração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-3">
                        <div className="h-3 bg-white/5 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <FileText size={36} className="text-slate-800 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">
                      {logs.length === 0
                        ? 'Nenhum teste registrado. Execute testes para ver o histórico aqui.'
                        : 'Nenhum resultado encontrado para os filtros selecionados.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map(log => {
                  const isExpanded = expanded === log.id;
                  let portResults: any[] = [];
                  try {
                    portResults = typeof log.port_results === 'string'
                      ? JSON.parse(log.port_results)
                      : (log.port_results || []);
                    portResults = portResults.filter(Boolean);
                  } catch {}

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${isExpanded ? 'bg-white/[0.015]' : ''}`}
                        onClick={() => setExpanded(isExpanded ? null : log.id)}
                      >
                        <td className="px-6 py-3 text-slate-600">
                          {isExpanded
                            ? <ChevronDown size={14} className="text-blue-400" />
                            : <ChevronRight size={14} />
                          }
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm font-semibold text-slate-300">{log.client_name}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={statusBadge(log.status)}>{log.status}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs font-mono text-slate-500">
                            {log.duration_ms > 0 ? `${Math.round(log.duration_ms)}ms` : '—'}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && portResults.length > 0 && (
                        <tr className="bg-white/[0.01]">
                          <td colSpan={5} className="px-10 py-4">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">
                                Resultado por porta
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {portResults.map((pr: any, i: number) => (
                                  <div
                                    key={i}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono ${
                                      pr.is_open
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    }`}
                                  >
                                    <Server size={12} />
                                    <span className="font-bold">:{pr.port}</span>
                                    <span className={pr.is_open ? 'text-emerald-500' : 'text-rose-500'}>
                                      {pr.is_open ? '✓ Aberta' : '✗ Fechada'}
                                    </span>
                                    {pr.is_open && pr.response_ms && (
                                      <span className="text-slate-500">{Math.round(pr.response_ms)}ms</span>
                                    )}
                                    {!pr.is_open && pr.error && (
                                      <span className="text-slate-600 text-[10px]">{pr.error}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border-dark">
            <p className="text-[10px] text-slate-600">
              Exibindo {filtered.length} de {logs.length} registros
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
