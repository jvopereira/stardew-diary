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
| FR-13 Coleções futuras | Registro contém apenas pesca; teste verifica contrato e isolamento de armazenamento; `docs/adding-collections.md` descreve extensão. |

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
