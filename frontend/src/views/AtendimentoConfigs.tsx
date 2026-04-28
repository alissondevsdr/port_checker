import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { 
  getAtendimentoConfigs, 
  createAtendimentoConfig, 
  updateAtendimentoConfig, 
  deleteAtendimentoConfig 
} from '../services/api';

const CONFIG_TYPES = [
  { id: 'origem', label: 'Origem' },
  { id: 'tipo', label: 'Tipo' },
  { id: 'categoria', label: 'Categoria' },
  { id: 'aplicacao', label: 'Aplicaçõe' },
  { id: 'modulo', label: 'Módulo' },
];

const AtendimentoConfigs: React.FC = () => {
  const [activeType, setActiveType] = useState(CONFIG_TYPES[0].id);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await getAtendimentoConfigs(activeType);
      setConfigs(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [activeType]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createAtendimentoConfig({ nome: newName, tipo: activeType });
      setNewName('');
      loadConfigs();
    } catch (error) {
      alert('Erro ao criar configuração');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await deleteAtendimentoConfig(id);
      loadConfigs();
    } catch (error) {
      alert('Erro ao excluir configuração');
    }
  };

  const handleStartEdit = (config: any) => {
    setEditingId(config.id);
    setEditingName(config.nome);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await updateAtendimentoConfig(id, editingName);
      setEditingId(null);
      loadConfigs();
    } catch (error) {
      alert('Erro ao atualizar configuração');
    }
  };

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-6">Configurações de Atendimento</h1>

      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-fit">
        {CONFIG_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setActiveType(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeType === type.id 
                ? 'bg-[#ed0c00] text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Adicionar Novo</h2>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Nome da ${CONFIG_TYPES.find(t => t.id === activeType)?.label.slice(0, -1)}`}
              className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#ed0c00]"
            />
            <button
              type="submit"
              className="bg-[#ed0c00] hover:bg-[#ff0d00] text-white p-2 rounded-xl transition-colors"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Lista de {CONFIG_TYPES.find(t => t.id === activeType)?.label}</h2>
          {loading ? (
            <div className="text-gray-500 text-sm">Carregando...</div>
          ) : configs.length === 0 ? (
            <div className="text-gray-500 text-sm italic">Nenhum item cadastrado.</div>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div 
                  key={config.id}
                  className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-4 py-3 group"
                >
                  {editingId === config.id ? (
                    <div className="flex-1 flex gap-2 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 bg-black border border-white/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#ed0c00]"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(config.id)} className="text-green-500 hover:text-green-400">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-400">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-gray-200">{config.nome}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleStartEdit(config)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(config.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtendimentoConfigs;
