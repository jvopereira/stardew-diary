# Importação local de saves

Revisado em 2026-10-09. O leitor aceita **XML descompactado com `<SaveGame>`, `<gameVersion>1.6</gameVersion>` ou `<gameVersion>1.6.x</gameVersion>`, `<player>` e `<fishCaught>`**. O limite é **10 MiB** por arquivo. A versão 1.6 é a linha de referência do catálogo; a estrutura de `fishCaught` e suas chaves foi conferida no código do Stardew Checkup. Patches futuros podem mudar a estrutura e falharão na validação se não seguirem esse formato.

## Qual arquivo selecionar

Na pasta da partida, selecione o arquivo principal com nome parecido com `Nome_123456789` (geralmente sem extensão), **não** `SaveGameInfo`. O jogo precisa de ambos para carregar a partida, mas esta página lê apenas o arquivo principal. A pasta costuma estar em:

- Windows: `%appdata%\StardewValley\Saves`
- macOS: `~/.config/StardewValley/Saves`
- Linux: `~/.config/StardewValley/Saves` (a localização pode variar com Flatpak ou outros lançadores)
- Android 1.5 ou posterior: `Android/data/com.chucklefish.stardewvalley/files/Saves` (arquivos `.bin` dessa pasta não são aceitos por este leitor)
- iOS: app Arquivos → No Meu iPhone/iPad → Stardew Valley

A [documentação de saves da wiki](https://stardewvalleywiki.com/Saves) confirma XML em computador e dispositivos móveis. **A origem do arquivo não é identificável pelo XML**: a compatibilidade é decidida pela versão e pela estrutura, não por uma alegação de plataforma. O formato do arquivo principal 1.6.x é o único implementado. Saves de versões 1.5 e anteriores, `SaveGameInfo`, backups `_old`, `.bin` do Android, ZIP, GZIP, 7z, RAR, arquivos de console e saves modificados que não sigam a estrutura indicada não são aceitos. Não há descompressão automática; extraia um backup antes de selecionar o XML.

## O que acontece na importação

O navegador lê o arquivo por `File.text()` e `DOMParser`; o código não usa `fetch`, requisições de rede, analytics, cookies ou armazenamento do arquivo. O XML, o nome do jogador e outros dados privados não são colocados na página nem registrados no console. Somente as chaves e contagens de `<player><fishCaught>` são usadas. As chaves conhecidas são mapeadas aos 72 IDs do catálogo; chaves desconhecidas com formato simples são ignoradas; estruturas inesperadas são rejeitadas. Uma contagem positiva marca o item como registrado.

O arquivo é verificado **antes** de trocar o progresso importado. Arquivo vazio, acima do limite, compactado, versão incompatível, XML inválido, declarações `DOCTYPE`/`ENTITY`, ausência de `fishCaught` ou registros malformados geram uma mensagem acessível e mantêm o progresso anterior. Após uma importação válida, a base importada é substituída e as marcações manuais temporárias são limpas. Tanto a base quanto as marcações manuais ficam somente na memória da aba; recarregar a página as apaga. Nenhum save é salvo em `localStorage`, `sessionStorage` ou cookies.

## Fontes da compatibilidade

- [Stardew Valley Wiki: Saves](https://stardewvalleywiki.com/Saves) — XML, tag de versão, arquivo principal e caminhos por plataforma.
- [Stardew Checkup, código de pesca](https://github.com/MouseyPounds/stardew-checkup/blob/master/stardew-checkup.js) — estrutura `fishCaught > item > key/value`, chaves de peixe da versão 1.6 e prefixo opcional `(O)`.
- [Stardew Valley Wiki: Collections](https://stardewvalleywiki.com/Collections) — limite da aba Peixes usado pelo catálogo.
