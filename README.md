# Sales Center

Extensao Chrome Manifest V3 que adiciona o atalho **Sales Center** na pagina Oracle Fusion HCM e abre um dashboard de oportunidades.

`https://eeho.fa.us2.oraclecloud.com/hcmUI/faces/FuseWelcome*`

## Estrutura

- `manifest.json`: configuracao da extensao, com escopo restrito ao endereco Oracle informado.
- `src/content.js`: bootstrap minimo do content script; inicia o observer da pagina.
- `src/background.js`: bootstrap do service worker; carrega os modulos com `importScripts`, registra o message router e conecta repository, API client, cache e adapters.
- `src/dashboard.css`: estilos do dashboard no padrao Oracle Enterprise Workbench.
- `src/shared/`: constantes, contratos JSDoc, erros e utilitarios compartilhados.
- `src/infra/`: adapters finos para APIs do Chrome, como `chrome.runtime` e `chrome.storage`.
- `src/background/`: modulos do service worker:
  - `messageRouter.js`: roteia mensagens e padroniza respostas `{ ok, data, error, meta }`.
  - `salesCenterRepository.js`: combina API client, cache, deduplicacao e refresh forcado.
  - `smcApiClient.js`: concentra endpoints, payloads, paginacao e parsing das APIs SMC.
  - `smcHttpTransport.js`: executa requests no frame SalesCloud, em aba temporaria ou no contexto da extensao.
  - `salesCloudSession.js`: localiza, aquece e recupera contexto de sessao SalesCloud.
  - `requestRecorder.js`: registra progresso e dados sanitizados para o Request inspector.
  - `httpUtils.js`: utilitarios de retry, parsing JSON e deteccao de erro de sessao.
  - `cache/cacheManager.js`: cache com TTL, memoria, `chrome.storage.local`, pruning e invalidacao.
  - `cache/requestDeduplicator.js`: evita requests simultaneas duplicadas para a mesma chave.
- `src/content/`: modulos do dashboard e da integracao com a pagina Oracle:
  - `config.js`: constantes, estado compartilhado do dashboard e labels.
  - `dom.js`: helpers de criacao/consulta de elementos.
  - `preferences.js`: preferencias locais de tema, filtros e colunas.
  - `bootstrap.js`: criacao do card Sales Center e inicializacao do dashboard.
  - `shell.js`: estrutura visual, header, botoes, paineis e estados de loading/erro.
  - `filters.js`: filtros de periodo, territorio, vendedor, status, tipo e colunas.
  - `dataController.js`: carregamento de dados, aplicacao de filtros e refresh.
  - `tableRenderer.js`: renderizacao da tabela, ordenacao e detalhes.
  - `runtimeAndFormatters.js`: mensagens para o background, formatadores e helpers de exibicao.
  - `observer.js`: `MutationObserver` que injeta o card quando a home Oracle termina de renderizar.
- `tests/`: testes basicos dos modulos de cache, deduplicacao, API client e repository.
- `assets/icons/`: icones locais da extensao.

## Como carregar no Chrome

1. Abra `chrome://extensions`.
2. Ative **Developer mode**.
3. Clique em **Load unpacked**.
4. Selecione esta pasta: `C:\Codex\Projects\sales-center`.

## Comportamento

Quando a pagina Oracle renderiza a div `#yourapps_groupNode_sales`, a extensao insere o card **Sales Center** antes da celula com a classe `flat-grid-cell flat-grid-cell-addicon`.

O clique no card abre um dashboard fullscreen com filtros de periodo, territorio, tipo, vendedor, status e colunas. As requisicoes sao enviadas ao service worker pela mensagem `salesCenter.fetchDashboard`, com `salesCenter.fetchCurrentQuarter` mantido como alias temporario de compatibilidade.

O content script usa `MutationObserver` para lidar com renderizacoes tardias e evita criar duplicatas do card. O service worker usa um iframe oculto da propria pagina Oracle `SalesCloudSMC-GEC`, abas SalesCloud ja abertas ou uma aba temporaria inativa para aproveitar cookies, sessao e contexto disponiveis no navegador; ele nao salva cookies ou tokens em storage. O painel **Request inspector** mostra URL, metodo, headers sanitizados, payload e amostra do response de cada request executada.

## Cache e refresh

O resultado consolidado do dashboard e cacheado por 9 horas em memoria e em `chrome.storage.local`. A chave considera versao da API, periodo e territorios selecionados. Enquanto o cache esta valido, a extensao evita refazer chamadas HTTP.

O botao **Refresh** envia `forceRefresh=true`, invalida todos os caches do namespace da extensao e refaz as requisicoes. O novo resultado volta a ser cacheado. Requests simultaneas com a mesma chave sao deduplicadas pelo service worker.

## Testes

Os testes usam Node e `assert` nativo:

```powershell
node tests\cacheManager.test.js
node tests\requestDeduplicator.test.js
node tests\smcApiClient.test.js
node tests\salesCenterRepository.test.js
```

Para checagem sintatica rapida dos bootstraps:

```powershell
node --check src\background.js
node --check src\content.js
```

Ao alterar modulos extraidos, rode tambem `node --check` no arquivo modificado.
