import { Router } from 'express';
import pool from '../database/connection.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { AuthController } from '../controllers/AuthController.js';
import { ClientController } from '../controllers/ClientController.js';
import { GroupController } from '../controllers/GroupController.js';
import { RemoteController } from '../controllers/RemoteController.js';
import { ReportController } from '../controllers/ReportController.js';
import { ExcelController } from '../controllers/ExcelController.js';
import { DownloadController } from '../controllers/DownloadController.js';
import { AtendimentoController } from '../controllers/AtendimentoController.js';
import { AtendimentoConfigController } from '../controllers/AtendimentoConfigController.js';
import { UserController } from '../controllers/UserController.js';
import { fetchCNPJ } from '../services/cnpjService.js';
import { handleError } from '../utils/errorHandler.js';

const router = Router();

// --- Auth (Public) ---
router.post('/auth/login', AuthController.login);

// --- Protected Routes ---
router.use(authMiddleware);

router.get('/auth/me', AuthController.me);

// Users
router.get('/users', UserController.getAll);
router.post('/users', UserController.create);
router.put('/users/:id', UserController.update);
router.delete('/users/:id', UserController.delete);

// Downloads
router.get('/downloads', DownloadController.list);

// Groups
router.get('/groups', GroupController.getAll);
router.post('/groups', GroupController.create);
router.delete('/groups/:id', GroupController.delete);
router.post('/groups/:id/test', GroupController.testGroup);

// Clients
router.get('/clients', ClientController.getAll);
router.post('/clients', ClientController.create);
router.put('/clients/:id', ClientController.update);
router.delete('/clients/:id', ClientController.delete);
router.post('/clients/test-all', ClientController.testAll);
router.post('/clients/:id/test', ClientController.testSingle);

// Remote Companies
router.get('/remote-companies', RemoteController.getAllCompanies);
router.post('/remote-companies', RemoteController.createCompany);
router.put('/remote-companies/:id', RemoteController.updateCompany);
router.delete('/remote-companies/:id', RemoteController.deleteCompany);

// Remote Connections
router.get('/remote-connections', RemoteController.getConnections);
router.post('/remote-connections', RemoteController.createConnection);
router.put('/remote-connections/:id', RemoteController.updateConnection);
router.delete('/remote-connections/:id', RemoteController.deleteConnection);

// Atendimento Configs
router.get('/atendimento-configs/:tipo', AtendimentoConfigController.getAllByType);
router.post('/atendimento-configs', AtendimentoConfigController.create);
router.put('/atendimento-configs/:id', AtendimentoConfigController.update);
router.delete('/atendimento-configs/:id', AtendimentoConfigController.delete);

// Atendimentos
router.get('/atendimentos', AtendimentoController.getAll);
router.get('/atendimentos/stats', AtendimentoController.getStats);
router.get('/atendimentos/:id', AtendimentoController.getById);
router.post('/atendimentos', AtendimentoController.create);
router.put('/atendimentos/:id', AtendimentoController.update);
router.post('/atendimentos/:id/encerrar', AtendimentoController.end);
router.post('/atendimentos/:id/cancelar', AtendimentoController.cancel);
router.get('/atendimentos/:id/historico', AtendimentoController.getHistory);
router.post('/atendimentos/:id/historico', AtendimentoController.addHistory);

// Stats & Logs (Basic implementation for UI compatibility)
router.get('/stats', async (req, res) => {
  try {
    const [clients]: any = await pool.query('SELECT COUNT(*) as total, SUM(status="OK") as ok, SUM(status="ERROR") as error FROM clients');
    const [logs]: any = await pool.query('SELECT COUNT(*) as total FROM test_logs');
    res.json({ ...clients[0], totalLogs: logs[0].total });
  } catch (error) {
    handleError(res, error, 'Erro ao carregar estatísticas');
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { limit = 50, client_id } = req.query;
    let query = 'SELECT * FROM test_logs';
    const params: any[] = [];
    if (client_id) {
      query += ' WHERE client_id = ?';
      params.push(client_id);
    }
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(Number(limit));
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    handleError(res, error, 'Erro ao carregar logs');
  }
});

// Reports
router.get('/reports/atendimentos', ReportController.getAtendimentoReport);
router.get('/reports/atendimentos/export', ReportController.exportAtendimentoReport);
router.get('/reports/client-ip', ReportController.getClientIp);
router.post('/reports/padaria/st', ReportController.getPadariaReport);
router.post('/reports/padaria/monofasico', ReportController.getPadariaReport);
router.post('/reports/frigo', ReportController.getFrigoReport);

// Excel
router.post('/excel/process', ExcelController.process);
router.get('/excel/template', ExcelController.getTemplate);

// CNPJ Helper
router.get('/cnpj/:cnpj', async (req, res) => {
  try {
    const data = await fetchCNPJ(req.params.cnpj as string);
    res.json({
      razao_social: data.razao_social || data.nome_fantasia || 'Empresa não identificada',
      nome_fantasia: data.nome_fantasia || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      bairro: data.bairro || '',
    });
  } catch (error) {
    handleError(res, error, 'Erro ao consultar CNPJ');
  }
});

export default router;
