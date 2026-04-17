import axios from 'axios';

const APIS = [
  (cnpj: string) => `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
  (cnpj: string) => `https://publica.cnpj.ws/cnpj/${cnpj}`,
];

export async function fetchCNPJ(cnpj: string) {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) throw new Error('CNPJ inválido — informe 14 dígitos.');

  let lastError: Error | null = null;

  for (const buildUrl of APIS) {
    try {
      const url = buildUrl(clean);
      const { data } = await axios.get(url, {
        timeout: 12000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
          Accept: 'application/json',
        },
      });
      return data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new Error('CNPJ não encontrado na Receita Federal.');
      }
      if (err?.response?.status === 429) {
        throw new Error('Limite de consultas atingido. Aguarde alguns segundos e tente novamente.');
      }
      lastError = new Error(`Falha na consulta: ${err?.message ?? 'erro desconhecido'}`);
    }
  }

  throw lastError ?? new Error('Erro ao consultar CNPJ.');
}
