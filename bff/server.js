import { createServer } from 'node:http';
import { loadConfig } from './config/env.js';
import { createDatabase } from './infrastructure/database.js';
import { createMagApiClient } from './infrastructure/magApiClient.js';
import { createTokenClient } from './infrastructure/tokenClient.js';

const config = loadConfig();
const database = createDatabase(config);
const api = createMagApiClient(config, createTokenClient(config));

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': config.server.corsOrigin, 'Access-Control-Allow-Headers': 'Content-Type, cnpj, x-cnpj' });
  response.end(JSON.stringify(body));
}

function cnpjFrom(request, url) {
  const headerCnpj = Object.entries(request.headers).find(([name]) => ['cnpj', 'x-cnpj'].includes(name.toLowerCase()))?.[1];
  const rawCnpj = headerCnpj;
  const cnpj = Array.isArray(rawCnpj) ? rawCnpj[0]?.replace(/\D/g, '') : rawCnpj?.replace(/\D/g, '');
  if (!headerCnpj) throw Object.assign(new Error('Header cnpj não enviado.'), { statusCode: 400 });
  if (!cnpj || cnpj.length !== 14) throw Object.assign(new Error('CNPJ inválido: informe 14 dígitos sem máscara.'), { statusCode: 400 });
  return cnpj;
}

function requestHeaders(request) {
  return Object.fromEntries(Object.entries(request.headers).map(([name, value]) => [name.toLowerCase(), value]));
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': config.server.corsOrigin, 'Access-Control-Allow-Headers': 'Content-Type, cnpj, x-cnpj' });
    return response.end();
  }
  const url = new URL(request.url, `http://${request.headers.host}`);
  try {
    if (request.method === 'GET' && url.pathname === '/bff/health') return json(response, 200, { status: 'ok' });
    if (request.method !== 'GET') return json(response, 405, { message: 'Método não permitido.' });

    const cnpj = cnpjFrom({ headers: requestHeaders(request) }, url);
    let data;
    if (url.pathname === '/bff/partners') {
      data = await api.getPartners(cnpj);
      database.savePartner(cnpj, data);
    } else if (url.pathname.startsWith('/bff/lotteries/management/')) {
      const modality = decodeURIComponent(url.pathname.split('/').pop());
      if (!['traditional', 'incentive'].includes(modality)) return json(response, 400, { message: 'Modalidade inválida.' });
      data = await api.getLotteryManagement(modality, cnpj);
      database.saveLotteryManagement(cnpj, modality, data);
    } else if (url.pathname === '/bff/lotteries/results') {
      data = await api.getLotteryResults({ cnpj, ...Object.fromEntries(url.searchParams) });
    } else if (url.pathname.startsWith('/bff/lotteries/payment/')) {
      const modality = decodeURIComponent(url.pathname.split('/').pop());
      if (!['traditional', 'incentive'].includes(modality)) return json(response, 400, { message: 'Modalidade inválida.' });
      data = await api.getLotteryPayments({ modality, cnpj, ...Object.fromEntries(url.searchParams) });
    } else if (url.pathname === '/bff/billing/invoices') {
      data = await api.getInvoices({ cnpj, ...Object.fromEntries(url.searchParams) });
    } else return json(response, 404, { message: 'Rota não encontrada.' });
    return json(response, 200, data);
  } catch (error) {
    return json(response, error.statusCode || 500, { message: error.statusCode ? error.message : 'Erro interno do BFF.', upstream: error.upstreamBody });
  }
});

server.listen(config.server.port, config.server.host, () => console.log(`BFF disponível em http://${config.server.host}:${config.server.port}`));
process.on('SIGTERM', () => { database.close(); server.close(); });
