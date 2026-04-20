import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
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
        await connection.query(`
      CREATE TABLE IF NOT EXISTS \`groups\` (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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
        // Add phone column if it doesn't exist (migration for existing tables)
        try {
            await connection.query(`ALTER TABLE clients ADD COLUMN phone VARCHAR(30) DEFAULT '' AFTER cnpj`);
        }
        catch {
            // Column already exists, ignore
        }
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
        await connection.query(`
      CREATE TABLE IF NOT EXISTS remote_connections (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        company_name      VARCHAR(255) NOT NULL,
        connection_string VARCHAR(255) NOT NULL,
        connection_type   VARCHAR(50) NOT NULL,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    }
    finally {
        connection.release();
    }
}
export default pool;
//# sourceMappingURL=connection.js.map