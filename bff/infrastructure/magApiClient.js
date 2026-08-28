export function createMagApiClient(config, getAccessToken) {
  async function request(path, { method = 'GET', query = {}, headers = {} } = {}) {
    const url = new URL(`${config.api.host}${path}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') url.searchParams.set(key, value);
    });
    const response = await fetch(url, {
      method,
      headers: { Accept: 'application/json', Authorization: `Bearer ${await getAccessToken()}`, ...headers },
      signal: AbortSignal.timeout(config.api.timeoutMs),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(`API upstream respondeu ${response.status}.`);
      error.statusCode = response.status >= 500 ? 502 : response.status;
      error.upstreamBody = data;
      throw error;
    }
    return data;
  }

  return {
    getPartners: (cnpj) => request('/api/sales-cap/v1/partners', { query: { modality: 'incentive' }, headers: { cnpj } }),
    getLotteryManagement: (modality, cnpj) => request(`/api/lotteries-cap/v1/lotteries/management/${encodeURIComponent(modality)}`, { headers: { cnpj, modality } }),
    getLotteryResults: ({ cnpj, startDate, endDate, winningNumber, limit, offset, code }) => request('/api/benefit-cap/v1/lotteries/all', { query: { startDate, endDate, winningNumber, limit, offset, code }, headers: { cnpj } }),
    getLotteryPayments: ({ modality, cnpj, ...filters }) => request(`/api/lotteries-cap/v1/lotteries/payment/${encodeURIComponent(modality)}`, { query: filters, headers: { cnpj, modality } }),
    getInvoices: ({ cnpj, ...filters }) => request('/api/billing-cap/v1/invoices', { query: filters, headers: { cnpj } }),
  };
}
