// Template padrão para normalização de planilhas
// Define as colunas esperadas, sua ordem e regras de validação
// Adaptado para a estrutura real da empresa
// Suporta SIMPLES NACIONAL e NORMAL

// Template para SIMPLES NACIONAL (10 colunas)
export const TEMPLATE_SIMPLES_NACIONAL = {
  mode: 'simples',
  columns: [
    { name: 'Código', type: 'text', order: 0 },
    { name: 'Cód.Barra', type: 'text', order: 1 },
    { name: 'Referência', type: 'text', order: 2 },
    { name: 'NCM', type: 'text', order: 3 },
    { name: 'Descrição', type: 'text', order: 4 },
    { name: 'CSOSN', type: 'text', order: 5 },
    { name: 'Class.', type: 'text', order: 6 },
    { name: 'CEST', type: 'text', order: 7 },
    { name: 'IPPT', type: 'text', order: 8 },
    { name: 'Sit. Trib. do ECF', type: 'text', order: 9 },
  ],
};

// Template para NORMAL (24 colunas com impostos)
export const TEMPLATE_NORMAL = {
  mode: 'normal',
  columns: [
    { name: 'Código', type: 'text', order: 0 },
    { name: 'Cód. Barra', type: 'text', order: 1 },
    { name: 'Referência', type: 'text', order: 2 },
    { name: 'NCM', type: 'text', order: 3 },
    { name: 'Descrição', type: 'text', order: 4 },
    { name: 'CST', type: 'text', order: 5 },
    { name: 'Class. Quanto à Origem', type: 'text', order: 6 },
    { name: 'CEST', type: 'text', order: 7 },
    { name: 'IPPT', type: 'text', order: 8 },
    { name: 'Tipo SPED', type: 'text', order: 9 },
    { name: '% ICMS', type: 'text', order: 10 },
    { name: 'Modalidade determinação BC ICMS', type: 'text', order: 11 },
    { name: '% IPI', type: 'text', order: 12 },
    { name: 'IPI Entrada', type: 'text', order: 13 },
    { name: 'IPI Saída', type: 'text', order: 14 },
    { name: '% PIS', type: 'text', order: 15 },
    { name: 'PIS Entrada', type: 'text', order: 16 },
    { name: 'PIS Saída', type: 'text', order: 17 },
    { name: '% COFINS', type: 'text', order: 18 },
    { name: 'COFINS Entrada', type: 'text', order: 19 },
    { name: 'COFINS Saída', type: 'text', order: 20 },
    { name: '% ICMS ST', type: 'text', order: 21 },
    { name: 'Modalidade de determinação BC ICMS ST', type: 'text', order: 22 },
    { name: 'MVA %', type: 'text', order: 23 },
  ],
};

// Template padrão (compatibilidade com código antigo)
export const SPREADSHEET_TEMPLATE = TEMPLATE_SIMPLES_NACIONAL;

// Função para obter o template correto
export function getTemplate(mode: 'simples' | 'normal' = 'simples') {
  return mode === 'normal' ? TEMPLATE_NORMAL : TEMPLATE_SIMPLES_NACIONAL;
}

// Regras de normalização (compartilhadas entre templates)
const normalizationRules = {
  text: (value: any) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .trim()
      .replace(/\s+/g, ' ');
  },
};

