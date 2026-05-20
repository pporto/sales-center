# Sales Center

Extensao Chrome Manifest V3 que adiciona o atalho **Sales Center** na pagina Oracle Fusion HCM e abre um dashboard de oportunidades.

`https://eeho.fa.us2.oraclecloud.com/hcmUI/faces/FuseWelcome*`

## Estrutura

- `manifest.json`: configuracao da extensao, com escopo restrito ao endereco Oracle informado.
- `src/content.js`: content script responsavel por inserir o atalho no DOM e abrir o dashboard.
- `src/background.js`: service worker que executa as requests no iframe oculto da pagina `SalesCloudSMC-GEC`, usando a sessao existente do navegador.
- `src/dashboard.css`: estilos do dashboard no padrao Oracle Enterprise Workbench.
- `assets/icons/`: icones locais da extensao.

## Como carregar no Chrome

1. Abra `chrome://extensions`.
2. Ative **Developer mode**.
3. Clique em **Load unpacked**.
4. Selecione esta pasta: `C:\Codex\Projects\sales-center`.

## Comportamento

Quando a pagina Oracle renderiza a div `#yourapps_groupNode_sales`, a extensao insere o card **Sales Center** antes da celula com a classe `flat-grid-cell flat-grid-cell-addicon`.

O clique no card abre um dashboard fullscreen com o combo **Periodo**. Nesta versao, **Current Quarter** busca token, forecast ativo e oportunidades; as demais opcoes ficam preparadas para proximas etapas.

O content script usa `MutationObserver` para lidar com renderizacoes tardias e evita criar duplicatas do card. O service worker usa um iframe oculto da propria pagina Oracle `SalesCloudSMC-GEC` para aproveitar cookies, sessao e contexto disponiveis no navegador; ele nao salva cookies ou tokens em storage. O painel **Request inspector** mostra URL, metodo, headers sanitizados, payload e amostra do response de cada request executada.
