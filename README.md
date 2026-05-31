# Sales Center

Extensao Chrome Manifest V3 que adiciona o atalho **Sales Center** na pagina Oracle Fusion HCM e abre um dashboard de oportunidades.

`https://eeho.fa.us2.oraclecloud.com/hcmUI/faces/FuseWelcome*`

## Estrutura

- `manifest.json`: configuracao da extensao, com escopo restrito ao endereco Oracle informado.
- `src/content.js`: entrada do content script; insere o atalho no DOM, abre o dashboard e envia mensagens para o service worker.
- `src/background.js`: bootstrap do service worker; carrega os modulos com `importScripts`, registra o message router e conecta repository, API client, cache e adapters.
- `src/dashboard.css`: estilos do dashboard no padrao Oracle Enterprise Workbench.
- `src/shared/`: constantes, contratos JSDoc, erros e utilitarios compartilhados.
- `src/infra/`: adapters finos para APIs do Chrome, como `chrome.runtime` e `chrome.storage`.
- `src/background/`: modulos do service worker:
  - `messageRouter.js`: roteia mensagens e padroniza respostas `{ ok, data, error, meta }`.
  - `salesCenterRepository.js`: combina API client, cache, deduplicacao e refresh forcado.
  - `smcApiClient.js`: concentra endpoints, payloads, paginacao e parsing das APIs SMC.
  - `cache/cacheManager.js`: cache com TTL, memoria, `chrome.storage.local`, pruning e invalidacao.
  - `cache/requestDeduplicator.js`: evita requests simultaneas duplicadas para a mesma chave.
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

Para checagem sintatica rapida:

```powershell
node --check src\background.js
node --check src\content.js
```
