import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Interceptor para adicionar o token JWT em cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isExpired = err.response?.data?.error === 'TOKEN_EXPIRED';
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Avisar o usuário se o erro for de expiração
      if (isExpired) {
        alert('Sua sessão expirou por inatividade. Por favor, faça login novamente.');
      }

      // Redireciona para o login (home) se não estiver lá
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Erro desconhecido';
    return Promise.reject(new Error(msg));
  }
);

// Auth
export const login = (username: string, password: string) => 
  api.post('/auth/login', { username, password });

// Clients
export const getClients = (groupId?: number) =>
  api.get('/clients', { params: groupId ? { group_id: groupId } : undefined });
export const createClient = (data: any) => api.post('/clients', data);
export const updateClient = (id: number, data: any) => api.put(`/clients/${id}`, data);
export const deleteClient = (id: number) => api.delete(`/clients/${id}`);
export const testClient = (id: number) => api.post(`/clients/${id}/test`);
export const testAllClients = () => api.post('/clients/test-all');

// Groups
export const getGroups = () => api.get('/groups');
export const createGroup = (name: string) => api.post('/groups', { name });
export const deleteGroup = (id: number) => api.delete(`/groups/${id}`);
export const testGroup = (id: number) => api.post(`/groups/${id}/test`);

// CNPJ
export const lookupCNPJ = (cnpj: string) => api.get(`/cnpj/${cnpj}`);

// Stats & Logs
export const getStats = () => api.get('/stats');
export const getLogs = (params?: { limit?: number; client_id?: number }) =>
  api.get('/logs', { params });

// Remote Companies
export const getRemoteCompanies = () => api.get('/remote-companies');
export const createRemoteCompany = (name: string) => api.post('/remote-companies', { name });
export const updateRemoteCompany = (id: number, name: string) => api.put(`/remote-companies/${id}`, { name });
export const deleteRemoteCompany = (id: number) => api.delete(`/remote-companies/${id}`);

export const getRemoteConnections = (companyId?: number) => api.get('/remote-connections', { params: { company_id: companyId } });
export const createRemoteConnection = (data: any) => api.post('/remote-connections', data);
export const updateRemoteConnection = (id: number, data: any) => api.put(`/remote-connections/${id}`, data);
export const deleteRemoteConnection = (id: number) => api.delete(`/remote-connections/${id}`);

// Excel Processor
export const processExcelFile = (fileBuffer: Uint8Array | ArrayBuffer, mode: 'simples' | 'normal' = 'simples') => {
  const bytes = fileBuffer instanceof ArrayBuffer ? new Uint8Array(fileBuffer) : fileBuffer;
  let base64String = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    base64String += String.fromCharCode.apply(null, Array.from(chunk) as any);
  }
  base64String = btoa(base64String);
  return api.post('/excel/process', {
    file: base64String,
    mode,
  });
};

export const downloadTemplateExcel = async (mode: 'simples' | 'normal' = 'simples') => {
  const response = await api.get('/excel/template', {
    params: { mode },
    responseType: 'blob',
  });
  return response.data;
};

// Manual Reports
export const getRequesterIp = () => api.get('/reports/client-ip');
export const generateFrigoReport = (params: { month: number; year: number; host: string }) =>
  api.post('/reports/frigo', params);
export const generatePadariaSTReport = (params: { emitente: 'BRUNETTO' | 'A_C_COSTA'; month: number; year: number; host: string }) =>
  api.post('/reports/padaria/st', params);
export const generatePadariaMonofasicoReport = (params: { emitente: 'BRUNETTO' | 'A_C_COSTA'; month: number; year: number; host: string }) =>
  api.post('/reports/padaria/monofasico', params);

// Downloads
export interface DownloadFile {
  name: string;
  filename: string;
  size: string;
  sizeBytes: number;
  modifiedAt: string;
}

export const getDownloads = (type: 'general' | 'drivers' = 'general') => 
  api.get<DownloadFile[]>('/downloads', { params: { type } });

export const getDownloadUrl = (filename: string, subfolder?: string) => {
  const base = API_BASE_URL.replace(/\/api\/?$/, '');
  const path = subfolder ? `downloads/${subfolder}/${encodeURIComponent(filename)}` : `downloads/${encodeURIComponent(filename)}`;
  return `${base}/${path}`;
};

// Atendimento Configs
export const getAtendimentoConfigs = (tipo: string) => api.get(`/atendimento-configs/${tipo}`);
export const createAtendimentoConfig = (data: { nome: string; tipo: string }) => api.post('/atendimento-configs', data);
export const updateAtendimentoConfig = (id: number, nome: string) => api.put(`/atendimento-configs/${id}`, { nome });
export const deleteAtendimentoConfig = (id: number) => api.delete(`/atendimento-configs/${id}`);

// Atendimentos
export const getAtendimentos = (params?: any) => api.get('/atendimentos', { params });
export const getAtendimentoById = (id: number) => api.get(`/atendimentos/${id}`);
export const createAtendimento = (data: any) => api.post('/atendimentos', data);
export const updateAtendimento = (id: number, data: any) => api.put(`/atendimentos/${id}`, data);
export const endAtendimento = (id: number) => api.post(`/atendimentos/${id}/encerrar`);
export const cancelAtendimento = (id: number) => api.post(`/atendimentos/${id}/cancelar`);
export const getAtendimentoHistory = (id: number) => api.get(`/atendimentos/${id}/historico`);
export const addAtendimentoHistory = (id: number, descricao: string) => api.post(`/atendimentos/${id}/historico`, { descricao });
export const getAtendimentoStats = () => api.get('/atendimentos/stats');

export default api;
