declare const api: import("axios").AxiosInstance;
export declare const getClients: (group_id?: number | string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const createClient: (data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const updateClient: (id: number, data: any) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const deleteClient: (id: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const testClient: (id: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const testAllClients: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const getGroups: () => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const createGroup: (name: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const deleteGroup: (id: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const testGroup: (id: number) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export declare const lookupCNPJ: (cnpj: string) => Promise<import("axios").AxiosResponse<any, any, {}>>;
export default api;
//# sourceMappingURL=api.d.ts.map