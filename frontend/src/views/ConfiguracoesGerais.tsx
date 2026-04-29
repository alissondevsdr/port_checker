import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, UserPlus, Users, Settings } from 'lucide-react';
import { 
  getAtendimentoConfigs, 
  createAtendimentoConfig, 
  updateAtendimentoConfig, 
  deleteAtendimentoConfig,
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from '../services/api';

const CONFIG_TYPES = [
  { id: 'origem', label: 'Origem' },
  { id: 'tipo', label: 'Tipo' },
  { id: 'categoria', label: 'Categoria' },
  { id: 'aplicacao', label: 'Aplicação' },
  { id: 'modulo', label: 'Módulo' },
  { id: 'usuarios', label: 'Usuários' },
];

const ConfiguracoesGerais: React.FC = () => {
  const [activeType, setActiveType] = useState(CONFIG_TYPES[0].id);
  const [configs, setConfigs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // States for configs
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  // States for users
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('COLABORADOR');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editingRole, setEditingRole] = useState('COLABORADOR');

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeType === 'usuarios') {
        const response = await getUsers();
        setUsers(response.data);
      } else {
        const response = await getAtendimentoConfigs(activeType);
        setConfigs(response.data);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setEditingId(null);
    setEditingUserId(null);
  }, [activeType]);

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createAtendimentoConfig({ nome: newName, tipo: activeType });
      setNewName('');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar configuração');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Usuário e senha são obrigatórios');
      return;
    }
    try {
      await createUser({ username: newUsername, password: newPassword, role: newRole });
      setNewUsername('');
      setNewPassword('');
      setNewRole('COLABORADOR');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar usuário');
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;
    try {
      await deleteAtendimentoConfig(id);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir configuração');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await deleteUser(id);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir usuário');
    }
  };

  const handleSaveConfigEdit = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await updateAtendimentoConfig(id, editingName);
      setEditingId(null);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar configuração');
    }
  };

  const handleSaveUserEdit = async (id: number) => {
    if (!editingUsername.trim()) return;
    try {
      await updateUser(id, { 
        username: editingUsername, 
        password: editingPassword,
        role: editingRole 
      });
      setEditingUserId(null);
      setEditingPassword('');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar usuário');
    }
  };

  return (
    <div className="text-white">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-[#ed0c00]" size={28} />
        <h1 className="text-2xl font-bold">Configurações Gerais</h1>
      </div>

      <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl w-fit flex-wrap">
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

      {activeType === 'usuarios' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 h-fit">
              <div className="flex items-center gap-2 mb-4 text-[#ed0c00]">
                <UserPlus size={20} />
                <h2 className="text-lg font-semibold text-white">Novo Usuário</h2>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Usuário</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#ed0c00]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#ed0c00]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Função</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#ed0c00] appearance-none"
                  >
                    <option value="COLABORADOR">Colaborador</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#ed0c00] hover:bg-[#ff0d00] text-white py-2 rounded-xl transition-colors font-medium"
                >
                  Cadastrar Usuário
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-gray-400" />
                <h2 className="text-lg font-semibold">Lista de Usuários</h2>
              </div>
              
              {loading ? (
                <div className="text-gray-500 text-sm py-4">Carregando usuários...</div>
              ) : users.length === 0 ? (
                <div className="text-gray-500 text-sm italic py-4 text-center">Nenhum usuário cadastrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/5">
                        <th className="pb-3 font-medium">Usuário</th>
                        <th className="pb-3 font-medium">Função</th>
                        <th className="pb-3 font-medium text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user.id} className="group">
                          <td className="py-4">
                            {editingUserId === user.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingUsername}
                                  onChange={(e) => setEditingUsername(e.target.value)}
                                  className="bg-black border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-[#ed0c00] w-full"
                                  autoFocus
                                />
                                <input
                                  type="password"
                                  value={editingPassword}
                                  onChange={(e) => setEditingPassword(e.target.value)}
                                  placeholder="Nova senha (opcional)"
                                  className="bg-black border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-[#ed0c00] w-full"
                                />
                              </div>
                            ) : (
                              <span className="text-gray-200">{user.username}</span>
                            )}
                          </td>
                          <td className="py-4">
                            {editingUserId === user.id ? (
                              <select
                                value={editingRole}
                                onChange={(e) => setEditingRole(e.target.value)}
                                className="bg-black border border-white/20 rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-[#ed0c00] w-full appearance-none"
                              >
                                <option value="COLABORADOR">Colaborador</option>
                                <option value="ADMINISTRADOR">Administrador</option>
                              </select>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                                user.role === 'ADMINISTRADOR' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            {editingUserId === user.id ? (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleSaveUserEdit(user.id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors">
                                  <Check size={18} />
                                </button>
                                <button onClick={() => setEditingUserId(null)} className="p-2 text-gray-500 hover:bg-white/5 rounded-lg transition-colors">
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setEditingUsername(user.username);
                                    setEditingPassword('');
                                    setEditingRole(user.role);
                                  }}
                                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">Adicionar Novo</h2>
            <form onSubmit={handleAddConfig} className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Nome da ${CONFIG_TYPES.find(t => t.id === activeType)?.label}`}
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
                        <button onClick={() => handleSaveConfigEdit(config.id)} className="text-green-500 hover:text-green-400">
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
                            onClick={() => {
                              setEditingId(config.id);
                              setEditingName(config.nome);
                            }}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteConfig(config.id)}
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
      )}
    </div>
  );
};

export default ConfiguracoesGerais;
