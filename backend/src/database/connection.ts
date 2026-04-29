import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'tools_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initializeSchema() {
  const connection = await pool.getConnection();
  try {
    // 0. Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        username   VARCHAR(255) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        role       ENUM('ADMINISTRADOR', 'COLABORADOR') DEFAULT 'COLABORADOR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1. Groups
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Clients
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        name              VARCHAR(255) NOT NULL,
        cnpj              VARCHAR(20)  DEFAULT '',
        phone             VARCHAR(30)  DEFAULT '',
        host              VARCHAR(255) NOT NULL,
        ports             TEXT NOT NULL,
        group_id          INT,
        ip_interno        VARCHAR(50)  DEFAULT '',
        provedor_internet VARCHAR(255) DEFAULT '',
        status            VARCHAR(20)  DEFAULT 'PENDING',
        last_test         TIMESTAMP NULL,
        avg_response_ms   DOUBLE DEFAULT NULL,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES \`groups\`(id) ON DELETE SET NULL
      )
    `);

    // 3. Test Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS test_logs (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        client_id   INT NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status      VARCHAR(20) NOT NULL,
        duration_ms DOUBLE DEFAULT 0,
        details     TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    // 4. Port Results
    await connection.query(`
      CREATE TABLE IF NOT EXISTS port_results (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        log_id      INT NOT NULL,
        port        INT NOT NULL,
        is_open     TINYINT(1) DEFAULT 0,
        response_ms DOUBLE DEFAULT NULL,
        error       VARCHAR(255),
        FOREIGN KEY (log_id) REFERENCES test_logs(id) ON DELETE CASCADE
      )
    `);

    // 5. Remote Companies
    await connection.query(`
      CREATE TABLE IF NOT EXISTS remote_companies (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        name              VARCHAR(255) NOT NULL UNIQUE,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 6. Remote Connections
    await connection.query(`
      CREATE TABLE IF NOT EXISTS remote_connections (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        company_id        INT,
        company_name      VARCHAR(255) NOT NULL,
        connection_string VARCHAR(255) NOT NULL,
        connection_type   VARCHAR(50) NOT NULL,
        connection_software VARCHAR(100) NOT NULL,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_conn_str (connection_string),
        FOREIGN KEY (company_id) REFERENCES remote_companies(id) ON DELETE CASCADE
      )
    `);

    // 7. Atendimento Configs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS atendimento_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        tipo ENUM('origem', 'tipo', 'categoria', 'aplicacao', 'modulo') NOT NULL,
        UNIQUE(nome, tipo)
      )
    `);

    // 8. Atendimentos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS atendimentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente_id INT NOT NULL,
        atendente_id INT NOT NULL,
        data_inicio DATETIME NOT NULL,
        data_fim DATETIME,
        origem_id INT NOT NULL,
        tipo_id INT NOT NULL,
        categoria_id INT,
        aplicacao_id INT,
        modulo_id INT,
        problema_inicial TEXT NOT NULL,
        status ENUM('ABERTO', 'ENCERRADO', 'CANCELADO') NOT NULL DEFAULT 'ABERTO',
        tempo_decorrido INT, -- em minutos
        FOREIGN KEY (cliente_id) REFERENCES clients(id),
        FOREIGN KEY (atendente_id) REFERENCES users(id),
        FOREIGN KEY (origem_id) REFERENCES atendimento_configs(id),
        FOREIGN KEY (tipo_id) REFERENCES atendimento_configs(id),
        FOREIGN KEY (categoria_id) REFERENCES atendimento_configs(id),
        FOREIGN KEY (aplicacao_id) REFERENCES atendimento_configs(id),
        FOREIGN KEY (modulo_id) REFERENCES atendimento_configs(id)
      )
    `);

    // 9. Histórico de Respostas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS historico_respostas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        atendimento_id INT NOT NULL,
        atendente_id INT NOT NULL,
        data_registro DATETIME NOT NULL,
        descricao TEXT NOT NULL,
        FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id),
        FOREIGN KEY (atendente_id) REFERENCES users(id)
      )
    `);

  } finally {
    connection.release();
  }
}

export default pool;
