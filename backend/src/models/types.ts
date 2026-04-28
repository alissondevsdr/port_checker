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

export interface Atendimento {
  id?: number;
  cliente_id: number;
  atendente_id: number;
  data_inicio: string;
  data_fim?: string;
  origem_id: number;
  tipo_id: number;
  categoria_id?: number;
  aplicacao_id?: number;
  modulo_id?: number;
  problema_inicial: string;
  status: 'ABERTO' | 'ENCERRADO' | 'CANCELADO';
  tempo_decorrido?: number;
}

export interface HistoricoResposta {
  id?: number;
  atendimento_id: number;
  atendente_id: number;
  data_registro: string;
  descricao: string;
}

export interface AtendimentoConfig {
  id?: number;
  nome: string;
  tipo: 'origem' | 'tipo' | 'categoria' | 'aplicacao' | 'modulo';
}