// Aliases para nomes de colunas comuns (baseado em análise real dos arquivos)
const columnAliases: Record<string, string[]> = {
  'Código': ['cod', 'codigo', 'code', 'id', 'cod.'],
  'Cód.Barra': ['cod. barra', 'cód. barra', 'codbarr', 'codbar', 'barcode', 'ean', 'cód.barra'],
  'Cód. Barra': ['cod. barra', 'cód. barra', 'codbarr', 'codbar', 'barcode', 'ean', 'cód.barra', 'cód barra'],
  'Referência': ['ref', 'referencia', 'reference', 'ref.', 'referência'],
  'NCM': ['ncm', 'classificacao', 'classification', 'ncm.'],
  'Descrição': ['desc', 'descricao', 'description', 'produto', 'name', 'descrição'],
  
  // SIMPLES NACIONAL
  'CSOSN': ['csosn', 'cst', 'tributacao', 'cst simples'],
  'Class.': ['class', 'classificacao', 'class.'],
  'CEST': ['cest', 'substituicao'],
  'IPPT': ['ippt', 'tipo', 'ippt.'],
  'Sit. Trib. do ECF': ['sit trib', 'situacao', 'sit. trib', 'sit trib ecf'],
  
  // NORMAL - Impostos
  'CST': ['cst', 'csosn', 'tributacao', 'cst icms', 'cst.'],
  'Class. Quanto à Origem': ['class. origem', 'class origem', 'origem', 'class.', 'class', 'class. quanto à origem', 'class quanto à origem'],
  'Tipo SPED': ['tipo sped', 'sped', 'tipo sped.'],
  '% ICMS': ['icms', 'icms %', 'percentual icms', '% icms', '% icms.', 'pct icms'],
  'Modalidade determinação BC ICMS': ['modalidade icms', 'bc icms', 'modalidade bc', 'modal. deter. bc icms', 'modalidade determinação bc icms', 'modaliddae', 'modal deter bc icms'],
  'Modalidade de determinação BC ICMS ST': ['modalidade st', 'bc icms st', 'modal. deter. bc icms st', 'modalidade de determinação bc icms st', 'modal deter bc icms st'],
  
  '% IPI': ['ipi', 'ipi %', '% ipi', 'pct ipi'],
  'IPI Entrada': ['ipi entrada', 'ipi ent', 'ipi ent.', 'ipi entrada.'],
  'IPI Saída': ['ipi saida', 'ipi saída', 'ipi sai', 'ipi sai.', 'ipi saída.'],
  
  '% PIS': ['pis', 'pis %', '% pis', 'pct pis', '% pis.', 'pct pis.'],
  'PIS Entrada': ['pis entrada', 'pis ent', 'pis ent.', 'pis entrada.'],
  'PIS Saída': ['pis saida', 'pis saída', 'pis sai', 'pis sai.', 'pis saída.'],
  
  '% COFINS': ['cofins', 'cofins %', '% cofins', 'pct cofins', 'cofins.'],
  'COFINS Entrada': ['cofins entrada', 'cofins ent', 'cofins ent.', 'cofins entrada.'],
  'COFINS Saída': ['cofins saida', 'cofins saída', 'cofins sai', 'cofins sai.', 'cofins saída.'],
  
  '% ICMS ST': ['icms st', 'icms st %', '% icms st', 'pct icms st'],
  'MVA %': ['mva', 'mva %', '% mva', 'pct mva'],
};

// Funções auxiliares para detectar e normalizar colunas
export function detectColumnMapping(
  headers: string[],
  mode: 'simples' | 'normal' = 'simples'
): Record<string, number | null> {
  const template = getTemplate(mode);
  const mapping: Record<string, number | null> = {};

  template.columns.forEach(col => {
    let index = -1;

    // Busca exata primeiro
    index = headers.findIndex(h => h === col.name);
    
    // Busca com normalização
    if (index === -1) {
      const normalized = col.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
      
      index = headers.findIndex(h =>
        h
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim()
          .includes(normalized)
      );
    }

    // Busca por aliases
    if (index === -1) {
      const aliases = columnAliases[col.name];
      if (aliases && Array.isArray(aliases)) {
        for (const alias of aliases) {
          const normalizedAlias = alias
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
          
          index = headers.findIndex(h =>
            h
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim()
              .includes(normalizedAlias)
          );
          
          if (index >= 0) break;
        }
      }
    }
    
    mapping[col.name] = index >= 0 ? index : null;
  });

  return mapping;
}

// Normalizar um valor de célula
export function normalizeValue(value: any): any {
  return normalizationRules.text(value);
}

// Validar se uma linha é válida
export function isValidRow(row: Record<string, any>): boolean {
  // Uma linha é válida se tem pelo menos o Código preenchido (primeira coluna obrigatória)
  return row['Código'] !== null && row['Código'] !== undefined && row['Código'] !== '';
}
