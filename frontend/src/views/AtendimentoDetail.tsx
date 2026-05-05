import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building2, 
  Hash,
  Send,
  History,
  X,
  Eye,
  AlertTriangle,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import { 
  getAtendimentoById, 
  getAtendimentoHistory, 
  addAtendimentoHistory, 
  updateAtendimento, 
  endAtendimento, 
  cancelAtendimento,
  getAtendimentoConfigs,
  getAtendimentos,
  updateAtendimentoHistory,
  deleteAtendimentoHistory
} from '../services/api';
import { formatCpfCnpj, onlyNumbers } from '../utils/formatters';
import Skeleton from '../components/Skeleton';
import ConfirmationModal from '../components/ConfirmationModal';
import AtendimentoHistoryModal from '../components/AtendimentoHistoryModal';

interface Props {
  atendimentoId: number;
  onBack: () => void;
}

const AtendimentoDetail: React.FC<Props> = ({ atendimentoId, onBack }) => {
  const [atendimento, setAtendimento] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [recentAtendimentos, setRecentAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [configs, setConfigs] = useState<any>({
    origem: [],
    tipo: [],
    categoria: [],
    aplicacao: [],
    modulo: []
  });
  const [form, setForm] = useState<any>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<number | null>(null);

  // Edit history item state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal states
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDeleteHistory, setConfirmDeleteHistory] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{title: string, msg: string, type: 'success' | 'danger'} | null>(null);

  const currentUser = React.useMemo(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }, []);

  const isOwner = atendimento?.atendente_id === currentUser?.id;
  const isAdmin = currentUser?.role === 'ADMINISTRADOR';
  const canEdit = (isOwner || isAdmin) && atendimento?.status === 'ABERTO';

  const loadData = async () => {
    setLoading(true);
    try {
      const [atendRes, histRes, configResults] = await Promise.all([
        getAtendimentoById(atendimentoId),
        getAtendimentoHistory(atendimentoId),
        Promise.all(['origem', 'tipo', 'categoria', 'aplicacao', 'modulo'].map(t => getAtendimentoConfigs(t)))
      ]);

      setAtendimento(atendRes.data);
      setForm(atendRes.data);
      setHistory(histRes.data);

      const types = ['origem', 'tipo', 'categoria', 'aplicacao', 'modulo'];
      const newConfigs: any = {};
      types.forEach((t, i) => {
        newConfigs[t] = configResults[i].data;
      });
      setConfigs(newConfigs);

      // Load recent atendimentos for this client
      const recentRes = await getAtendimentos({ cliente_id: atendRes.data.cliente_id });
      setRecentAtendimentos(recentRes.data.filter((a: any) => a.id !== atendimentoId).slice(0, 5));

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [atendimentoId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (atendimento?.status !== 'ABERTO') return;
      
      if (e.key === 'F11') {
        e.preventDefault();
        setConfirmEnd(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        setConfirmCancel(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [atendimento, form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAtendimento(atendimentoId, form);
      // Visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (canEdit) {
      await handleSave();
    }
    onBack();
  };

  const onConfirmEnd = async () => {
    try {
      await endAtendimento(atendimentoId);
      onBack();
    } catch (error) {
      setFeedback({ title: 'Erro', msg: 'Erro ao encerrar atendimento', type: 'danger' });
    }
  };

  const onConfirmCancel = async () => {
    try {
      await cancelAtendimento(atendimentoId);
      onBack();
    } catch (error) {
      setFeedback({ title: 'Erro', msg: 'Erro ao cancelar atendimento', type: 'danger' });
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResponse.trim()) return;
    try {
      await addAtendimentoHistory(atendimentoId, newResponse);
      setNewResponse('');
      const histRes = await getAtendimentoHistory(atendimentoId);
      setHistory(histRes.data);
    } catch (error) {
      setFeedback({ title: 'Erro', msg: 'Erro ao adicionar resposta', type: 'danger' });
    }
  };

  const handleEditHistory = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.descricao);
  };

  const handleSaveEditHistory = async (historyId: number) => {
    if (!editValue.trim()) return;
    setSavingEdit(true);
    try {
      await updateAtendimentoHistory(atendimentoId, historyId, editValue);
      setEditingId(null);
      const histRes = await getAtendimentoHistory(atendimentoId);
      setHistory(histRes.data);
    } catch (error) {
      setFeedback({ title: 'Erro', msg: 'Erro ao editar resposta', type: 'danger' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteHistory = (historyId: number) => {
    setConfirmDeleteHistory(historyId);
  };

  const onConfirmDeleteHistory = async () => {
    if (!confirmDeleteHistory) return;
    try {
      await deleteAtendimentoHistory(atendimentoId, confirmDeleteHistory);
      setConfirmDeleteHistory(null);
      const histRes = await getAtendimentoHistory(atendimentoId);
      setHistory(histRes.data);
    } catch (error) {
      setFeedback({ title: 'Erro', msg: 'Erro ao excluir resposta', type: 'danger' });
    }
  };

  if (loading || !atendimento) return (
    <div className="text-white p-8 space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Skeleton className="h-[400px] w-full" />
           <Skeleton className="h-[200px] w-full" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  );

  return (
    <div className="text-white pb-12 fade-up">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-all flex items-center gap-2">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">Atendimento #{atendimento.id.toString().padStart(5, '0')}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                atendimento.status === 'ABERTO' ? 'bg-yellow-500/10 text-yellow-500' :
                atendimento.status === 'ENCERRADO' ? 'bg-green-500/10 text-green-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {atendimento.status}
              </span>
              {saving && (
                <span className="text-[10px] text-[#ed0c00] font-bold animate-pulse ml-2">Salvando alterações...</span>
              )}
            </div>
            <p className="text-gray-500 text-sm">Gerencie os detalhes e o histórico deste atendimento.</p>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmCancel(true)} 
              className="bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-gray-400 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 flex items-center gap-2"
            >
              <XCircle size={16} />
              Cancelar
            </button>
            <button 
              onClick={() => setConfirmEnd(true)} 
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Encerrar (F11)
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details and History Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client & Info Card */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Cliente</div>
                    <div className="text-base font-bold">{atendimento.cliente_nome}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Atendente</div>
                    <div className="text-base font-bold">{atendimento.atendente_nome}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Data Início</div>
                    <div className="text-base font-bold">{new Date(atendimento.data_inicio).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                    <Hash size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                      {onlyNumbers(atendimento.cnpj || '').length <= 11 ? 'CPF' : 'CNPJ'}
                    </div>
                    <div className="text-base font-bold">{formatCpfCnpj(atendimento.cnpj || '') || '---'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 pt-8 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Origem</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.origem_id}
                  onChange={e => setForm({...form, origem_id: e.target.value})}
                >
                  {configs.origem.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tipo</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.tipo_id}
                  onChange={e => setForm({...form, tipo_id: e.target.value})}
                >
                  {configs.tipo.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Categoria</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.categoria_id || ''}
                  onChange={e => setForm({...form, categoria_id: e.target.value})}
                >
                  <option value="" className="bg-[#111111]">Nenhuma</option>
                  {configs.categoria.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Aplicação</label>
                <select
                  disabled={!canEdit}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.aplicacao_id || ''}
                  onChange={e => setForm({...form, aplicacao_id: e.target.value, modulo_id: ''})}
                >
                  <option value="" className="bg-[#111111]">Nenhuma</option>
                  {configs.aplicacao.map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Módulo</label>
                <select
                  disabled={!canEdit || !form.aplicacao_id}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ed0c00] transition-colors appearance-none disabled:opacity-50"
                  value={form.modulo_id || ''}
                  onChange={e => setForm({...form, modulo_id: e.target.value})}
                >
                  <option value="" className="bg-[#111111]">Nenhum</option>
                  {configs.modulo
                    .filter((c: any) => !form.aplicacao_id || c.parent_id === parseInt(form.aplicacao_id))
                    .map((c: any) => <option key={c.id} value={c.id} className="bg-[#111111]">{c.nome}</option>)
                  }
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Problema Inicial</label>
              <textarea
                disabled={!canEdit}
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ed0c00] transition-colors resize-none disabled:opacity-50"
                value={form.problema_inicial}
                onChange={e => setForm({...form, problema_inicial: e.target.value})}
              />
            </div>
          </div>

          {/* History Feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 px-2">
              <History size={20} className="text-[#ed0c00]" />
              Histórico de Respostas
            </h2>
            
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id} className="bg-[#111111] border border-white/10 rounded-2xl p-5 relative group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400 border border-white/10">
                        {item.atendente_nome.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{item.atendente_nome}</div>
                        <div className="text-[10px] text-gray-500">{new Date(item.data_registro).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {canEdit && editingId !== item.id && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditHistory(item)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteHistory(item.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                      <div className="text-[10px] text-gray-700 font-mono">#{index + 1}</div>
                    </div>
                  </div>
                  
                  {editingId === item.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        className="w-full bg-black border border-[#ed0c00]/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleSaveEditHistory(item.id)}
                          disabled={savingEdit}
                          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                          <Check size={14} /> {savingEdit ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {item.descricao}
                    </div>
                  )}
                </div>
              ))}

              {canEdit && (
                <div className="bg-[#111111] border border-[#ed0c00]/20 rounded-2xl p-6 shadow-lg shadow-[#ed0c00]/5">
                  <form onSubmit={handleAddHistory}>
                    <textarea
                      rows={4}
                      placeholder="Digite sua resposta ou solução aqui..."
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ed0c00] transition-colors resize-none mb-4"
                      value={newResponse}
                      onChange={e => setNewResponse(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        className="bg-[#ed0c00] hover:bg-[#ff0d00] text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#ed0c00]/20 flex items-center gap-2"
                      >
                        <Send size={16} />
                        Enviar Resposta
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar info */}
        <div className="space-y-8">
          {/* Recent Atendimentos for this client */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">Últimos Atendimentos</h2>
            <div className="space-y-3">
              {recentAtendimentos.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setShowHistoryModal(item.id)}
                  className="bg-black/40 border border-white/5 rounded-2xl p-4 hover:border-[#ed0c00]/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] text-gray-500 font-mono">#{item.id.toString().padStart(5, '0')}</div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      item.status === 'ENCERRADO' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold mb-1 group-hover:text-[#ed0c00] transition-colors">{item.tipo_nome}</div>
                  <div className="text-[10px] text-gray-500 truncate mb-2">{item.problema_inicial}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-[9px] text-gray-600">{new Date(item.data_inicio).toLocaleDateString()}</div>
                    <Eye size={12} className="text-gray-600 group-hover:text-[#ed0c00]" />
                  </div>
                </div>
              ))}
              {recentAtendimentos.length === 0 && (
                <p className="text-gray-600 text-xs italic text-center py-4">Nenhum atendimento anterior.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showHistoryModal && (
        <AtendimentoHistoryModal 
          atendimentoId={showHistoryModal} 
          onClose={() => setShowHistoryModal(null)} 
          canEdit={false}
        />
      )}

      <ConfirmationModal 
        isOpen={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        onConfirm={onConfirmEnd}
        title="Encerrar Atendimento"
        description="Deseja realmente encerrar este atendimento? Esta ação mudará o status para ENCERRADO."
        type="success"
        confirmText="Encerrar"
      />

      <ConfirmationModal 
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={onConfirmCancel}
        title="Cancelar Atendimento"
        description="Atenção! Esta ação é irreversível. Deseja realmente cancelar este atendimento?"
        type="danger"
        confirmText="Cancelar Atendimento"
      />

      <ConfirmationModal 
        isOpen={!!confirmDeleteHistory}
        onClose={() => setConfirmDeleteHistory(null)}
        onConfirm={onConfirmDeleteHistory}
        title="Excluir Resposta"
        description="Tem certeza que deseja excluir esta resposta? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Excluir"
      />

      {feedback && (
        <div className="fixed bottom-8 right-8 z-[10001] animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <div>
              <div className="font-bold text-sm">{feedback.title}</div>
              <div className="text-xs opacity-80">{feedback.msg}</div>
            </div>
            <button onClick={() => setFeedback(null)} className="ml-4 opacity-50 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtendimentoDetail;
