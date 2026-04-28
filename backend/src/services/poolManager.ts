import mysql from 'mysql2/promise';
import net from 'node:net';

interface PoolInfo {
  pool: mysql.Pool;
  lastUsed: number;
}

/**
 * Gerenciador de Pools para relatórios dinâmicos (PERF-001)
 * Centraliza conexões e evita criação excessiva de pools.
 */
class PoolManager {
  private pools: Map<string, PoolInfo> = new Map();
  private readonly MAX_IDLE_TIME = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Limpeza periódica de pools inativos
    setInterval(() => this.cleanup(), 60000);
  }

  async getPool(host: string, database: string): Promise<mysql.Pool> {
    // Sanitização básica de IP/Host (SEC-002)
    if (!host || (net.isIP(host) === 0 && !this.isValidHostname(host))) {
      throw new Error('Host inválido ou malformado');
    }

    const key = `${host}:${database}`;
    const existing = this.pools.get(key);

    if (existing) {
      existing.lastUsed = Date.now();
      return existing.pool;
    }

    const newPool = mysql.createPool({
      host,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database,
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 3,
      connectTimeout: 7000,
      queueLimit: 0,
    });

    this.pools.set(key, { pool: newPool, lastUsed: Date.now() });
    return newPool;
  }

  private isValidHostname(host: string): boolean {
    // Regex simples para hostname
    return /^[a-zA-Z0-9.-]+$/.test(host);
  }

  private async cleanup() {
    const now = Date.now();
    for (const [key, info] of this.pools.entries()) {
      if (now - info.lastUsed > this.MAX_IDLE_TIME) {
        console.log(`📡 Closing idle pool for ${key}`);
        await info.pool.end();
        this.pools.delete(key);
      }
    }
  }
}

export const poolManager = new PoolManager();
