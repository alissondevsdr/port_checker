import axios from 'axios';
const api = axios.create({
    baseURL: process.env.API_URL || '/api',
    timeout: 30000,
});
api.interceptors.response.use(res => res, err => {
    const msg = err.response?.data?.error || err.message || 'Erro desconhecido';
    return Promise.reject(new Error(msg));
});
// Clients
export const getClients = (group_id) => api.get('/clients', { params: group_id ? { group_id } : undefined });
export const createClient = (data) => api.post('/clients', data);
export const updateClient = (id, data) => api.put(`/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/clients/${id}`);
export const testClient = (id) => api.post(`/clients/${id}/test`);
export const testAllClients = () => api.post('/clients/test-all');
// Groups
export const getGroups = () => api.get('/groups');
export const createGroup = (name) => api.post('/groups', { name });
export const deleteGroup = (id) => api.delete(`/groups/${id}`);
export const testGroup = (id) => api.post(`/groups/${id}/test`);
// CNPJ
export const lookupCNPJ = (cnpj) => api.get(`/cnpj/${cnpj}`);
export default api;
//# sourceMappingURL=api.js.map