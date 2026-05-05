import type { Request, Response } from 'express';
import pool from '../database/connection.js';
import { handleError } from '../utils/errorHandler.js';

export class AtendimentoController {
  static async getAll(req: Request, res: Response) {
    try {
      const { status, cliente_id, atendente_id, data_inicio, data_fim } = req.query;
      let query = `
        SELECT a.*, c.name as cliente_nome, c.cnpj as cnpj, u.username as atendente_nome,
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
        `SELECT a.*, c.name as cliente_nome, c.cnpj as cnpj, u.username as atendente_nome,
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
      const currentUser = (req as any).user;
      
      const [rows]: any = await pool.query('SELECT atendente_id FROM atendimentos WHERE id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Atendimento não encontrado' });
      
      if (rows[0].atendente_id !== currentUser.id && currentUser.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Você só pode alterar os seus próprios atendimentos' });
      }

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
      const currentUser = (req as any).user;
      
      const [rows]: any = await pool.query('SELECT atendente_id, data_inicio FROM atendimentos WHERE id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Atendimento não encontrado' });

      if (rows[0].atendente_id !== currentUser.id && currentUser.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Você só pode encerrar os seus próprios atendimentos' });
      }
      
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
      const currentUser = (req as any).user;
      
      const [rows]: any = await pool.query('SELECT atendente_id FROM atendimentos WHERE id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Atendimento não encontrado' });

      if (rows[0].atendente_id !== currentUser.id && currentUser.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Você só pode cancelar os seus próprios atendimentos' });
      }

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
      const currentUser = (req as any).user;

      const [rows]: any = await pool.query('SELECT atendente_id, status FROM atendimentos WHERE id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Atendimento não encontrado' });

      if (rows[0].status !== 'ABERTO') {
        return res.status(403).json({ error: 'Não é possível adicionar respostas a atendimentos encerrados ou cancelados' });
      }

      if (rows[0].atendente_id !== currentUser.id && currentUser.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Você só pode adicionar histórico aos seus próprios atendimentos' });
      }

      const [result]: any = await pool.query(
        'INSERT INTO historico_respostas (atendimento_id, atendente_id, data_registro, descricao) VALUES (?, ?, NOW(), ?)',
        [id, currentUser.id, descricao]
      );

      res.json({ id: result.insertId, atendimento_id: id, atendente_id: currentUser.id, descricao });
    } catch (error) {
      handleError(res, error, 'Erro ao adicionar histórico');
    }
  }

  static async updateHistory(req: Request, res: Response) {
    try {
      const { id, historyId } = req.params;
      const { descricao } = req.body;
      const currentUser = (req as any).user;

      const [atendRows]: any = await pool.query('SELECT status FROM atendimentos WHERE id = ?', [id]);
      if (!atendRows[0]) return res.status(404).json({ error: 'Atendimento não encontrado' });

      if (atendRows[0].status !== 'ABERTO') {
        return res.status(403).json({ error: 'Não é possível editar respostas de atendimentos encerrados ou cancelados' });
      }

      const [histRows]: any = await pool.query('SELECT atendente_id FROM historico_respostas WHERE id = ? AND atendimento_id = ?', [historyId, id]);
      if (!histRows[0]) return res.status(404).json({ error: 'Histórico não encontrado' });

      if (histRows[0].atendente_id !== currentUser.id && currentUser.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Você só pode editar as suas próprias respostas' });
      }

      await pool.query('UPDATE historico_respostas SET descricao = ? WHERE id = ?', [descricao, historyId]);

      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao atualizar histórico');
    }
  }

  static async deleteHistory(req: Request, res: Response) {
    try {
      const { id, historyId } = req.params;
      const currentUser = (req as any).user;

      const [atendRows]: any = await pool.query('SELECT status FROM atendimentos WHERE id = ?', [id]);
      if (!atendRows[0]) return res.status(404).json({ error: 'Atendimento não encontrado' });

      if (atendRows[0].status !== 'ABERTO') {
        return res.status(403).json({ error: 'Não é possível excluir respostas de atendimentos encerrados ou cancelados' });
      }

      const [histRows]: any = await pool.query('SELECT atendente_id FROM historico_respostas WHERE id = ? AND atendimento_id = ?', [historyId, id]);
      if (!histRows[0]) return res.status(404).json({ error: 'Histórico não encontrado' });

      if (histRows[0].atendente_id !== currentUser.id && currentUser.role !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Você só pode excluir as suas próprias respostas' });
      }

      await pool.query('DELETE FROM historico_respostas WHERE id = ?', [historyId]);

      res.json({ success: true });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir histórico');
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      // Estatísticas GERAIS (Total de todos os colaboradores)
      const [general]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
          COALESCE(SUM(status = 'ENCERRADO'), 0) as encerrado,
          COALESCE(SUM(status = 'CANCELADO'), 0) as cancelado,
          COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido ELSE NULL END), 0) as tempo_medio
        FROM atendimentos
      `);

      // Estatísticas GERAIS HOJE (Total de todos os colaboradores)
      const [globalToday]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
          COALESCE(SUM(status = 'ENCERRADO'), 0) as encerrado,
          COALESCE(SUM(status = 'CANCELADO'), 0) as cancelado,
          COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido ELSE NULL END), 0) as tempo_medio
        FROM atendimentos
        WHERE DATE(data_inicio) = CURDATE()
      `);

      // Estatísticas GERAIS MÊS (Total de todos os colaboradores)
      const [globalMonth]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
          COALESCE(SUM(status = 'ENCERRADO'), 0) as encerrado,
          COALESCE(SUM(status = 'CANCELADO'), 0) as cancelado,
          COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido ELSE NULL END), 0) as tempo_medio
        FROM atendimentos
        WHERE YEAR(data_inicio) = YEAR(CURDATE()) AND MONTH(data_inicio) = MONTH(CURDATE())
      `);
      
      // Estatísticas HOJE para o usuário logado
      const [today]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
          COALESCE(SUM(status = 'ENCERRADO'), 0) as encerrado,
          COALESCE(SUM(status = 'CANCELADO'), 0) as cancelado,
          COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido ELSE NULL END), 0) as tempo_medio
        FROM atendimentos
        WHERE atendente_id = ? AND DATE(data_inicio) = CURDATE()
      `, [userId]);

      // Estatísticas MÊS para o usuário logado
      const [month]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
          COALESCE(SUM(status = 'ENCERRADO'), 0) as encerrado,
          COALESCE(SUM(status = 'CANCELADO'), 0) as cancelado,
          COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido ELSE NULL END), 0) as tempo_medio
        FROM atendimentos
        WHERE atendente_id = ? 
          AND YEAR(data_inicio) = YEAR(CURDATE()) 
          AND MONTH(data_inicio) = MONTH(CURDATE())
      `, [userId]);


      // Tendências por hora (Hoje) - Usando UPPER para garantir match com o frontend
      const [hourlyTrends]: any = await pool.query(`
        SELECT 
            HOUR(a.data_inicio) as hour,
            UPPER(t.nome) as tipo_nome,
            COUNT(*) as count
        FROM atendimentos a
        JOIN atendimento_configs t ON t.id = a.tipo_id
        WHERE DATE(a.data_inicio) = CURDATE()
        GROUP BY hour, tipo_nome
        ORDER BY hour ASC
      `);

      // Performance da Equipe com detalhes de Hoje e Mês e Lista de Abertos
      const [users]: any = await pool.query('SELECT id, username FROM users');
      const teamStats = await Promise.all(users.map(async (u: any) => {
        // Estatísticas HOJE do colaborador (incluindo abertos)
        const [uToday]: any = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
            COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido END), 0) as tempo_medio
          FROM atendimentos 
          WHERE atendente_id = ? AND DATE(data_inicio) = CURDATE()
        `, [u.id]);

        // Estatísticas MÊS do colaborador (incluindo abertos)
        const [uMonth]: any = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COALESCE(SUM(status = 'ABERTO'), 0) as aberto,
            COALESCE(AVG(CASE WHEN status = 'ENCERRADO' THEN tempo_decorrido END), 0) as tempo_medio
          FROM atendimentos 
          WHERE atendente_id = ? AND YEAR(data_inicio) = YEAR(CURDATE()) AND MONTH(data_inicio) = MONTH(CURDATE())
        `, [u.id]);

        // Lista de tickets em aberto
        const [openTickets]: any = await pool.query(`
          SELECT a.id, c.name as cliente_nome 
          FROM atendimentos a
          JOIN clients c ON c.id = a.cliente_id
          WHERE a.atendente_id = ? AND a.status = 'ABERTO'
        `, [u.id]);

        return {
          id: u.id,
          username: u.username,
          today: {
            total: uToday[0]?.total || 0,
            aberto: uToday[0]?.aberto || 0, // Ensure 'aberto' is included
            tempo_medio: uToday[0]?.tempo_medio || 0
          },
          month: {
            total: uMonth[0]?.total || 0,
            aberto: uMonth[0]?.aberto || 0, // Ensure 'aberto' is included
            tempo_medio: uMonth[0]?.tempo_medio || 0
          },
          openTickets: openTickets || []
        };
      }));

      res.json({
        general: general[0] || {},
        globalToday: globalToday[0] || { total: 0, encerrado: 0, cancelado: 0, tempo_medio: 0 },
        globalMonth: globalMonth[0] || { total: 0, encerrado: 0, cancelado: 0, tempo_medio: 0 },
        today: today[0] || { total: 0, encerrado: 0, cancelado: 0, tempo_medio: 0 },
        month: month[0] || { total: 0, encerrado: 0, cancelado: 0, tempo_medio: 0 },
        hourlyTrends: hourlyTrends || [],
        teamStats: teamStats || []
      });
    } catch (error) {
      handleError(res, error, 'Erro ao obter estatísticas');
    }
  }
}
