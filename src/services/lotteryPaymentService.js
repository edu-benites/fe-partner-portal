import api from './api.js';

export async function getLotteryPayments({ modality, statusBeneficiaries, offset, limit, startDate, endDate, contractKey, payValue, offerId, minValue, maxValue, consultaBeneficiario, numberProposal }) {
  const cnpj = sessionStorage.getItem('@Mag:cnpj')?.replace(/\D/g, '') || '';
  const response = await api.get(`/lotteries/payment/${encodeURIComponent(modality)}`, {
    params: {
      offset: offset + 1,
      limit,
      startDate: startDate || '--',
      endDate: endDate || '--',
      orderField: 'orderField',
      statusBeneficiaries,
      contractKey,
      payValue,
      offerId,
      minValue,
      maxValue,
      consultaBeneficiario,
      numberProposal,
    },
    headers: { cnpj, 'x-cnpj': cnpj },
  });
  return response.data;
}
