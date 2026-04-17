export interface Group {
  id?: number;
  name: string;
  client_count?: number;
  created_at?: string;
}

export interface PortResult {
  port: number;
  open: boolean;
  response_time?: number; // ms
  error?: string;
}

export interface Client {
  id?: number;
  name: string;
  cnpj: string;
  host: string;
  ports: number[];
  group_id?: number | null;
  ip_interno: string;
  provedor_internet: string;
  status: 'PENDING' | 'OK' | 'ERROR';
  last_test?: string;
  avg_response_time?: number;
}

export interface TestLog {
  id?: number;
  client_id: number;
  client_name: string;
  timestamp: string;
  status: string;
  duration_ms: number;
  details: string;
}
