# Diário do Vale

Site estático para explorar a coleção de pesca e as doações ao Museu de Stardew Valley e importar o progresso de um save XML 1.6.x diretamente no navegador.

## Estrutura

Interface em React + TypeScript, compilada com Vite para arquivos estáticos.

- `index.html`, `catalogo.html`, `museu.html` — entradas do build; a raiz e `catalogo.html` abrem Peixes, `museu.html` abre o Museu. A navegação entre elas acontece sem recarregar a página (React Router, prefixo `/stardew-diary/`).
- `src/` — aplicação React: `App.tsx` (lateral, menu móvel, rotas), `state/` (provedor de progresso, importação, tema e filtros), `components/` (lateral, diálogo de importação, progresso, filtros, grupos e cartões) e `pages/` (apresentações de Peixes e Museu).
- `scripts/` — modelos de domínio em JavaScript reutilizados pela interface: dados das coleções, progresso, leitura de saves e exportação. `scripts/theme-init.js` aplica tema e lateral antes da renderização.
- `styles/main.css` — apresentação e layout responsivo.
- `tests/` — testes de domínio (`tests/*.test.mjs`), do build (`tests/build/`) e de navegador com Playwright (`tests/e2e/`).
- `.github/workflows/deploy.yml` — testes, build e publicação no GitHub Pages.

## Executar localmente

Requer Node 24 e npm.

```sh
npm ci
npm run dev
```

Abra `http://localhost:5173/stardew-diary/`. Para conferir o build como será publicado, use `npm run build` e `npm run preview` (`http://localhost:4173/stardew-diary/`).

Verificações:

- `npm run test:unit` — testes de domínio e de filtros.
- `npm run typecheck` — TypeScript estrito.
- `npm run build` e `npm run test:build` — gera `dist/` e confere entradas, recursos e caminhos.
- `npm run test:e2e` — Playwright contra a prévia do build. Localmente usa o Google Chrome instalado; em outro ambiente, execute `npx playwright install chromium` antes.
- `npm test` — todas as etapas acima em sequência.

## Publicar no GitHub Pages

O workflow **Test and deploy** roda em cada pull request e em cada push para `main`. Em `main`, depois de todas as verificações passarem, publica `dist/` no GitHub Pages. A fonte de publicação deve ser **Settings → Pages → Build and deployment → Source → GitHub Actions**.

Para atualizar o site, integre as alterações em `main` e acompanhe a execução em **Actions**. O endereço é [https://jvopereira.github.io/stardew-diary/](https://jvopereira.github.io/stardew-diary/). Os endereços antigos `catalogo.html` e `museu.html` continuam válidos. `.nojekyll`, sprites, documentação e `theme-init.js` são copiados para o build.

## Catálogo de pesca

O modelo da aba Peixes e seus limites estão documentados em [docs/fishing-catalog.md](docs/fishing-catalog.md). Há campos de condições de captura pendentes de verificação; o catálogo ainda não é um guia completo.

O registro de coleções em `scripts/data/collections.js` contém apenas categorias implementadas e alimenta a navegação. Para acrescentar outra coleção, veja [docs/adding-collections.md](docs/adding-collections.md); a lógica de pesca permanece isolada.

## Artigos do Museu

Abra `museu.html` ou use a navegação de coleções. Acompanhe 95 doações ao Gunther (42 artefatos e 53 minerais), busque nomes e filtre por tipo ou doação. Os cartões mostram exemplos de como obter cada item e links para a Wiki. A importação única na navegação lateral atualiza pesca e Museu. Ela lê as doações do Museu compartilhado da fazenda; encontrar um item não conta como doá-lo. Progresso manual, base importada e exportação JSON são separados da pesca. Veja [docs/museum-catalog.md](docs/museum-catalog.md).

## Tema

O botão de sol/lua em pixel art na lateral alterna entre claro e escuro. O tema escuro OLED Maré usa fundo preto puro, superfícies quase pretas e destaques azuis. Sem escolha salva, o site segue a preferência de cores do sistema. A escolha é guardada apenas como `light` ou `dark` em `localStorage` neste navegador; se o armazenamento estiver indisponível, a alternância ainda funciona até recarregar a página.

## Catálogo

Abra a raiz do site ou `catalogo.html` para pesquisar os 72 itens e filtrar por estação, método ou status. O status vem de uma base importada e de ajustes manuais separados. O navegador guarda apenas os IDs de catálogo necessários para recuperar esses estados. **Desfazer alterações manuais** volta à base importada; **Restaurar progresso inicial** remove também essa base; **Importar outro save** só troca a base após uma nova validação bem-sucedida. **Excluir dados locais do site** apaga o progresso de todas as coleções, a preferência de tema e os filtros salvos deste navegador, sem alterar arquivos do jogo. O progresso fica neste navegador e não é sincronizado entre dispositivos. Busca e filtros de cada coleção são lembrados entre visitas (`diario-do-vale-filters-v1`); valores salvos inválidos voltam ao padrão. Marcar um item mantém o foco no botão; se o cartão sair dos filtros, o foco vai para o filtro de coleção. Entradas com estação ainda não verificada ficam no grupo “Estação a verificar”; condições parciais são identificadas no cartão.

**Exportar progresso em JSON** baixa os IDs atualmente registrados, incluindo ajustes manuais, com `formatVersion: 1` e `collectionId: "fishing"`. O arquivo serve como backup ou referência para transferência manual; o site ainda não importa esse JSON. Nenhum dado do save entra no arquivo exportado.

## Importação de saves

Na navegação lateral, clique em **Importar save**, selecione o XML principal de uma partida 1.6.x e clique em **Atualizar todas as coleções**. Basta importar uma vez: pesca e Museu persistem neste navegador ao trocar de página ou recarregar. Para atualizar o progresso depois de jogar, use **Atualizar save**. O novo arquivo validado substitui a base e os ajustes manuais das duas coleções. Consulte [docs/save-import.md](docs/save-import.md) para formatos, plataformas, limite de 10 MiB e privacidade. A leitura é local; o arquivo, seu XML e seus dados pessoais não são armazenados.

Os resultados da revisão dos requisitos, os cenários testados e os limites da evidência estão em [docs/verification.md](docs/verification.md).

## Navegação

A lateral começa recolhida no desktop, com ícones das coleções, save e tema. O botão de seta expande ou recolhe os rótulos; a preferência é mantida durante a sessão ao trocar de página. Os ícones têm nomes acessíveis e dicas de ação. Em telas pequenas, **Menu** abre a lateral completa; Escape ou o botão de fechar a recolhem. A importação abre uma janela com foco contido e pode ser cancelada sem substituir o progresso anterior.

## Imagens dos itens

Os 167 itens de pesca e Museu usam PNGs locais em `assets/items/`, com fontes registradas em `sources.json`. Isso permite carregar os cartões mesmo quando a Wiki estiver indisponível. Para baixar imagens novas ou completar arquivos ausentes, execute `node scripts/download-item-images.mjs`. O script preserva imagens já válidas. `node scripts/download-item-images.mjs --check` confere os arquivos sem rede ou alterações. Veja [assets/items/README.md](assets/items/README.md).
