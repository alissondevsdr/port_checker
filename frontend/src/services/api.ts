import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.188:3001/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Erro desconhecido';
    return Promise.reject(new Error(msg));
  }
);

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

// Remote Connections
export const getRemoteConnections = () => api.get('/remote-connections');
export const createRemoteConnection = (data: any) => api.post('/remote-connections', data);
export const updateRemoteConnection = (id: number, data: any) => api.put(`/remote-connections/${id}`, data);
export const deleteRemoteConnection = (id: number) => api.delete(`/remote-connections/${id}`);

// Excel Processor
export const processExcelFile = (fileBuffer: Uint8Array | ArrayBuffer, mode: 'simples' | 'normal' = 'simples') => {
  // Converter Uint8Array para base64 sem usar apply (evita stack overflow em arquivos grandes)
  const bytes = fileBuffer instanceof ArrayBuffer ? new Uint8Array(fileBuffer) : fileBuffer;
  
  let base64String = '';
  const chunkSize = 8192; // Processar em chunks para evitar stack overflow
  
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

export default api;
