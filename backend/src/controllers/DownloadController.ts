import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, stat } from 'node:fs/promises';
import { handleError } from '../utils/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadsDir = path.resolve(__dirname, '../../../downloads');

export class DownloadController {
  static async list(req: Request, res: Response) {
    try {
      const type = req.query.type || 'general';
      let targetDir = downloadsDir;

      if (type === 'drivers') {
        targetDir = path.join(downloadsDir, 'drivers');
      }

      try {
        const entries = await readdir(targetDir, { withFileTypes: true });
        const files = await Promise.all(
          entries
            .filter((entry) => entry.isFile())
            .map(async (entry) => {
              const fullPath = path.join(targetDir, entry.name);
              const stats = await stat(fullPath);
              return {
                name: entry.name.replace(/\.[^.]+$/, ''),
                filename: entry.name,
                size: DownloadController.toReadableSize(stats.size),
                sizeBytes: stats.size,
                modifiedAt: stats.mtime.toISOString(),
              };
            })
        );

        files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
        return res.json(files);
      } catch (dirError: any) {
        if (dirError?.code === 'ENOENT') {
          return res.json([]);
        }
        throw dirError;
      }
    } catch (error) {
      return handleError(res, error, 'Falha ao listar arquivos de download');
    }
  }

  private static toReadableSize(sizeBytes: number) {
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = sizeBytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
  }
}
