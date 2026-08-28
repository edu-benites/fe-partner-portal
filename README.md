# fe-partner-portal
Aplicação voltada para o Portal do Parceiro.

## Arquitetura

1. O parceiro informa o CNPJ na tela de acesso.
2. O frontend consulta somente o BFF em `/bff/partners`.
3. O parceiro escolhe o perfil `Incentivo` ou `Tradicional`.
4. O portal exibe o menu de Início, Arquivo, Faturamento, Sorteio e Resgate.

O BFF é executado no mesmo projeto e é o único componente que conhece os hosts, o client secret e o banco. Ele encaminha as chamadas para as APIs MAG, obtém o token OAuth2 no servidor e registra as respostas de parceiro e dashboard no SQLite local. O navegador nunca recebe `MAG_API_CLIENT_SECRET` nem um token Sensedia. A tela de Sorteios usa `/bff/lotteries/payment/{modality}` para consultar pagamentos com filtros e paginação server-side.

## Configuração

Copie `.env.example` para `.env` e ajuste o ambiente quando necessário:

- `VITE_BFF_BASE_URL`: prefixo consumido pelo frontend; mantenha `/bff`.
- `MAG_API_HOST`: host upstream da MAG. Use `.env.hmg.example` ou `.env.prod.example` como referência.
- `MAG_API_TOKEN_URL`: endpoint OAuth2; por padrão é `${MAG_API_HOST}/connect/token`.
- `MAG_API_CLIENT_ID` e `MAG_API_CLIENT_SECRET`: credenciais somente do BFF, preferencialmente injetadas por secret manager. Como alternativa temporária, `MAG_API_ACCESS_TOKEN` aceita um token já emitido, também exclusivamente no servidor.
- `BFF_HOST`, `BFF_PORT`, `BFF_CORS_ORIGIN` e `BFF_DATABASE_PATH`: host, porta, origem permitida e caminho do banco.

O portal mantém sempre a identidade visual padrão da MAG Capitalização, independentemente do parceiro consultado.

O dashboard é salvo localmente por parceiro/modalidade e reutilizado por 30 minutos antes de uma nova consulta à API. Esse TTL está centralizado em `src/pages/Home.jsx` (`DASHBOARD_CACHE_TTL_MS`) para facilitar uma alteração futura.

### Execução local

Copie o exemplo do ambiente para `.env`, preencha `MAG_API_CLIENT_SECRET` ou `MAG_API_ACCESS_TOKEN` e execute:

```bash
npm install
npm run dev:all
```

O comando inicia o BFF e o Vite juntos. O proxy do Vite encaminha `/bff` para `http://127.0.0.1:3001`. Em produção, publique o frontend e o BFF atrás do mesmo domínio ou configure `BFF_CORS_ORIGIN` explicitamente.

O endpoint `GET /bff/health` pode ser usado no health check do serviço.

Nunca coloque tokens ou `client_secret` em variáveis `VITE_*`, no código, no navegador ou no bundle. O script legado `npm run token:production` continua disponível para operações manuais, mas o fluxo recomendado é o token ser obtido pelo próprio BFF.

Para validar o build:

```bash
npm run build
```
