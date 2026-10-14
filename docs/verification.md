# Verificação dos requisitos

Revisão em 2026-10-09. Execução local com servidor HTTP estático e navegador integrado; arquivos de save de teste foram **sintéticos**. Os comandos automatizados estão em `tests/save-import.test.mjs` (`node --test tests/save-import.test.mjs`). Esta revisão não equivale a validar um save real de cada plataforma.

## Requisitos funcionais

| Requisito | Resultado e evidência |
| --- | --- |
| FR-01 Coleção e status | 72 IDs únicos; cartões mostram registrado/faltando. Escopo, exclusões e diferença para Mestre Pescador em `docs/fishing-catalog.md`. |
| FR-02 Estações | Grupos e filtro para quatro estações, ano todo e estação a verificar; combinação de filtros testada. |
| FR-03 Condições | Cartões mostram local, horário, clima, método e requisitos; campos desconhecidos mostram “A verificar”. |
| FR-04 Busca e filtros | Teste automatizado de busca + estação + método + status; filtro exercitado no navegador a 320 px. |
| FR-05 Importação | XML sintético 1.6.15 importado no navegador; 1 ID reconhecido elevou a contagem para 1/72. |
| FR-06 Compatibilidade | Versão/estrutura verificadas antes da substituição; formatos e origens documentados em `docs/save-import.md`. Plataformas não foram verificadas com arquivos reais. |
| FR-07 Arquivo inválido | Testes de versão antiga, XML malformado, dados ausentes, contagem inválida, arquivo vazio, grande, compactado e `DOCTYPE`; no navegador, versão antiga e XML malformado mantiveram 1/72. |
| FR-08 Cálculo | Contagem, faltantes e porcentagem arredondada atualizam após importação e marcação manual; observado 1/72 = 1% e 2/72 = 3%. |
| FR-09 Base e ajustes | Testes de sobreposição, desfazer e restaurar; recarga manteve base e ajuste separados; novo save válido substitui a base. |
| FR-10 Wiki PT | Cada cartão contém link HTTPS para a wiki em português; destinos são derivados do nome em português e páginas individuais ainda podem exigir revisão editorial. |
| FR-11 Dados locais | Texto da página e documentação descrevem os dados; ação de exclusão foi exercitada e o progresso continuou vazio após recarga. |
| FR-12 Exportação | Download JSON verificado no navegador com `formatVersion: 1`, `collectionId: "fishing"` e apenas `recordedIds`; teste automatizado cobre ajustes locais e exclusão de versão do save. |
| FR-13 Coleções futuras | Registro contém pesca e Museu; testes verificam contrato e isolamento de armazenamento; `docs/adding-collections.md` descreve extensão. |

## Requisitos não funcionais

| Requisito | Resultado e limite |
| --- | --- |
| NFR-01, 02, 13 Hospedagem estática | Somente HTML, CSS e módulos JS; `.nojekyll`; caminhos relativos; servidor HTTP estático local carregou página e recursos sem backend, banco ou build. A publicação no GitHub Pages ainda não foi executada nesta revisão. |
| NFR-03 Processamento local | `File.text()` e `DOMParser` no navegador; busca no código não encontrou `fetch`, XHR, envio de formulário, analytics ou logs do save. O servidor local registrou apenas GETs de página e recursos durante os testes. |
| NFR-04 Formatos | XML principal 1.6.x descompactado, até 10 MiB. ZIP, GZIP, 7z, RAR, `.bin`, `SaveGameInfo`, backups e versões anteriores não são aceitos. Somente XML sintético 1.6.15 foi testado de ponta a ponta. |
| NFR-05, 06 Armazenamento | `localStorage` contém apenas tema e conjuntos de IDs de catálogo; sem arquivo, XML ou dados pessoais. Não há sincronização entre navegadores/dispositivos. |
| NFR-07 Entrada não confiável | Limite de tamanho, estrutura e versão validados; `DOCTYPE`/`ENTITY` recusados; texto de arquivo não entra em `innerHTML` nem é executado. |
| NFR-08 Responsividade | Navegador verificado a 320 e 375 px, sem rolagem horizontal após ajuste do campo de arquivo; filtros e cartões permanecem acessíveis. Larguras maiores usam grades responsivas. |
| NFR-09 Acessibilidade | Controles de formulário rotulados, botões com nomes acessíveis, estados `aria-pressed`, regiões `role=status`, foco visível. Pares principais de texto/fundo medidos entre 6,09:1 e 13,47:1 nos temas claro/escuro; não houve auditoria com leitor de tela humano. |
| NFR-10 Desempenho | 72 itens e XML sintético pequeno responderam no navegador. `DOMParser` roda na thread da página; uma pausa em dispositivos lentos perto de 10 MiB permanece possível e está documentada. |
| NFR-11 Manutenção | Dados, parser, progresso, apresentação, filtros e estilos em módulos separados; IDs estáveis e registro extensível. |
| NFR-12 Conteúdo verificável | Versão 1.6, data de revisão e fontes aparecem no catálogo e na documentação; condições incompletas continuam sinalizadas. |

## Critérios de aceitação

Os cenários de importação válida/inválida, distinção entre base e ajustes, desfazer/restaurar, filtros em tela pequena e download JSON foram exercitados. O arquivo não apareceu em armazenamento ou logs, e nenhum POST foi observado no servidor local. O projeto foi servido como arquivos estáticos. A publicação efetiva no GitHub Pages, testes com saves reais por plataforma, auditoria humana com leitor de tela e medição de desempenho em aparelhos lentos permanecem fora da evidência desta revisão.

