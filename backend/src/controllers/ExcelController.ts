import type { Request, Response } from 'express';
import ExcelProcessor from '../services/excelCleaner.js';
import { handleError } from '../utils/errorHandler.js';

export class ExcelController {
  static async process(req: Request, res: Response) {
    try {
      if (!req.body || !req.body.file) {
        return res.status(400).json({ error: 'Nenhum arquivo fornecido' });
      }

      const buffer = Buffer.from(req.body.file, 'base64');
      const mode = req.body.mode || 'simples';

      const result = await ExcelProcessor.processSpreadsheet(buffer, mode);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: result.message,
        totalRows: result.totalRows,
        processedRows: result.processedRows,
        invalidRows: result.invalidRows,
        file: result.buffer?.toString('base64'),
      });
    } catch (error) {
      handleError(res, error, 'Erro ao processar Excel');
    }
  }

  static async getTemplate(req: Request, res: Response) {
    try {
      const mode = (req.query.mode as string) || 'simples';
      const buffer = await ExcelProcessor.generateTemplateExcel(mode as 'simples' | 'normal');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="template_padrao.xlsx"');
      res.send(buffer);
    } catch (error) {
      handleError(res, error, 'Erro ao gerar template');
    }
  }
}
