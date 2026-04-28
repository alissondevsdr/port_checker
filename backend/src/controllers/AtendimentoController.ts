import type { Request, Response } from 'express';
import pool from '../database/connection.js';
import { handleError } from '../utils/errorHandler.js';

export class AtendimentoController {
  static async getAll(req: Request, res: Response) {
    try {
      const { status, cliente_id, atendente_id, data_inicio, data_fim } = req.query;
      let query = `
        SELECT a.*, c.name as cliente_nome, u.username as atendente_nome,
               o.nome as origem_nome, t.nome as tipo_nome,
               cat.nome as categoria_nome, app.nome as aplicacao_nome,
               m_cfg.nome as modulo_nome
        FROM atendimentos a
        LEFT JOIN clients c ON c.id = a.cliente_id
        LEFT JOIN users u ON u.id = a.atendente_id
        LEFT JOIN atendimento_configs o ON o.id = a.origem_id
        LEFT JOIN atendimento_configs t ON t.id = a.tipo_id
        LEFT JOIN atendimento_configs cat ON cat.id = a.categoria_id
        LEFT JOIN atendimento_configs app ON app.id = a.aplicacao_id
        LEFT JOIN atendimento_configs m_cfg ON m_cfg.id = a.modulo_id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (status) {
        query += ' AND a.status = ?';
        params.push(status);
      }
      if (cliente_id) {
        query += ' AND a.cliente_id = ?';
        params.push(cliente_id);
      }
      if (atendente_id) {
        query += ' AND a.atendente_id = ?';
        params.push(atendente_id);
      }
      if (data_inicio) {
        query += ' AND a.data_inicio >= ?';
        params.push(data_inicio);
      }
      if (data_fim) {
        query += ' AND a.data_inicio <= ?';
        params.push(data_fim);
      }

      query += ' ORDER BY a.data_inicio DESC';

      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'Erro ao listar atendimentos');
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const [rows]: any = await pool.query(
        `SELECT a.*, c.name as cliente_nome, u.username as atendente_nome,
                o.nome as origem_nome, t.nome as tipo_nome,
                cat.nome as categoria_nome, app.nome as aplicacao_nome,
                m_cfg.nome as modulo_nome
         FROM atendimentos a
         LEFT JOIN clients c ON c.id = a.cliente_id
         LEFT JOIN users u ON u.id = a.atendente_id
         LEFT JOIN atendimento_configs o ON o.id = a.origem_id
         LEFT JOIN atendimento_configs t ON t.id = a.tipo_id
         LEFT JOIN atendimento_configs cat ON cat.id = a.categoria_id
         LEFT JOIN atendimento_configs app ON app.id = a.aplicacao_id
         LEFT JOIN atendimento_configs m_cfg ON m_cfg.id = a.modulo_id
         WHERE a.id = ?`,
        [id]
      );

      if (!rows[0]) {
        return res.status(404).json({ error: 'Atendimento não encontrado' });
      }

      res.json(rows[0]);
    } catch (error) {
      handleError(res, error, 'Erro ao obter atendimento');
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const {
        cliente_id,
        origem_id,
        tipo_id,
        categoria_id,
        aplicacao_id,
        modulo_id,
        problema_inicial
      } = req.body;
      const atendente_id = (req as any).user.id;

      const [result]: any = await pool.query(
        `INSERT INTO atendimentos 
        (cliente_id, atendente_id, data_inicio, origem_id, tipo_id, categoria_id, aplicacao_id, modulo_id, problema_inicial, status)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, 'ABERTO')`,
        [cliente_id, atendente_id, origem_id, tipo_id, categoria_id || null, aplicacao_id || null, modulo_id || null, problema_inicial]
      );

      res.json({ id: result.insertId, ...req.body, status: 'ABERTO' });
    } catch (error) {
      handleError(res, error, 'Erro ao criar atendimento');
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        origem_id,
        tipo_id,
        categoria_id,
        aplicacao_id,
        modulo_id,
        problema_inicial,
        status
      } = req.body;

      await pool.query(
        `UPDATE atendimentos
         SET origem_id = ?, tipo_id = ?, categoria_id = ?, aplicacao_id = ?, modulo_id = ?, problema_inicial = ?, status = ?
         WHERE id = ?`,
        [origem_id, tipo_id, categoria_id || null, aplicacao_id || null, modulo_id || null, problema_inicial, status, id]
      );

      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar atendimento');
    }
  }

  static async end(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Calculate elapsed time
      const [rows]: any = await pool.query('SELECT data_inicio FROM atendimentos WHERE id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Atendimento não encontrado' });
      
      const data_inicio = new Date(rows[0].data_inicio);
      const data_fim = new Date();
      const tempo_decorrido = Math.round((data_fim.getTime() - data_inicio.getTime()) / 60000);

      await pool.query(
        'UPDATE atendimentos SET status = "ENCERRADO", data_fim = NOW(), tempo_decorrido = ? WHERE id = ?',
        [tempo_decorrido, id]
      );

      res.json({ success: true, tempo_decorrido });
    } catch (error) {
      handleError(res, error, 'Erro ao encerrar atendimento');
    }
  }

  static async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pool.query('UPDATE atendimentos SET status = "CANCELADO", data_fim = NOW() WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao cancelar atendimento');
    }
  }

  static async getHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        `SELECT h.*, u.username as atendente_nome
         FROM historico_respostas h
         JOIN users u ON u.id = h.atendente_id
         WHERE h.atendimento_id = ?
         ORDER BY h.data_registro ASC`,
        [id]
      );
      res.json(rows);
    } catch (error) {
      handleError(res, error, 'Erro ao obter histórico');
    }
  }

  static async addHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { descricao } = req.body;
      const atendente_id = (req as any).user.id;

      const [result]: any = await pool.query(
        'INSERT INTO historico_respostas (atendimento_id, atendente_id, data_registro, descricao) VALUES (?, ?, NOW(), ?)',
        [id, atendente_id, descricao]
      );

      res.json({ id: result.insertId, atendimento_id: id, atendente_id, descricao });
    } catch (error) {
      handleError(res, error, 'Erro ao adicionar histórico');
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const [stats]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
          COALESCE(SUM(status = 'ENCERRADO'), 0) as encerrado,
          COALESCE(SUM(status = 'CANCELADO'), 0) as cancelado,
          COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido ELSE NULL END), 0) as tempo_medio
        FROM atendimentos
      `);
      
      const [todayStats]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido ELSE NULL END), 0) as tempo_medio
        FROM atendimentos
        WHERE DATE(data_inicio) = CURDATE()
      `);

      res.json({
        ...stats[0],
        today: todayStats[0]
      });
    } catch (error) {
      handleError(res, error, 'Erro ao obter estatísticas');
    }
  }
}
