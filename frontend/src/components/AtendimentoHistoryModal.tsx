import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  History, 
  Clock,
  Building2,
  User,
  Hash,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import { 
  getAtendimentoById, 
  getAtendimentoHistory,
  updateAtendimentoHistory,
  deleteAtendimentoHistory
} from '../services/api';
import { formatCpfCnpj, onlyNumbers } from '../utils/formatters';
import Skeleton from '../components/Skeleton';

interface HistoryModalProps {
  atendimentoId: number;
  onClose: () => void;
  canEdit?: boolean;
}

const AtendimentoHistoryModal: React.FC<HistoryModalProps> = ({ atendimentoId, onClose, canEdit = false }) => {
  const [atendimento, setAtendimento] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [atendRes, histRes] = await Promise.all([
        getAtendimentoById(atendimentoId),
        getAtendimentoHistory(atendimentoId)
      ]);
      setAtendimento(atendRes.data);
      setHistory(histRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [atendimentoId]);

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.descricao);
  };

  const handleSaveEdit = async (historyId: number) => {
    if (!editValue.trim()) return;
    setSaving(true);
    try {
      await updateAtendimentoHistory(atendimentoId, historyId, editValue);
      setEditingId(null);
      await loadData();
    } catch (error) {
      alert('Erro ao editar resposta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (historyId: number) => {
    if (!window.confirm('Deseja realmente excluir esta resposta?')) return;
    try {
      await deleteAtendimentoHistory(atendimentoId, historyId);
      await loadData();
    } catch (error) {
      alert('Erro ao excluir resposta');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Detalhes do Atendimento</h2>
            {atendimento && <p className="text-[10px] text-gray-500 font-mono">#{atendimento.id.toString().padStart(5, '0')}</p>}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <Building2 size={10} /> Cliente
                  </div>
                  <div className="text-sm font-bold text-white">{atendimento.cliente_nome}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <Clock size={10} /> Data
                  </div>
                  <div className="text-sm font-bold text-white">{new Date(atendimento.data_inicio).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <User size={10} /> Atendente
                  </div>
                  <div className="text-sm font-bold text-white">{atendimento.atendente_nome}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Tipo</div>
                  <div className="text-sm font-bold text-white">{atendimento.tipo_nome}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center gap-1">
                    <Hash size={10} /> {onlyNumbers(atendimento.cnpj || '').length <= 11 ? 'CPF' : 'CNPJ'}
                  </div>
                  <div className="text-sm font-bold text-white">{formatCpfCnpj(atendimento.cnpj || '') || '---'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    atendimento.status === 'ABERTO' ? 'bg-yellow-500/10 text-yellow-500' :
                    atendimento.status === 'ENCERRADO' ? 'bg-green-500/10 text-green-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {atendimento.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Problema Inicial</div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-gray-300 italic">
                  "{atendimento.problema_inicial}"
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                  <History size={16} className="text-[#ed0c00]" />
                  Histórico de Respostas
                </h3>
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 italic text-sm border-2 border-dashed border-white/5 rounded-2xl">
                      Nenhuma resposta registrada.
                    </div>
                  ) : (
                    history.map((item: any) => (
                      <div key={item.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 group">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400">{item.atendente_nome}</span>
                            <span className="text-[9px] text-gray-600">{new Date(item.data_registro).toLocaleString()}</span>
                          </div>
                          {canEdit && atendimento.status === 'ABERTO' && editingId !== item.id && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleEdit(item)}
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {editingId === item.id ? (
                          <div className="space-y-2">
                            <textarea 
                              className="w-full bg-black border border-[#ed0c00]/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 rounded-lg text-[10px] font-bold text-gray-500 hover:text-white transition-colors"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => handleSaveEdit(item.id)}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-500 transition-colors disabled:opacity-50"
                              >
                                <Check size={10} /> {saving ? 'Salvando...' : 'Salvar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300 whitespace-pre-wrap">{item.descricao}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AtendimentoHistoryModal;
