import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BFF_BASE_URL || '/bff',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const cnpj = sessionStorage.getItem('@Mag:cnpj')?.replace(/\D/g, '');
  if (cnpj) {
    config.headers.cnpj = cnpj;
    config.headers['x-cnpj'] = cnpj;
  }
  const modality = sessionStorage.getItem('@Mag:modality');
  if (modality) config.headers.modality = modality;
  return config;
});

export default api;
