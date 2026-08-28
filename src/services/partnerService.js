import api from './api.js';

export async function getPartners(cnpj) {
  const normalizedCnpj = cnpj.replace(/\D/g, '');
  const response = await api.get('/partners', { headers: { cnpj: normalizedCnpj, 'x-cnpj': normalizedCnpj } });
  return response.data;
}
