import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  UserPlus, 
  Users, 
  Settings, 
  ChevronRight,
  Headphones,
  ShieldCheck,
  Building2,
  Layout
} from 'lucide-react';
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
import Skeleton from '../components/Skeleton';
import ConfirmationModal from '../components/ConfirmationModal';

const ATENDIMENTO_ITEMS = [
  { id: 'origem', label: 'Origem', icon: Building2 },
  { id: 'tipo', label: 'Tipo', icon: Layout },
  { id: 'categoria', label: 'Categoria', icon: Settings },
  { id: 'aplicacao', label: 'Aplicação', icon: Settings },
  { id: 'modulo', label: 'Módulo', icon: Settings },
];

const GESTAO_ITEMS = [
  { id: 'usuarios', label: 'Usuários', icon: Users }
];

const ConfiguracoesGerais: React.FC = () => {
  const [activeItem, setActiveItem] = useState('origem');
  const [configs, setConfigs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{title: string, msg: string, type: 'success' | 'danger'} | null>(null);
  
  // Confirmation Modals
  const [showConfirmDelete, setShowConfirmDelete] = useState<{id: number, type: 'config' | 'user'} | null>(null);

  // States for configs
  const [newName, setNewName] = useState('');
  const [parentAppId, setParentAppId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
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
      if (activeItem === 'usuarios') {
        const response = await getUsers();
        setUsers(response.data);
      } else {
        const response = await getAtendimentoConfigs(activeItem);
        console.log(`Configs carregadas para ${activeItem}:`, response.data);
        setConfigs(response.data);

        // Se estivermos editando módulos, carregar as aplicações para o select
        if (activeItem === 'modulo') {
          const appsRes = await getAtendimentoConfigs('aplicacao');
          setApplications(appsRes.data);
          console.log('Aplicações disponíveis:', appsRes.data);
        }
      }
    } catch (error: any) {
      console.error(error);
      setFeedback({ title: 'Erro', msg: 'Falha ao carregar dados', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setEditingId(null);
    setEditingUserId(null);
    setParentAppId('');
    setFeedback(null);
  }, [activeItem]);

  const handleAddConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (activeItem === 'modulo' && !parentAppId) {
      setFeedback({ title: 'Atenção', msg: 'Selecione uma aplicação para o módulo', type: 'danger' });
      return;
    }
    try {
      await createAtendimentoConfig({ 
        nome: newName, 
        tipo: activeItem, 
        parent_id: activeItem === 'modulo' ? parseInt(parentAppId) : null 
      });
      setNewName('');
      setFeedback({ title: 'Sucesso', msg: 'Registro adicionado com sucesso', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error(error);
      setFeedback({ title: 'Erro', msg: 'Falha ao adicionar registro', type: 'danger' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    try {
      await createUser({ username: newUsername, password: newPassword, role: newRole });
      setNewUsername('');
      setNewPassword('');
      setNewRole('COLABORADOR');
      setFeedback({ title: 'Sucesso', msg: 'Usuário criado com sucesso', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error(error);
      setFeedback({ title: 'Erro', msg: 'Falha ao criar usuário', type: 'danger' });
    }
  };

  const onConfirmDelete = async () => {
    if (!showConfirmDelete) return;
    try {
      if (showConfirmDelete.type === 'config') {
        await deleteAtendimentoConfig(showConfirmDelete.id);
      } else {
        await deleteUser(showConfirmDelete.id);
      }
      setFeedback({ title: 'Sucesso', msg: 'Excluído com sucesso', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error(error);
      setFeedback({ title: 'Erro', msg: 'Falha ao excluir', type: 'danger' });
    }
  };

  const handleSaveConfigEdit = async (id: number) => {
    if (!editingName.trim()) return;
    try {
      await updateAtendimentoConfig(id, editingName);
      setEditingId(null);
      setFeedback({ title: 'Sucesso', msg: 'Atualizado com sucesso', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error(error);
      setFeedback({ title: 'Erro', msg: 'Falha ao atualizar', type: 'danger' });
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
      setFeedback({ title: 'Sucesso', msg: 'Usuário atualizado com sucesso', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error(error);
      setFeedback({ title: 'Erro', msg: 'Falha ao atualizar usuário', type: 'danger' });
    }
  };

  return (
    <div className="text-white pb-12 fade-up max-w-6xl mx-auto">
      {feedback && (
        <div className="fixed bottom-8 right-8 z-[10001] animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            feedback.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
          }`}>
            <div className="flex-1">
              <div className="font-bold text-sm">{feedback.title}</div>
              <div className="text-xs opacity-80">{feedback.msg}</div>
            </div>
            <button onClick={() => setFeedback(null)} className="ml-4 opacity-50 hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 rounded-2xl bg-[#ed0c00]/10 text-[#ed0c00]">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
          <p className="text-gray-500 text-sm">Gerencie os parâmetros globais, permissões e fluxos de atendimento.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Menu Lateral Interno */}
        <div className="w-full lg:w-80 shrink-0 space-y-8">
          {/* Bloco 1: Configurações de Atendimento */}
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="px-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">
              <Headphones size={12} />
              Config. de Atendimento
            </div>
            <div className="space-y-1">
              {ATENDIMENTO_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-bold ${
                    activeItem === item.id 
                      ? 'bg-[#ed0c00] text-white shadow-lg shadow-[#ed0c00]/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={16} />
                    {item.label}
                  </div>
                  {activeItem === item.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>

          {/* Bloco 2: Gestão de Sistema */}
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="px-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">
              <ShieldCheck size={12} />
              Gestão de Sistema
            </div>
            <div className="space-y-1">
              {GESTAO_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-bold ${
                    activeItem === item.id 
                      ? 'bg-[#ed0c00] text-white shadow-lg shadow-[#ed0c00]/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={16} />
                    {item.label}
                  </div>
                  {activeItem === item.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 min-w-0">
          {activeItem === 'usuarios' ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="xl:col-span-5">
                <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl sticky top-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-[#ed0c00]/10 text-[#ed0c00]">
                      <UserPlus size={20} />
                    </div>
                    <h2 className="text-lg font-bold">Novo Usuário</h2>
                  </div>
                  <form onSubmit={handleAddUser} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Username</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Ex: joao.silva"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ed0c00] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Senha de Acesso</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ed0c00] transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nível de Permissão</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ed0c00] appearance-none transition-all"
                      >
                        <option value="COLABORADOR">Colaborador (Padrão)</option>
                        <option value="ADMINISTRADOR">Administrador (Total)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#ed0c00] hover:bg-[#ff0d00] text-white py-4 rounded-xl text-sm transition-all font-bold shadow-xl shadow-[#ed0c00]/20 flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Criar Conta de Usuário
                    </button>
                  </form>
                </div>
              </div>

              <div className="xl:col-span-7">
                <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Users size={20} className="text-gray-500" />
                      <h2 className="text-lg font-bold">Utilizadores Ativos</h2>
                    </div>
                    <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 border border-white/5">
                      {users.length} Registros
                    </span>
                  </div>
                  
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.id} className="group bg-black/40 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black text-gray-400 border border-white/5">
                                {user.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                {editingUserId === user.id ? (
                                  <input
                                    type="text"
                                    value={editingUsername}
                                    onChange={(e) => setEditingUsername(e.target.value)}
                                    className="bg-black border border-[#ed0c00] rounded-lg px-3 py-1 text-sm focus:outline-none w-full"
                                    autoFocus
                                  />
                                ) : (
                                  <div className="font-bold text-gray-200">{user.username}</div>
                                )}
                                <div className="mt-1">
                                  {editingUserId === user.id ? (
                                    <select
                                      value={editingRole}
                                      onChange={(e) => setEditingRole(e.target.value)}
                                      className="bg-black border border-white/10 rounded-lg px-2 py-0.5 text-[10px] focus:outline-none"
                                    >
                                      <option value="COLABORADOR">COLABORADOR</option>
                                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                                    </select>
                                  ) : (
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                      user.role === 'ADMINISTRADOR' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                                    }`}>
                                      {user.role}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {editingUserId === user.id ? (
                                <>
                                  <button onClick={() => handleSaveUserEdit(user.id)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-xl transition-all">
                                    <Check size={20} />
                                  </button>
                                  <button onClick={() => setEditingUserId(null)} className="p-2 text-gray-500 hover:bg-white/5 rounded-xl transition-all">
                                    <X size={20} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingUserId(user.id);
                                      setEditingUsername(user.username);
                                      setEditingPassword('');
                                      setEditingRole(user.role);
                                    }}
                                    className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setShowConfirmDelete({ id: user.id, type: 'user' })}
                                    className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {editingUserId === user.id && (
                            <input
                              type="password"
                              value={editingPassword}
                              onChange={(e) => setEditingPassword(e.target.value)}
                              placeholder="Nova senha (deixe em branco para manter)"
                              className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#ed0c00] transition-all"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl h-fit">
                <div className="flex items-center gap-3 mb-6 text-[#ed0c00]">
                  <Plus size={20} />
                  <h2 className="text-lg font-bold text-white">Adicionar Novo Registro</h2>
                </div>
                <form onSubmit={handleAddConfig} className="space-y-4">
                  {activeItem === 'modulo' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Aplicação</label>
                      <select
                        value={parentAppId}
                        onChange={(e) => setParentAppId(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ed0c00] transition-all"
                      >
                        <option value="">Selecione uma aplicação...</option>
                        {applications.map(app => (
                          <option key={app.id} value={app.id}>{app.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nome / Descrição</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={`Ex: Novo item para ${ATENDIMENTO_ITEMS.find(i => i.id === activeItem)?.label}`}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ed0c00] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#ed0c00] hover:bg-[#ff0d00] text-white py-4 rounded-xl transition-all text-sm font-bold shadow-xl shadow-[#ed0c00]/20 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Confirmar Cadastro
                  </button>
                </form>
              </div>

              <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 shadow-2xl min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <Layout size={20} className="text-gray-500" />
                    Listagem de {ATENDIMENTO_ITEMS.find(i => i.id === activeItem)?.label}
                  </h2>
                  <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 border border-white/5 uppercase">
                    {activeItem === 'modulo' 
                      ? configs.filter(c => c.parent_id == parentAppId).length 
                      : configs.length} Registros
                  </span>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : activeItem === 'modulo' && !parentAppId ? (
                  <div className="text-gray-600 text-sm italic py-12 text-center border-2 border-dashed border-white/5 rounded-2xl px-6">
                    Selecione uma aplicação acima para visualizar os módulos vinculados.
                  </div>
                ) : (configs.length === 0 || (activeItem === 'modulo' && configs.filter(c => c.parent_id == parentAppId).length === 0)) ? (
                  <div className="text-gray-600 text-sm italic py-12 text-center border-2 border-dashed border-white/5 rounded-2xl px-6">
                    Nenhum item cadastrado nesta categoria.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {configs
                      .filter(config => activeItem !== 'modulo' || config.parent_id == parentAppId)
                      .map((config) => (
                      <div 
                        key={config.id}
                        className="flex items-center justify-between bg-black/40 border border-white/5 rounded-2xl px-5 py-4 group hover:border-white/20 transition-all"
                      >
                        {editingId === config.id ? (
                          <div className="flex-1 flex gap-3">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 bg-black border border-[#ed0c00] rounded-xl px-3 py-1.5 text-sm focus:outline-none"
                              autoFocus
                            />
                            <button onClick={() => handleSaveConfigEdit(config.id)} className="text-green-500 hover:bg-green-500/10 p-2 rounded-lg transition-all">
                              <Check size={20} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-gray-500 hover:bg-white/5 p-2 rounded-lg transition-all">
                              <X size={20} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{config.nome}</span>
                              {config.parent_nome && (
                                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{config.parent_nome}</span>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => {
                                  setEditingId(config.id);
                                  setEditingName(config.nome);
                                }}
                                className="p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => setShowConfirmDelete({ id: config.id, type: 'config' })}
                                className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
      </div>

      <ConfirmationModal 
        isOpen={!!showConfirmDelete}
        onClose={() => setShowConfirmDelete(null)}
        onConfirm={onConfirmDelete}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Excluir"
      />
    </div>
  );
};

export default ConfiguracoesGerais;
