# Catálogo de pesca

Referência de conteúdo: Stardew Valley **1.6** (linha principal). Revisão: **2026-10-09**. Para formatos de save aceitos, consulte [Importação local de saves](save-import.md).

## Limite da coleção

O catálogo contém os **72 espaços da aba Peixes em Coleções** da versão 1.6: peixes de vara, criaturas de covo, algas e geléias. A ordem dos registros segue a aba do jogo. Um item só é registrado nessa aba quando é pescado com vara ou retirado de um covo; comprar, coletar na praia ou obter de monstros não basta. A lista de inclusão está em `scripts/data/fishing.js`; cada registro representa um espaço da aba.

Ficam **fora** deste catálogo: peixes da missão *Família Estendida* de Qi (Legend II, Ms. Angler, Glacierfish Jr., Son of Crimsonfish e Radioactive Carp), lixo pescado, itens da praia que não têm espaço na aba e peixes de mods. O catálogo não é uma lista de espécies biológicas: algas e geléias aparecem porque a aba do jogo as inclui.

A porcentagem futura do Diário do Vale medirá somente os espaços desta aba. **Ela não representa a conquista Mestre Pescador (*Master Angler*)**. A conquista usa regras próprias para capturas e não exige os peixes da missão *Família Estendida*; portanto, o site não deve inferir a conquista apenas da porcentagem do catálogo.

## Modelo e estado de verificação

Cada entrada tem um `id` estável, independente do idioma, além de `namePt`, `nameEn`, `seasons`, `location`, `time`, `weather`, `method`, `specialRequirements`, `needsVerification` e `sources`. Os IDs são slugs estáveis do nome inglês; **não são IDs de objetos do save**. O mapeamento 1.6 entre esses IDs e as chaves do save está em `scripts/data/fish-save-ids.js`.

- `seasons`: códigos `spring`, `summer`, `fall`, `winter`; `null` significa ainda não verificado.
- `time`: faixa no relógio do jogo, `any` ou `null`.
- `weather`: `sunny`, `rainy`, `any` ou `null`.
- `method`: `rod` ou `crab-pot`.
- `specialRequirements`: texto quando confirmado; `null` é **desconhecido**, não “nenhum requisito”.
- `needsVerification`: nomes dos campos cujo valor ainda não foi confirmado. A interface futura deve mostrar “A verificar” para esses campos, sem transformá-los em “qualquer estação/horário/clima”.

As condições confirmadas incluem exemplos sazonais da tabela do canal F.I.B.S. em português, as regras gerais dos covos e o Gobi. As faixas e locais do F.I.B.S. são exemplos confirmados, mas ainda podem ter outras condições; por isso os campos continuam em `needsVerification`. Elas são **condições usuais**, sem a exceção da Isca Mágica. Localizações alternativas, detalhes das lendas, acesso a áreas especiais e outros campos permanecem marcados para verificação. Não use estes registros incompletos como guia definitivo de captura.

## Fontes

- `collections-pt`: [Coleções, aba Peixes (wiki em português)](https://pt.stardewvalleywiki.com/Cole%C3%A7%C3%B5es) — inclusão, ordem e nomes em português.
- `collections-en`: [Collections, Fish tab (wiki em inglês)](https://stardewvalleywiki.com/Collections) — nomes em inglês e regra de registro.
- `fish-pt`: [Peixes (wiki em português)](https://pt.stardewvalleywiki.com/Peixes) — métodos e contexto de captura.
- `fibs-pt`: [Informação de Pesca (wiki em português)](https://pt.stardewvalleywiki.com/Informa%C3%A7%C3%A3o_de_Pesca) — estações e condições usuais preenchidas no catálogo.
- `fibs-en`: [Fishing Information Broadcasting Service (wiki em inglês)](https://stardewvalleywiki.com/Fishing_Information_Broadcasting_Service) — referência complementar para condições de verão.
- `goby-pt`: [Gobi (wiki em português)](https://pt.stardewvalleywiki.com/Gobi) — condições e exigência de alcance.
- [Achievements (wiki em inglês)](https://stardewvalleywiki.com/Achievements) — distinção da conquista e peixes da missão de Qi.

As páginas da wiki podem mudar. Revise cada condição ainda marcada antes de apresentá-la como confirmada na interface.
