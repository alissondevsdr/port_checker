import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {  
  MessageSquare,
  Activity,
  Users,
  Clock,
  TrendingUp,
  History,
  ArrowUpRight
} from 'lucide-react';
import { getAtendimentoStats, getAtendimentos } from '../services/api';
import Skeleton from '../components/Skeleton';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sub-components ---

const MetricCard: React.FC<{ label: string, today: any, month: any, icon: any, color: string }> = ({ label, today, month, icon: Icon, color }) => (
  <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 group hover:border-white/10 transition-all">
    <div className="flex items-center gap-3 mb-6">
      <div className={cn("p-2.5 rounded-2xl bg-opacity-10 text-opacity-100", `bg-${color}-500 text-${color}-500`)}>
        <Icon size={20} />
      </div>
      <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">{label}</h3>
    </div>
    
    <div className="grid grid-cols-2 gap-8 relative">
      <div className="absolute left-1/2 top-2 bottom-2 w-px bg-white/5 -translate-x-1/2" />
      <div>
        <div className="text-3xl font-black text-white mb-1">
          {typeof today === 'number' ? today : today}
        </div>
        <div className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Hoje</div>
      </div>
      <div className="pl-4">
        <div className="text-3xl font-black text-gray-400 mb-1">
          {typeof month === 'number' ? month : month}
        </div>
        <div className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">No Mês</div>
      </div>
    </div>
  </div>
);

const TrendChart: React.FC<{ title: string, data: any[], color: string }> = ({ title, data, color }) => {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return "";
    const max = Math.max(...data.map(d => d.count), 5);
    const width = 200;
    const height = 80;
    const step = width / (data.length - 1);
    
    let path = `M 0,${height - (data[0].count / max) * height}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = i * step;
      const y1 = height - (data[i].count / max) * height;
      const x2 = (i + 1) * step;
      const y2 = height - (data[i + 1].count / max) * height;
      const cx = (x1 + x2) / 2;
      path += ` C ${cx},${y1} ${cx},${y2} ${x2},${y2}`;
    }
    return path;
  }, [data]);

  const areaPath = useMemo(() => {
    if (!pathData) return "";
    return `${pathData} L 200,80 L 0,80 Z`;
  }, [pathData]);

  const colorHex = color === 'red' ? '#ed0c00' : color === 'blue' ? '#3b82f6' : '#22c55e';

  return (
    <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 h-[220px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title} / Hora</h3>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
           <span>Hoje</span>
        </div>
      </div>
      
      <div className="flex-1 w-full relative min-h-0">
        <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.2" />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#grad-${title})`} />
          <path d={pathData} fill="none" stroke={colorHex} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-white">{data.reduce((acc, d) => acc + d.count, 0)}</span>
          <span className="text-[9px] font-black text-gray-600 uppercase">Chamados</span>
        </div>
        <div className="flex gap-1">
           {Array(6).fill(0).map((_, i) => (
             <div key={i} className="w-1 h-3 rounded-full bg-white/5" />
           ))}
        </div>
      </div>
    </div>
  );
};

const CollaboratorCard: React.FC<{ user: any }> = ({ user }) => (
  <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 group hover:border-[#ed0c00]/30 transition-all">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-sm font-black text-gray-400 uppercase group-hover:border-[#ed0c00]/50 transition-colors">
          {user.username.substring(0, 2)}
        </div>
        <div>
          <h4 className="text-sm font-black text-white mb-0.5">{user.username}</h4>
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Ativo</span>
          </div>
        </div>
      </div>
      <div className="text-right">
         <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Status</div>
         <div className={cn(
           "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter",
           user.openTickets?.length > 0 ? "bg-[#ed0c00]/10 text-[#ed0c00]" : "bg-blue-500/10 text-blue-500"
         )}>
           {user.openTickets?.length > 0 ? 'Em Atendimento' : 'Disponível'}
         </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-6 mb-8">
      <div className="space-y-4">
        <div>
           <div className="flex items-baseline gap-2">
             <span className="text-xl font-black text-white">{user.today?.total || 0}</span>
             <span className="text-xs font-black text-gray-400">/ {user.month?.total || 0}</span>
           </div>
           <div className="text-[9px] font-black text-gray-600 uppercase tracking-tighter mt-1">Total (Hoje / Mês)</div>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
           <div 
             className="h-full bg-[#ed0c00] rounded-full" 
             style={{ width: `${Math.min((user.today?.total / 15) * 100, 100)}%` }} 
           />
        </div>
      </div>
      <div className="space-y-4">
        <div>
           <div className="flex items-baseline gap-2">
             <span className="text-xl font-black text-white">{Math.round(user.today?.tempo_medio || 0)}m</span>
             <span className="text-xs font-black text-gray-400">/ {Math.round(user.month?.tempo_medio || 0)}m</span>
           </div>
           <div className="text-[9px] font-black text-gray-600 uppercase tracking-tighter mt-1">Tempo Médio (Hoje / Mês)</div>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
           <div 
             className="h-full bg-blue-500 rounded-full" 
             style={{ width: `${Math.min((user.today?.tempo_medio / 60) * 100, 100)}%` }} 
           />
        </div>
      </div>
    </div>

    <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
       <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
          <span>Abertos Agora</span>
          <span className="text-gray-700">{user.openTickets?.length || 0}</span>
       </div>
       <div className="space-y-2 max-h-[100px] overflow-y-auto no-scrollbar">
          {user.openTickets?.length > 0 ? user.openTickets.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between gap-3 text-[10px] text-gray-400 hover:text-white transition-colors">
               <span className="truncate flex-1 font-bold">#{t.id} {t.cliente_nome}</span>
               <ArrowUpRight size={10} className="shrink-0 text-gray-700" />
            </div>
          )) : (
            <div className="text-[10px] text-gray-700 italic">Nenhum chamado aberto.</div>
          )}
       </div>
    </div>
  </div>
);

