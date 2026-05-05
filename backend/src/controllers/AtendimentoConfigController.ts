import type { Request, Response } from 'express';
import pool from '../database/connection.js';
import { handleError } from '../utils/errorHandler.js';

export class AtendimentoConfigController {
  static async getAllByType(req: Request, res: Response) {
    try {
      const { tipo } = req.params;
      const [rows] = await pool.query(
        `SELECT ac.*, p.nome as parent_nome 
         FROM atendimento_configs ac 
         LEFT JOIN atendimento_configs p ON ac.parent_id = p.id 
         WHERE ac.tipo = ? 
         ORDER BY ac.nome ASC`,
        [tipo]
      );
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'Erro ao listar configurações');
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { nome, tipo, parent_id } = req.body;
      console.log('Criando config:', { nome, tipo, parent_id });
      if (!nome?.trim() || !tipo) {
        return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
      }

      const [result]: any = await pool.query(
        'INSERT INTO atendimento_configs (nome, tipo, parent_id) VALUES (?, ?, ?)',
        [nome.trim(), tipo, parent_id || null]
      );
      console.log('Resultado da inserção:', result);
      res.json({ id: result.insertId, nome, tipo, parent_id });
    } catch (error) {
      handleError(res, error, 'Erro ao criar configuração');
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome } = req.body;
      if (!nome?.trim()) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }

      await pool.query(
        'UPDATE atendimento_configs SET nome = ? WHERE id = ?',
        [nome.trim(), id]
      );
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar configuração');
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.query('DELETE FROM atendimento_configs WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir configuração');
    }
  }
}
