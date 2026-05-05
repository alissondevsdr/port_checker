import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Users,
  AlertCircle,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { getAtendimentoStats, getAtendimentos } from '../services/api';

const DashboardTV: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadData = async () => {
    try {
      const [statsRes, allRes] = await Promise.all([
        getAtendimentoStats(),
        getAtendimentos({ status: 'ABERTO' })
      ]);
      setStats(statsRes.data);
      setAtendimentos(allRes.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center text-[#ed0c00]">
      <div className="flex flex-col items-center gap-4">
        <Activity size={48} className="animate-spin" />
        <h1 className="text-2xl font-black uppercase tracking-widest">Carregando Dashboard...</h1>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#020202] text-white p-6 overflow-hidden flex flex-col font-sans">
      {/* Top Bar - More Compact */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#ed0c00] rounded-lg flex items-center justify-center shadow-lg shadow-[#ed0c00]/20">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Operações <span className="text-[#ed0c00]">Real-Time</span></h1>
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Performance Center</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-black font-mono leading-none">{lastUpdate.toLocaleTimeString()}</div>
            <div className="text-gray-600 text-[8px] font-bold uppercase tracking-widest mt-0.5">Sincronizado 30s</div>
          </div>
          <div className="w-px h-8 bg-white/10"></div>
          <div className="bg-[#ed0c00]/10 border border-[#ed0c00]/20 px-3 py-1.5 rounded-lg">
             <span className="text-[#ed0c00] font-black text-[10px] uppercase animate-pulse">Live</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid - Compact Data Wall */}
      <div className="grid grid-cols-4 gap-3 mb-6 shrink-0">
        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1 text-gray-500">
            <Users size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Ativos</span>
          </div>
          <div className="text-3xl font-black text-white">{atendimentos.length}</div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1 text-gray-500">
            <CheckCircle size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Finalizados</span>
          </div>
          <div className="text-3xl font-black text-green-500">{stats?.today?.encerrado || 0}</div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1 text-gray-500">
            <Clock size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">T. Médio</span>
          </div>
          <div className="text-3xl font-black text-purple-500">{Math.round(stats?.today?.tempo_medio || 0)}m</div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1 text-gray-500">
            <AlertCircle size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Espera</span>
          </div>
          <div className="text-3xl font-black text-yellow-500">{atendimentos.filter(a => !a.atendente_id).length}</div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Active Queue Table */}
        <div className="col-span-8 flex flex-col overflow-hidden bg-[#0a0a0a] border border-white/5 rounded-xl p-5 shadow-2xl">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
            <Activity size={14} className="text-[#ed0c00]" /> Fluxo de Atendimentos
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-600 uppercase font-black text-[9px] tracking-widest border-b border-white/5">
                  <th className="pb-3 px-3">ID</th>
                  <th className="pb-3 px-3">Cliente</th>
                  <th className="pb-3 px-3">Consultor</th>
                  <th className="pb-3 px-3 text-right">Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {atendimentos.map((a, i) => (
                  <tr key={a.id} className={`${i === 0 && !a.atendente_id ? 'bg-[#ed0c00]/5 animate-pulse' : ''} group`}>
                    <td className="py-3 px-3 font-mono text-gray-500 text-xs">#{a.id.toString().padStart(4, '0')}</td>
                    <td className="py-3 px-3">
                       <div className="text-base font-bold text-gray-200 truncate max-w-[280px]">{a.cliente_nome}</div>
                       <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{a.tipo_nome}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-[9px] font-black text-gray-500">
                          {a.atendente_nome?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <span className={`text-xs font-bold ${a.atendente_nome ? 'text-gray-400' : 'text-yellow-500/50 italic'}`}>
                          {a.atendente_nome || 'Aguardando...'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-lg font-black ${
                        Math.round((new Date().getTime() - new Date(a.data_inicio).getTime()) / 60000) > 30 ? 'text-[#ed0c00]' : 'text-gray-400'
                      }`}>
                        {Math.round((new Date().getTime() - new Date(a.data_inicio).getTime()) / 60000)}m
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-4 flex flex-col gap-5 overflow-hidden">
          <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-xl p-5 shadow-2xl overflow-hidden flex flex-col">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-green-500" /> Consultores Online
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                {Array.from(new Set(atendimentos.map(a => a.atendente_nome))).filter(Boolean).map(name => {
                  const count = atendimentos.filter(a => a.atendente_nome === name).length;
                  return (
                    <div key={name} className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 text-[10px] font-black">
                          {name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-300">{name}</div>
                          <div className="text-[8px] text-gray-600 font-bold uppercase">Em atendimento</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-white">{count}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="bg-[#ed0c00] p-4 rounded-xl flex items-center justify-between shadow-lg shadow-[#ed0c00]/10">
             <div>
               <div className="text-[8px] font-black uppercase tracking-widest text-white/50">Copyright 2026</div>
               <div className="text-xs font-black text-white uppercase tracking-tighter">INOVAR SISTEMAS</div>
             </div>
             <BarChart3 size={20} className="text-white opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTV;
