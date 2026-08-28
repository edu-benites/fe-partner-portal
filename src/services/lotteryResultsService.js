import api from './api.js';

export async function getLotteryResults({ startDate, endDate, winningNumber, limit, offset, code = '' }) {
  const cnpj = sessionStorage.getItem('@Mag:cnpj')?.replace(/\D/g, '') || '';
  const response = await api.get('/lotteries/results', {
    params: { startDate, endDate, winningNumber: winningNumber || undefined, limit, offset, code },
    headers: { cnpj, 'x-cnpj': cnpj },
  });
  return response.data;
}
