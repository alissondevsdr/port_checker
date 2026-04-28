import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Users,
  ChevronRight
} from 'lucide-react';
import { getAtendimentoStats, getAtendimentos } from '../services/api';
import ClientSearchModal from '../components/ClientSearchModal';
import NewAtendimentoForm from '../components/NewAtendimentoForm';
import ClientModal from '../components/ClientModal';

interface Props {
  onSelectAtendimento: (id: number) => void;
}

const Atendimentos: React.FC<Props> = ({ onSelectAtendimento }) => {
  const [stats, setStats] = useState<any>(null);
  const [allAtendimentos, setAllAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showSearch, setShowSearch] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showRegisterClient, setShowRegisterClient] = useState(false);

  // Get current user ID
  const currentUser = useMemo(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, allRes] = await Promise.all([
        getAtendimentoStats(),
        getAtendimentos({ status: 'ABERTO' })
      ]);
      setStats(statsRes.data);
      setAllAtendimentos(allRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
    setShowSearch(false);
    setShowNewForm(true);
  };

  const handleNewSuccess = (id: number) => {
    setShowNewForm(false);
    setSelectedClient(null);
    loadDashboard();
    onSelectAtendimento(id);
  };

  // Filtered lists
  const myAtendimentos = useMemo(() => {
    if (!currentUser) return [];
    return allAtendimentos.filter(a => a.atendente_id === currentUser.id);
  }, [allAtendimentos, currentUser]);

  const filteredAllAtendimentos = useMemo(() => {
    if (!searchTerm.trim()) return allAtendimentos;
    const term = searchTerm.toLowerCase();
    return allAtendimentos.filter(a => 
      a.cliente_nome.toLowerCase().includes(term) || 
      a.problema_inicial.toLowerCase().includes(term) ||
      String(a.id).includes(term)
    );
  }, [allAtendimentos, searchTerm]);

  const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-500`}>
          <Icon size={20} />
        </div>
        {subValue && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {subValue}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value || 0}</div>
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );

  const AtendimentoCard = ({ item }: { item: any }) => (
    <div 
      onClick={() => onSelectAtendimento(item.id)}
      className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-bold text-white group-hover:text-[#ed0c00] transition-colors">
            {item.cliente_nome}
          </div>
          <div className="text-[10px] text-gray-500 font-mono">ID: #{item.id?.toString().padStart(5, '0')}</div>
        </div>
        <div className="bg-[#ed0c00]/10 text-[#ed0c00] text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
          {item.tipo_nome}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          <span>Iniciado em {new Date(item.data_inicio).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <MessageSquare size={12} />
          <span className="truncate">{item.problema_inicial}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">
            {item.atendente_nome?.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{item.atendente_nome}</span>
        </div>
        <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="text-white pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Atendimentos</h1>
          <p className="text-gray-500 text-sm">Acompanhe e gerencie os atendimentos em tempo real.</p>
        </div>
        <button 
          onClick={() => setShowSearch(true)}
          className="bg-[#ed0c00] hover:bg-[#ff0d00] text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#ed0c00]/20"
        >
          <Plus size={20} />
          Novo Atendimento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard label="Totais" value={stats?.total} icon={Users} color="blue" />
        <StatCard label="Em Aberto" value={stats?.aberto} icon={Clock} color="yellow" />
        <StatCard label="Encerrados" value={stats?.encerrado} icon={CheckCircle} color="green" />
        <StatCard label="Cancelados" value={stats?.cancelado} icon={XCircle} color="red" />
        <StatCard 
          label="Tempo Médio" 
          value={stats?.tempo_medio ? `${Math.round(stats.tempo_medio)} min` : '0 min'} 
          icon={Clock} 
          color="purple" 
          subValue={stats?.today?.tempo_medio ? `Hoje: ${Math.round(stats.today.tempo_medio)}m` : 'Hoje: 0m'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Meus Atendimentos */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Meus em Aberto
            </h2>
            <span className="text-xs bg-white/5 px-2 py-1 rounded-lg text-gray-400 font-mono">
              {myAtendimentos.length}
            </span>
          </div>
          <div className="space-y-4">
            {myAtendimentos.map(item => <AtendimentoCard key={item.id} item={item} />)}
            {myAtendimentos.length === 0 && !loading && (
              <div className="bg-[#111111] border border-white/5 border-dashed rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">Nenhum atendimento seu em aberto.</p>
              </div>
            )}
          </div>
        </div>

        {/* Todos Atendimentos */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Todos em Aberto
            </h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="bg-[#111111] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-[#ed0c00] w-48"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAllAtendimentos.map(item => <AtendimentoCard key={item.id} item={item} />)}
            {filteredAllAtendimentos.length === 0 && !loading && (
              <div className="col-span-2 bg-[#111111] border border-white/5 border-dashed rounded-2xl p-12 text-center">
                <p className="text-gray-500 text-sm">Nenhum atendimento em aberto no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSearch && (
        <ClientSearchModal 
          onClose={() => setShowSearch(false)}
          onSelect={handleClientSelect}
          onRegisterNew={() => {
            setShowSearch(false);
            setShowRegisterClient(true);
          }}
        />
      )}

      {showNewForm && selectedClient && (
        <NewAtendimentoForm 
          client={selectedClient}
          onClose={() => {
            setShowNewForm(false);
            setSelectedClient(null);
          }}
          onBack={() => {
            setShowNewForm(false);
            setShowSearch(true);
          }}
          onSuccess={handleNewSuccess}
        />
      )}

      {showRegisterClient && (
        <ClientModal 
          groups={[]} 
          onClose={() => setShowRegisterClient(false)}
          onSave={() => {
            setShowRegisterClient(false);
            setShowSearch(true);
          }}
        />
      )}
    </div>
  );
};

export default Atendimentos;