## Artigos do Museu — 2026-10-14

A suíte `node --test tests/*.test.mjs` passou com 30 testes. Inclui 95 IDs únicos (42 artefatos e 53 minerais), nomes e fontes, filtros combinados, doações vazias/parciais/completas, duplicatas, IDs desconhecidos, registros inválidos, descoberta sem doação, isolamento da pesca, persistência, exportação e exclusão global. Os testes Node usam árvores DOM controladas; a leitura efetiva de XML foi verificada separadamente no Chrome headless com `DOMParser` nativo.

A amostra pública [sample_1_6.xml](https://github.com/ronglin02/stardew/blob/main/tests/fixtures/sample_1_6.xml), versão 1.6.15, confirma a estrutura de `LibraryMuseum` e os valores inteiros 96 e 60. A fixture local `tests/fixtures/museum-1.6.xml` contém a mesma estrutura sem dados pessoais, além de um peixe e registros de descoberta que não contam como doação. Essas fixtures não substituem um save real exportado do jogo; a compatibilidade por plataforma permanece sem essa evidência.

No navegador foram verificados os 95 cartões, busca e filtros, marcação manual e foco após atualização, persistência após recarga, importação da fixture pública e da fixture local, preservação de progresso após XML malformado, desfazer ajustes, download JSON, temas claro/escuro, navegação a 375 px, teclado e fallback de imagens indisponíveis. A pesca continuou com seus 72 IDs únicos e importou um item da fixture. A exclusão global foi exercitada nas duas páginas e atualizou outra aba aberta. Uma importação pendente foi concluída após a exclusão para confirmar que não recriava os dados removidos. Nenhum erro JavaScript da página foi observado.

## Navegação lateral e importação única — 2026-10-14

A lateral substitui o cabeçalho nas duas páginas, com sprites locais de Stardrop, vara de irídio, pergaminho e baú. Em telas pequenas funciona como menu lateral recolhível, com Escape, foco contido e conteúdo de fundo inerte. A única janela de importação fica acessível por essa lateral e atualiza pesca e Museu a partir de uma leitura e uma interpretação do XML. O progresso continua disponível ao trocar de página e recarregar. Saves antigos preservam as chaves de armazenamento.

A suíte automatizada passou com 33 testes, incluindo uma única leitura/interpretação e a rejeição de um arquivo cuja pesca ou Museu seja inválido sem substituir nenhuma base. No Chrome, uma importação na página do Museu atualizou também pesca; navegação e recargas preservaram ambas. Foram verificados o diálogo pelo teclado, sprites locais, temas, menu móvel e foco, larguras de 320, 375, 760 e 850 px sem rolagem horizontal, erro de importação sem alterações parciais e exclusão global. Os limites das fixtures XML documentados acima continuam valendo.

## Imagens locais dos itens — 2026-10-14

Os 167 itens (72 da pesca e 95 do Museu) têm PNGs locais em `assets/items/`, com fontes em `sources.json`. O downloader usa `curl`, preserva arquivos válidos, tenta endereços diretos e o redirecionamento da Wiki, limita tempo e tamanho e valida cabeçalho, dimensões e término de cada PNG antes da gravação. O site utiliza somente os caminhos locais para as imagens dos cartões.

`node scripts/download-item-images.mjs --check` confirmou 167 imagens válidas e zero falhas, sem rede. A suíte `node --test tests/*.test.mjs` passou com 34 testes, incluindo inventário de imagens, fontes e caminhos relativos sob o prefixo do GitHub Pages. Uma página temporária de conferência no navegador decodificou todos os 167 arquivos, sem falhas nem imagens de outra origem; a página foi removida após a checagem. A prévia do Museu foi recarregada com suas 95 miniaturas locais, mantendo o carregamento sob demanda. Os links de consulta continuam apontando para a Wiki.

## Migração para React + Vite + TypeScript — 2026-10-14

A interface passou a ser uma aplicação React compilada com Vite. Modelos de domínio, chaves de armazenamento, formato `v: 1`, IDs, chave de tema e formato de exportação não mudaram. `npm test` executa: 38 testes de domínio e filtros (`tests/*.test.mjs`), TypeScript estrito, build, 4 verificações de `dist/` (entradas, `.nojekyll`, sprites, documentação, `theme-init.js` e caminhos sob `/stardew-diary/`) e 16 cenários Playwright no Chrome contra a prévia do build.

Os cenários Playwright cobrem: progresso pré-migração lido do `localStorage`, marcação, desfazer, restaurar, exportação e exclusão de dados; importação válida, inválida, cancelada ao fechar o diálogo e com falha de armazenamento; filtros independentes por coleção, mantidos após troca de seção e recarga, e valores salvos inválidos; URLs diretas, voltar/avançar sem recarregar, títulos e foco no título da coleção; foco preservado após marcar ou movido para o filtro de coleção; lateral recolhida e preferência de sessão; menu móvel com foco contido, Escape e fechamento ao navegar; tema; sincronização entre abas; imagens locais sem requisições externas; e ausência de rolagem horizontal.

Antes da migração, 40 combinações de estado (desktop e 375 px, temas claro e escuro, Peixes e Museu, lateral recolhida e expandida, painel de progresso, menu e diálogo) foram capturadas na versão anterior e na nova e comparadas pixel a pixel. Foram idênticas, exceto o fundo semitransparente do menu e do diálogo no celular, com diferença máxima de 1 nível de cor por arredondamento de composição.
