# Artigos do Museu

Referência: Stardew Valley **1.6**. Revisão: **2026-10-14**.

A coleção acompanha **95 doações únicas ao Gunther**: 42 artefatos e 53 minerais, incluindo gemas e minerais de coleta. O Museu é compartilhado pela fazenda em partidas multiplayer. Encontrar, possuir ou vender um item não conta como doação. Livros perdidos, recompensas do Museu, fósseis do Professor Caracol e objetos exclusivos de mods não entram no catálogo.

Os cartões mostram nomes em português e inglês, tipo, imagem e exemplos de como obter. A busca ignora acentos e maiúsculas; os filtros combinam tipo e status de doação. Artefatos e minerais são apresentados em grupos, em ordem alfabética pelo nome em português. As variantes verde e amarela do Boneco Estranho têm IDs próprios, imagens próprias e rótulos distintos.

## Dados e fontes

`scripts/data/museum.js` contém IDs estáveis derivados dos nomes ingleses, `namePt`, `nameEn`, `type`, `saveId`, `obtaining`, `wikiUrl`, `needsVerification` e `sources`. A regra de conclusão exige todos os 95 IDs. O mapa de fontes acompanha o módulo; a data de revisão não significa que a Wiki ficará congelada nessa versão.

Nomes em português e links foram conferidos nas tabelas portuguesas. Os exemplos de obtenção de artefatos foram conferidos na tabela inglesa atual, pois a tabela portuguesa omite alternativas mais recentes. Minerais usam as fontes indicadas na tabela portuguesa. Os resumos são exemplos, sem probabilidades e sem pretensão de listar todas as alternativas; dados não confirmados devem ser marcados em `needsVerification` e exibidos como “A verificar”.

- [Museu em português](https://pt.stardewvalleywiki.com/Museu) e [Museum](https://stardewvalleywiki.com/Museum): escopo das doações.
- [Artefatos](https://pt.stardewvalleywiki.com/Artefatos): nomes e links em português.
- [Artifacts](https://stardewvalleywiki.com/Artifacts): exemplos de obtenção.
- [Minerais](https://pt.stardewvalleywiki.com/Minerais): nomes e exemplos de obtenção.
- [Stardew Checkup](https://github.com/MouseyPounds/stardew-checkup/blob/master/stardew-checkup.js): IDs dos objetos e leitura de doações.

## Save e progresso

O leitor procura `locations > GameLocation` cujo atributo `type`, no namespace XML Schema Instance, seja `LibraryMuseum`. Em `museumPieces > item`, a chave é a posição `Vector2` e o valor é o ID do objeto doado, normalmente `<value><int>96</int></value>`. Valores string também aceitam IDs simples ou qualificados por `(O)`. As posições não contam como IDs; `archaeologyFound` e `mineralsFound` não determinam doações.

O leitor valida o XML e a versão 1.6.x antes de extrair IDs conhecidos. Aceita coleção vazia, deduplica doações e ignora IDs desconhecidos válidos. Museu ausente, duplicado ou registro inválido mantém o progresso anterior de ambas as coleções. As proteções de arquivo são compartilhadas com pesca: limite de 10 MiB, rejeição de backups, binários, arquivos compactados e entidades externas.

Foi conferida uma [fixture pública 1.6.15](https://github.com/ronglin02/stardew/blob/main/tests/fixtures/sample_1_6.xml) com valores inteiros 96 e 60. Ela é uma amostra de teste, **não evidência de um save real exportado do jogo**. A verificação no navegador usa XML completo com a mesma estrutura e fixtures locais reduzidas, sem dados pessoais. Não há validação de plataformas ou mods de ponta a ponta.

O botão único na lateral lê o arquivo e interpreta o XML uma vez, valida pesca e Museu e só então substitui as duas bases, removendo os ajustes manuais de ambas. Basta importar uma vez e o progresso continua disponível ao trocar de página. O progresso do Museu usa `diario-do-vale-progress-museum-v1`, separado da pesca. Somente IDs da base importada e ajustes locais são persistidos. O XML, nomes de jogadores e informações da fazenda não são armazenados. Desfazer ajustes mantém a base; restaurar progresso inicial limpa somente a coleção atual. “Excluir dados locais do site”, em qualquer página, apaga as duas coleções e o tema. Outras abas abertas recarregam o progresso quando o armazenamento muda.

A exportação usa `formatVersion: 1`, `collectionId: "museum"` e `recordedIds`. Não inclui XML, versão do save ou dados pessoais. O site ainda não importa os arquivos JSON exportados.
