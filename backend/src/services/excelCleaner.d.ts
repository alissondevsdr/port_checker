export interface ProcessingResult {
    success: boolean;
    message: string;
    totalRows: number;
    processedRows: number;
    invalidRows: number;
    mode?: 'simples' | 'normal';
    buffer?: Buffer;
}
export declare class ExcelProcessor {
    /**
     * Processa um arquivo Excel não formatado e retorna um arquivo normalizado
     * Remove colunas desnecessárias, reordena e renomeia conforme template padrão
     * @param buffer Arquivo Excel em buffer
     * @param mode 'simples' para SIMPLES NACIONAL ou 'normal' para NORMAL
     */
    static processSpreadsheet(buffer: Buffer, mode?: 'simples' | 'normal'): Promise<ProcessingResult>;
    /**
     * Retorna as configurações de estilo para um modo específico
     */
    private static getStylesForMode;
    /**
     * Gera um arquivo Excel formatado com os dados processados
     * Aplica exatamente o mesmo estilo da PLANILHA CORRETA (SIMPLES ou NORMAL)
     */
    private static generateFormattedExcel;
    /**
     * Gera um arquivo Excel com o template padrão para download
     * Mostra a estrutura correta esperada com o mesmo estilo da PLANILHA CORRETA
     */
    static generateTemplateExcel(mode?: 'simples' | 'normal'): Promise<Buffer>;
}
export default ExcelProcessor;
//# sourceMappingURL=excelCleaner.d.ts.map