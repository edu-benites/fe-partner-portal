const tokenUrl = 'https://apis.magcap.com.br/connect/token';
const clientId = process.env.PRODUCTION_CLIENT_ID || 'usr_cap_api_prd';
const clientSecret = process.env.PRODUCTION_CLIENT_SECRET;

if (!clientSecret) {
  console.error('Defina PRODUCTION_CLIENT_SECRET antes de gerar o token.');
  process.exitCode = 1;
} else {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: 'cap.api', grant_type: 'client_credentials' }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`Falha ao gerar token (${response.status}).`);
    process.exitCode = 1;
  } else {
    console.log(data.access_token || 'Token não retornado pela API.');
  }
}
