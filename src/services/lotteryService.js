import api from './api.js';

export async function getLotteryManagement(modality, cnpj) {
  const normalizedCnpj = cnpj.replace(/\D/g, '');
  const response = await api.get(`/lotteries/management/${encodeURIComponent(modality)}`, {
    headers: { cnpj: normalizedCnpj, 'x-cnpj': normalizedCnpj },
  });
  return response.data;
}
