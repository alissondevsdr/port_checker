// Serviço principal para processar e normalizar arquivos Excel
import XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { getTemplate, detectColumnMapping, normalizeValue, isValidRow, } from './excelTemplate.js';
export class ExcelProcessor {
    /**
     * Processa um arquivo Excel não formatado e retorna um arquivo normalizado
     * Remove colunas desnecessárias, reordena e renomeia conforme template padrão
     * @param buffer Arquivo Excel em buffer
     * @param mode 'simples' para SIMPLES NACIONAL ou 'normal' para NORMAL
     */
    static async processSpreadsheet(buffer, mode = 'simples') {
        try {
            const template = getTemplate(mode);
            // Ler o arquivo Excel
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                return {
                    success: false,
                    message: 'Arquivo Excel vazio',
                    totalRows: 0,
                    processedRows: 0,
                    invalidRows: 0,
                    mode,
                };
            }
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                return {
                    success: false,
                    message: 'Erro ao ler planilha',
                    totalRows: 0,
                    processedRows: 0,
                    invalidRows: 0,
                    mode,
                };
            }
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (data.length === 0) {
                return {
                    success: false,
                    message: 'Nenhum dado encontrado no arquivo',
                    totalRows: 0,
                    processedRows: 0,
                    invalidRows: 0,
                    mode,
                };
            }
            // Primeiro item é o header
            const rawHeaders = (data[0] || []);
            const rows = data.slice(1);
            // Detectar mapeamento de colunas (encontra onde cada coluna correta está na planilha incorreta)
            const columnMapping = detectColumnMapping(rawHeaders, mode);
            // Validar se as colunas críticas foram encontradas (apenas Código é obrigatório)
            const criticalColumns = ['Código'];
            const missingCritical = criticalColumns.filter(col => columnMapping[col] === null || columnMapping[col] === undefined);
            if (missingCritical.length > 0) {
                return {
                    success: false,
                    message: `Coluna crítica não encontrada: ${missingCritical.join(', ')}. Certifique-se de que o arquivo tem a coluna "Código".`,
                    totalRows: rows.length,
                    processedRows: 0,
                    invalidRows: 0,
                    mode,
                };
            }
            // Avisar sobre colunas não encontradas (informativo, não bloqueador)
            const notFoundColumns = template.columns.filter(col => columnMapping[col.name] === null || columnMapping[col.name] === undefined);
            if (notFoundColumns.length > 0) {
                console.log(`⚠️ Colunas não encontradas (serão preenchidas com vazio): ${notFoundColumns.map(c => c.name).join(', ')}`);
            }
            // Processar linhas - seleciona apenas as colunas corretas e na ordem correta
            const processedRows = [];
            let invalidCount = 0;
            for (const row of rows) {
                const processedRow = {};
                // Mapear cada coluna esperada na ordem correta
                for (const column of template.columns) {
                    const sourceIndex = columnMapping[column.name];
                    let value = null;
                    if (sourceIndex !== null && sourceIndex !== undefined && sourceIndex >= 0) {
                        value = row[sourceIndex];
                    }
                    // Normalizar valor (apenas trim para texto)
                    processedRow[column.name] = normalizeValue(value);
                }
                // Validar linha
                if (isValidRow(processedRow)) {
                    processedRows.push(processedRow);
                }
                else {
                    invalidCount++;
                }
            }
            // Gerar novo arquivo Excel formatado
            const outputBuffer = await this.generateFormattedExcel(processedRows, mode);
            return {
                success: true,
                message: `Arquivo processado com sucesso! ${processedRows.length} linhas válidas.`,
                totalRows: rows.length,
                processedRows: processedRows.length,
                invalidRows: invalidCount,
                mode,
                buffer: outputBuffer,
            };
        }
        catch (error) {
            console.error('Erro ao processar arquivo Excel:', error);
            return {
                success: false,
                message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                totalRows: 0,
                processedRows: 0,
                invalidRows: 0,
                mode,
            };
        }
    }
    /**
     * Retorna as configurações de estilo para um modo específico
     */
    static getStylesForMode(mode) {
        if (mode === 'normal') {
            return {
                columnWidths: {
                    'Código': 12.33,
                    'Cód. Barra': 25.16,
                    'Referência': 24,
                    'NCM': 12.33,
                    'Descrição': 94,
                    'CST': 10,
                    'Class. Quanto à Origem': 12,
                    'CEST': 12,
                    'IPPT': 6.5,
                    'Tipo SPED': 10,
                    '% ICMS': 8,
                    'Modalidade determinação BC ICMS': 12,
                    '% IPI': 8,
                    'IPI Entrada': 10,
                    'IPI Saída': 10,
                    '% PIS': 8,
                    'PIS Entrada': 10,
                    'PIS Saída': 10,
                    '% COFINS': 10,
                    'COFINS Entrada': 10,
                    'COFINS Saída': 10,
                    '% ICMS ST': 10,
                    'Modalidade de determinação BC ICMS ST': 12,
                    'MVA %': 8,
                },
                columnColors: {
                    // Cinza para produto
                    'Código': 'FFF3F3F3',
                    'Cód. Barra': 'FFF3F3F3',
                    'Referência': 'FFF3F3F3',
                    'NCM': 'FFFFFF00',
                    'Descrição': 'FFF3F3F3',
                    // Amarelo para impostos
                    'CST': 'FFFFFF00',
                    'Class. Quanto à Origem': 'FFFFFF00',
                    'CEST': 'FFFFFF00',
                    'IPPT': 'FFFFFF00',
                    'Tipo SPED': 'FFFFFF00',
                    '% ICMS': 'FFFFFF00',
                    'Modalidade determinação BC ICMS': 'FFFFFF00',
                    '% IPI': 'FFFFFF00',
                    'IPI Entrada': 'FFFFFF00',
                    'IPI Saída': 'FFFFFF00',
                    '% PIS': 'FFFFFF00',
                    'PIS Entrada': 'FFFFFF00',
                    'PIS Saída': 'FFFFFF00',
                    '% COFINS': 'FFFFFF00',
                    'COFINS Entrada': 'FFFFFF00',
                    'COFINS Saída': 'FFFFFF00',
                    '% ICMS ST': 'FFFFFF00',
                    'Modalidade de determinação BC ICMS ST': 'FFFFFF00',
                    'MVA %': 'FFFFFF00',
                },
                dataColors: {
                    'Código': 'FFE8E8E8',
                    'Cód. Barra': 'FFE8E8E8',
                    'Referência': 'FFE8E8E8',
                    'NCM': 'FFFFFF00',
                    'Descrição': 'FFE8E8E8',
                    'CST': 'FFFFFF00',
                    'Class. Quanto à Origem': 'FFFFFF00',
                    'CEST': 'FFFFFF00',
                    'IPPT': 'FFFFFF00',
                    'Tipo SPED': 'FFFFFF00',
                    '% ICMS': 'FFFFFF00',
                    'Modalidade determinação BC ICMS': 'FFFFFF00',
                    '% IPI': 'FFFFFF00',
                    'IPI Entrada': 'FFFFFF00',
                    'IPI Saída': 'FFFFFF00',
                    '% PIS': 'FFFFFF00',
                    'PIS Entrada': 'FFFFFF00',
                    'PIS Saída': 'FFFFFF00',
                    '% COFINS': 'FFFFFF00',
                    'COFINS Entrada': 'FFFFFF00',
                    'COFINS Saída': 'FFFFFF00',
                    '% ICMS ST': 'FFFFFF00',
                    'Modalidade de determinação BC ICMS ST': 'FFFFFF00',
                    'MVA %': 'FFFFFF00',
                },
                columnAlignments: {
                    'Descrição': 'left',
                    'Modalidade determinação BC ICMS': 'left',
                    'Modalidade de determinação BC ICMS ST': 'left',
                },
            };
        }
        // SIMPLES NACIONAL
        return {
            columnWidths: {
                'Código': 12.33203125,
                'Cód.Barra': 25.1640625,
                'Referência': 24,
                'NCM': 12.33203125,
                'Descrição': 94,
                'CSOSN': 12.33203125,
                'Class.': 12.33203125,
                'CEST': 8.83203125,
                'IPPT': 6.5,
                'Sit. Trib. do ECF': 71.83203125,
            },
            columnColors: {
                'Código': 'FFF3F3F3',
                'Cód.Barra': 'FFF3F3F3',
                'Referência': 'FFF3F3F3',
                'NCM': 'FFFFFF00',
                'Descrição': 'FFF3F3F3',
                'CSOSN': 'FFFFFF00',
                'Class.': 'FFFFFF00',
                'CEST': 'FFFFFF00',
                'IPPT': 'FFFFFF00',
                'Sit. Trib. do ECF': 'FFF3F3F3',
            },
            dataColors: {
                'Código': 'FFE8E8E8',
                'Cód.Barra': 'FFE8E8E8',
                'Referência': 'FFE8E8E8',
                'NCM': 'FFFFFF00',
                'Descrição': 'FFE8E8E8',
                'CSOSN': 'FFFFFF00',
                'Class.': 'FFFFFF00',
                'CEST': 'FFFFFF00',
                'IPPT': 'FFFFFF00',
                'Sit. Trib. do ECF': 'FFE8E8E8',
            },
            columnAlignments: {
                'Descrição': 'left',
                'Sit. Trib. do ECF': 'left',
            },
        };
    }
    /**
     * Gera um arquivo Excel formatado com os dados processados
     * Aplica exatamente o mesmo estilo da PLANILHA CORRETA (SIMPLES ou NORMAL)
     */
    static async generateFormattedExcel(rows, mode = 'simples') {
        const template = getTemplate(mode);
        const styles = this.getStylesForMode(mode);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Produtos');
        // Configurar header - cada célula com seu próprio estilo
        const headerRow = worksheet.addRow(template.columns.map(c => c.name));
        headerRow.height = 18.75; // Altura exata do arquivo original
        headerRow.eachCell((cell, colNumber) => {
            const column = template.columns[colNumber - 1];
            if (!column)
                return;
            const columnName = column.name;
            const bgColor = styles.columnColors[columnName] || 'FFF3F3F3';
            const align = styles.columnAlignments[columnName] === 'left' ? 'left' : 'center';
            cell.font = {
                bold: true,
                color: { argb: 'FF000000' },
                size: 8,
                name: 'Tahoma',
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: bgColor },
            };
            cell.alignment = {
                horizontal: align,
                vertical: 'top',
                wrapText: true,
            };
            cell.border = {
                left: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                right: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                top: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                bottom: { style: 'thin', color: { argb: 'FFA0A0A0' } },
            };
        });
        // Adicionar dados com estilo igual ao original
        for (const row of rows) {
            const values = template.columns.map(col => row[col.name] ?? '');
            const dataRow = worksheet.addRow(values);
            dataRow.height = 18.75;
            dataRow.eachCell((cell, colNumber) => {
                const column = template.columns[colNumber - 1];
                if (!column)
                    return;
                const columnName = column.name;
                const bgColor = styles.dataColors[columnName] || 'FFE8E8E8';
                const align = styles.columnAlignments[columnName] === 'left' ? 'left' : 'center';
                cell.font = {
                    bold: true,
                    color: { argb: 'FF000000' },
                    size: 8,
                    name: 'Tahoma',
                };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor },
                };
                cell.alignment = {
                    horizontal: align,
                    vertical: 'top',
                    wrapText: true,
                };
                cell.border = {
                    left: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                    right: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                    top: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                    bottom: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                };
            });
        }
        // Configurar largura das colunas
        template.columns.forEach((col, idx) => {
            const column = worksheet.getColumn(idx + 1);
            column.width = styles.columnWidths[col.name] || 12.33;
        });
        // Gerar buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
    /**
     * Gera um arquivo Excel com o template padrão para download
     * Mostra a estrutura correta esperada com o mesmo estilo da PLANILHA CORRETA
     */
    static async generateTemplateExcel(mode = 'simples') {
        const template = getTemplate(mode);
        const styles = this.getStylesForMode(mode);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Produtos');
        // Header
        const headerRow = worksheet.addRow(template.columns.map(c => c.name));
        headerRow.height = 18.75;
        headerRow.eachCell((cell, colNumber) => {
            const column = template.columns[colNumber - 1];
            if (!column)
                return;
            const columnName = column.name;
            const bgColor = styles.columnColors[columnName] || 'FFF3F3F3';
            const align = styles.columnAlignments[columnName] === 'left' ? 'left' : 'center';
            cell.font = { bold: true, color: { argb: 'FF000000' }, size: 8, name: 'Tahoma' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.alignment = { horizontal: align, vertical: 'top', wrapText: true };
            cell.border = {
                left: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                right: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                top: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                bottom: { style: 'thin', color: { argb: 'FFA0A0A0' } },
            };
        });
        // Linhas vazias
        for (let i = 0; i < 5; i++) {
            const row = worksheet.addRow(template.columns.map(() => ''));
            row.height = 18.75;
            row.eachCell((cell, colNumber) => {
                const column = template.columns[colNumber - 1];
                if (!column)
                    return;
                const columnName = column.name;
                const bgColor = styles.dataColors[columnName] || 'FFE8E8E8';
                const align = styles.columnAlignments[columnName] === 'left' ? 'left' : 'center';
                cell.font = { bold: true, color: { argb: 'FF000000' }, size: 8, name: 'Tahoma' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.alignment = { horizontal: align, vertical: 'top', wrapText: true };
                cell.border = {
                    left: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                    right: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                    top: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                    bottom: { style: 'thin', color: { argb: 'FFA0A0A0' } },
                };
            });
        }
        // Larguras
        template.columns.forEach((col, idx) => {
            worksheet.getColumn(idx + 1).width = styles.columnWidths[col.name] || 12.33;
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    }
}
export default ExcelProcessor;
//# sourceMappingURL=excelCleaner.js.map