const ActivityScroll: React.FC<{ records: any[] }> = ({ records }) => (
  <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 h-[220px] flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
        <History size={14} className="text-[#ed0c00]" /> Últimos Registros
      </h3>
      <span className="text-[8px] font-black text-gray-700 uppercase">Real-time Feed</span>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
      {records.length === 0 ? (
        <div className="text-[10px] text-gray-600 italic py-8 text-center">Nenhuma atividade registrada hoje.</div>
      ) : (
        records.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 hover:bg-white/5 transition-all">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              item.status === 'ABERTO' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
            )} />
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] font-black text-gray-200 truncate">{item.atendente_nome}</span>
                  <span className="text-[8px] font-mono text-gray-600">{new Date(item.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
               <div className="text-[9px] text-gray-500 leading-none">
                  <span className={cn("font-bold", item.status === 'ABERTO' ? 'text-blue-500/80' : 'text-green-500/80')}>
                    {item.status === 'ABERTO' ? 'Iniciou' : 'Finalizou'}
                  </span> em <span className="font-mono text-[8px]">#{item.id}</span>
               </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentAtendimentos, setRecentAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, listRes] = await Promise.all([
        getAtendimentoStats(),
        getAtendimentos({ limit: 15 })
      ]);
      setStats(statsRes.data);
      setRecentAtendimentos(listRes.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const getChartData = (typeName: string) => {
    if (!stats?.hourlyTrends) return Array(12).fill({ hour: 0, count: 0 });
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);
    return hours.map(h => ({
      hour: h,
      count: stats.hourlyTrends.find((t: any) => t.hour === h && t.tipo_nome === typeName.toUpperCase())?.count || 0
    }));
  };

  const getGeneralData = () => {
    if (!stats?.hourlyTrends) return Array(12).fill({ hour: 0, count: 0 });
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);
    return hours.map(h => ({
      hour: h,
      count: stats.hourlyTrends
        .filter((t: any) => t.hour === h)
        .reduce((acc: number, curr: any) => acc + curr.count, 0)
    }));
  };

  return (
    <div className="space-y-10 fade-up">
      {/* 1. Global Metrics Section (Today vs Month) */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-2">
           <Activity size={18} className="text-[#ed0c00]" />
           <h2 className="text-sm font-black uppercase tracking-widest text-white">Performance Global</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-36" />) // Increased skeletons to 5 for the new card
          ) : (
            <>
              <MetricCard label="Total Geral" today={stats?.globalToday?.total} month={stats?.globalMonth?.total} icon={MessageSquare} color="blue" />
              <MetricCard label="Encerrados" today={stats?.globalToday?.encerrado} month={stats?.globalMonth?.encerrado} icon={Users} color="green" />
              <MetricCard label="Cancelados" today={stats?.globalToday?.cancelado} month={stats?.globalMonth?.cancelado} icon={Users} color="red" />
              <MetricCard label="Tempo Médio" today={`${Math.round(stats?.globalToday?.tempo_medio || 0)}m`} month={`${Math.round(stats?.globalMonth?.tempo_medio || 0)}m`} icon={Clock} color="purple" />
            </>
          )}
        </div>
      </section>

      {/* 2. Charts & Activity Section */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-2">
           <TrendingUp size={18} className="text-[#ed0c00]" />
           <h2 className="text-sm font-black uppercase tracking-widest text-white">Fluxos por Hora</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[220px]" />)
          ) : (
            <>
              <TrendChart title="Atendimentos" data={getGeneralData()} color="red" />
              <TrendChart title="Telefone" data={getChartData('TELEFONE')} color="blue" />
              <TrendChart title="WhatsApp" data={getChartData('WHATSAPP')} color="green" />
              <ActivityScroll records={recentAtendimentos} />
            </>
          )}
        </div>
      </section>

      {/* 3. Team Performance Section */}
      <section>
        <div className="flex items-center gap-2 mb-6 px-2">
           <Users size={18} className="text-[#ed0c00]" />
           <h2 className="text-sm font-black uppercase tracking-widest text-white">Monitoramento de Equipe</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64" />)
          ) : (
            stats?.teamStats?.map((user: any) => (
              <CollaboratorCard 
                key={user.id} 
                user={{
                  ...user,
                  today: user.today || { total: 0, tempo_medio: 0 },
                  month: user.month || { total: 0, tempo_medio: 0 }
                }} 
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
