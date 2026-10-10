# Diário do Vale

Site estático para explorar a coleção de pesca de Stardew Valley e importar o progresso de um save XML 1.6.x diretamente no navegador.

## Estrutura

- `index.html` — conteúdo e estrutura da página.
- `styles/main.css` — apresentação e layout responsivo.
- `scripts/data/collections.js` — metadados das coleções (preparado para outras categorias).
- `scripts/app.js` — comportamento da aplicação.
- `.nojekyll` — evita processamento Jekyll no GitHub Pages.

## Executar localmente

Use um servidor HTTP simples na raiz do repositório (módulos JavaScript não funcionam de forma confiável via `file://`):

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000/`. Não há dependências para instalar nem etapa de build.

## Publicar no GitHub Pages

1. Envie os arquivos para a branch que deseja publicar (por exemplo, `main`).
2. No repositório do GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch e a pasta **/ (root)**, depois salve.
5. Aguarde a URL indicada na página de configuração. Atualizações na branch publicada serão implantadas automaticamente.

Os caminhos de recursos são relativos, então a página funciona tanto em um domínio próprio quanto em um endereço de projeto (`usuario.github.io/repositorio/`).

## Catálogo de pesca

O modelo da aba Peixes e seus limites estão documentados em [docs/fishing-catalog.md](docs/fishing-catalog.md). Há campos de condições de captura pendentes de verificação; o catálogo ainda não é um guia completo.

O registro de coleções em `scripts/data/collections.js` contém apenas categorias implementadas e alimenta a navegação. Para acrescentar outra coleção, veja [docs/adding-collections.md](docs/adding-collections.md); a lógica de pesca permanece isolada.

## Tema

O botão no cabeçalho alterna entre claro e escuro. Sem escolha salva, o site segue a preferência de cores do sistema. A escolha é guardada apenas como `light` ou `dark` em `localStorage` neste navegador; se o armazenamento estiver indisponível, a alternância ainda funciona até recarregar a página.

## Catálogo

Abra `catalogo.html` para pesquisar os 72 itens e filtrar por estação, método ou status. O status vem de uma base importada e de ajustes manuais separados. O navegador guarda apenas os IDs de catálogo necessários para recuperar esses estados. **Desfazer alterações manuais** volta à base importada; **Restaurar progresso inicial** remove também essa base; **Importar outro save** só troca a base após uma nova validação bem-sucedida. **Excluir dados locais do site** apaga o progresso e a preferência de tema deste navegador, sem alterar arquivos do jogo. O progresso fica neste navegador e não é sincronizado entre dispositivos. Entradas com estação ainda não verificada ficam no grupo “Estação a verificar”; condições parciais são identificadas no cartão.

## Importação de saves

No catálogo, selecione o arquivo XML principal de uma partida 1.6.x e clique em **Importar progresso**. Consulte [docs/save-import.md](docs/save-import.md) para formatos, plataformas, limite de 10 MiB e privacidade. A leitura é local; o arquivo, seu XML e seus dados pessoais não são armazenados.
