import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function createDatabase(config) {
  mkdirSync(dirname(config.database.path), { recursive: true });
  const database = new DatabaseSync(config.database.path);
  database.exec(`
    CREATE TABLE IF NOT EXISTS partner_queries (
      cnpj TEXT PRIMARY KEY, response_json TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lottery_management_queries (
      cnpj TEXT NOT NULL, modality TEXT NOT NULL, response_json TEXT NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY (cnpj, modality)
    );
  `);

  return {
    savePartner(cnpj, response) {
      database.prepare('INSERT OR REPLACE INTO partner_queries VALUES (?, ?, ?)').run(cnpj, JSON.stringify(response), new Date().toISOString());
    },
    saveLotteryManagement(cnpj, modality, response) {
      database.prepare('INSERT OR REPLACE INTO lottery_management_queries VALUES (?, ?, ?, ?)').run(cnpj, modality, JSON.stringify(response), new Date().toISOString());
    },
    close() { database.close(); },
  };
}
