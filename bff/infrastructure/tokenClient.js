export function createTokenClient(config) {
  let accessToken;
  let expiresAt = 0;

  return async function getAccessToken() {
    if (config.api.accessToken) return config.api.accessToken;
    if (accessToken && Date.now() < expiresAt) return accessToken;

    const response = await fetch(config.api.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.api.clientId,
        client_secret: config.api.clientSecret,
        scope: config.api.scope,
        grant_type: 'client_credentials',
      }),
      signal: AbortSignal.timeout(config.api.timeoutMs),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(`Falha na autenticação da API upstream (${response.status}).`);

    accessToken = data.access_token;
    expiresAt = Date.now() + Math.max(30, Number(data.expires_in || 300) - 30) * 1000;
    return accessToken;
  };
}
