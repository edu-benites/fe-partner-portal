import api from './api.js';

export async function getInvoices({ offset, limit, status, startDate, endDate, orderField, desc }) {
  const partner = JSON.parse(sessionStorage.getItem('@Mag:partnerData') || '{}');
  const selfPolicyHolderDocumentId = partner.selfPolicyHolderDocumentId || partner.documentId || partner.document || partner.cnpj || sessionStorage.getItem('@Mag:cnpj') || '';
  const typePerson = partner.typePerson || partner.personType || 'J';
  const response = await api.get('/billing/invoices', {
    params: { offset: offset + 1, limit, status, startDate, endDate, orderField, desc, selfPolicyHolderDocumentId, typePerson },
    headers: { cnpj: sessionStorage.getItem('@Mag:cnpj')?.replace(/\D/g, '') || '' },
  });
  return response.data;
}
