# Imagens locais dos itens

Sprites de Stardew Valley (ConcernedApe), obtidos da Stardew Valley Wiki. Os PNGs originais são organizados por coleção e ID estável do catálogo. Não há requisições de imagens à Wiki ao abrir o site. Os links informativos dos cartões continuam apontando para a Wiki.

`sources.json` registra a fonte de cada arquivo. As variantes verde e amarela do Boneco Estranho usam imagens distintas. Não há conversão nem redimensionamento dos originais; o CSS preserva a aparência pixelada.

## Baixar ou completar as imagens

Na raiz do repositório, execute:

```sh
node scripts/download-item-images.mjs
```

Requer Node.js e `curl` no PATH; somente essa manutenção precisa acessar a internet. O site continua sem instalação de dependências ou build. O script usa os catálogos existentes, baixa até quatro arquivos simultaneamente, limita tempo e tamanho, tenta novamente falhas e grava somente PNGs com cabeçalho, dimensões e marcador de término válidos. A gravação usa arquivo temporário para não substituir um original por um download incompleto.

Arquivos locais válidos são preservados; uma segunda execução baixa apenas o que estiver ausente ou inválido. Para atualizar um sprite, remova o arquivo correspondente e execute novamente. Falhas são listadas e retornam código de saída 1; o manifesto de fontes só é atualizado quando todos os itens estiverem disponíveis.

Para conferir os arquivos sem acessar a internet nem modificá-los:

```sh
node scripts/download-item-images.mjs --check
node --test tests/*.test.mjs
```

Ao adicionar itens a uma coleção, execute o downloader e inclua os novos PNGs e o manifesto no commit. Os arquivos são publicados junto do HTML no GitHub Pages.
