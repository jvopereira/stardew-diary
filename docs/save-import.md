# Importação local de saves

Revisado em 2026-10-14. O leitor aceita **XML descompactado com `<SaveGame>`, `<gameVersion>1.6</gameVersion>` ou `<gameVersion>1.6.x</gameVersion>`, `<player>` e `<fishCaught>`**. O limite é **10 MiB** por arquivo. A versão 1.6 é a linha de referência do catálogo; a estrutura de `fishCaught` e suas chaves foi conferida no código do Stardew Checkup. Patches futuros podem mudar a estrutura e falharão na validação se não seguirem esse formato.

Para **Artigos do Museu**, o leitor exige a localização `LibraryMuseum` em `locations` e seu registro `museumPieces`. Lê os IDs nos valores de cada doação, sem usar os registros de descoberta do jogador. O progresso é compartilhado pela fazenda e independente da pesca. Veja [Artigos do Museu](museum-catalog.md) para formato, fontes e limites de verificação.

## Uma importação para todas as coleções

O botão **Importar save** na navegação lateral abre uma única janela. **Atualizar todas as coleções** lê e interpreta o XML uma vez, valida os registros de pesca e Museu e só então aplica o resultado às duas coleções. Se qualquer registro estiver ausente ou inválido, ambas preservam o progresso anterior. O novo save válido substitui as duas bases e remove os ajustes manuais de ambas.

Não é necessário importar novamente ao trocar de página ou recarregar: somente os IDs de progresso ficam salvos neste navegador. Após jogar, use **Atualizar save** para ler o arquivo atualizado. O site não acompanha alterações no arquivo automaticamente. Saves já importados anteriormente continuam disponíveis nas suas chaves originais; se apenas uma coleção tiver base importada, a lateral orienta a atualizar o save para sincronizá-las.

## Verificação e limites

Os testes automatizados e a revisão no navegador usam **arquivos XML sintéticos** que reproduzem a estrutura esperada, incluindo um exemplo com `gameVersion` 1.6.15. Foram exercitados arquivos válidos, versões incompatíveis, XML malformado, campos ausentes, identificadores desconhecidos, declarações `DOCTYPE`, arquivos compactados por extensão e arquivos acima do limite. **Nenhum save real exportado do jogo ou dispositivo específico foi usado nos testes deste projeto.** Por isso, Windows, macOS, Linux, Android e iOS são origens documentadas do XML, não plataformas validadas de ponta a ponta pelo site. A compatibilidade efetiva depende da estrutura do arquivo selecionado. O parser XML do navegador trabalha na thread da página; em arquivos próximos de 10 MiB, dispositivos lentos podem apresentar uma pausa durante a leitura e validação.

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

O arquivo é verificado **antes** de trocar o progresso importado. Arquivo vazio, acima do limite, compactado, versão incompatível, XML inválido, declarações `DOCTYPE`/`ENTITY`, ausência de `fishCaught` ou registros malformados geram uma mensagem acessível e mantêm o progresso anterior. Após uma importação válida, a base importada é substituída e as marcações manuais são limpas. **Desfazer alterações manuais** remove apenas os ajustes locais e mostra novamente a base importada. **Restaurar progresso inicial** remove tanto a base quanto os ajustes, deixando todos os itens não registrados. **Importar outro save** abre a escolha de arquivo; escolher ou cancelar não altera o estado, e somente uma nova importação válida substitui a base.

O navegador guarda em `localStorage` somente a preferência de tema (`light` ou `dark`) e os IDs do catálogo que representam a base importada e os ajustes manuais. O marcador de versão do esquema de armazenamento não contém dados da partida. A versão do jogo exibida após a importação existe só na memória da aba. O arquivo, seu XML, nome do jogador e outros dados pessoais não são guardados em `localStorage`, `sessionStorage`, cookies ou logs. O progresso permanece neste navegador e não é sincronizado entre dispositivos. **Excluir dados locais do site** remove as duas entradas de armazenamento do site e limpa o progresso da aba; não altera nenhum arquivo do jogo. Se o armazenamento estiver indisponível, o catálogo continua funcionando na aba e avisa quando uma alteração não puder ser salva.

## Fontes da compatibilidade

- [Stardew Valley Wiki: Saves](https://stardewvalleywiki.com/Saves) — XML, tag de versão, arquivo principal e caminhos por plataforma.
- [Stardew Checkup, código de pesca](https://github.com/MouseyPounds/stardew-checkup/blob/master/stardew-checkup.js) — estrutura `fishCaught > item > key/value`, chaves de peixe da versão 1.6 e prefixo opcional `(O)`.
- [Stardew Valley Wiki: Collections](https://stardewvalleywiki.com/Collections) — limite da aba Peixes usado pelo catálogo.
