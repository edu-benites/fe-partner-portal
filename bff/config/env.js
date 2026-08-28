import { existsSync, readFileSync } from 'node:fs';

const productionApiHost = 'https://apis.magcap.com.br';

function loadDotEnv() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function url(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  try {
    return new URL(value).toString().replace(/\/$/, '');
  } catch {
    throw new Error(`A variável ${name} deve ser uma URL válida.`);
  }
}

export function loadConfig() {
  loadDotEnv();
  const apiHost = url('MAG_API_HOST', productionApiHost);
  const accessToken = process.env.MAG_API_ACCESS_TOKEN?.trim();
  const clientId = accessToken ? process.env.MAG_API_CLIENT_ID?.trim() || '' : required('MAG_API_CLIENT_ID');
  const clientSecret = process.env.MAG_API_CLIENT_SECRET?.trim();
  if (!accessToken && !clientSecret) throw new Error('Defina MAG_API_CLIENT_SECRET ou MAG_API_ACCESS_TOKEN no ambiente do BFF.');

  return Object.freeze({
    server: {
      host: process.env.BFF_HOST?.trim() || '127.0.0.1',
      port: Number(process.env.BFF_PORT || 3001),
      corsOrigin: process.env.BFF_CORS_ORIGIN?.trim() || 'http://localhost:5173',
    },
    api: {
      host: apiHost,
      tokenUrl: url('MAG_API_TOKEN_URL', `${apiHost}/connect/token`),
      clientId,
      clientSecret,
      accessToken,
      scope: process.env.MAG_API_SCOPE?.trim() || 'cap.api',
      timeoutMs: Number(process.env.MAG_API_TIMEOUT_MS || 30000),
    },
    database: {
      path: process.env.BFF_DATABASE_PATH?.trim() || './data/partner-portal.sqlite',
    },
  });
}
