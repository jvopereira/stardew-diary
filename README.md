# Diário do Vale

Site estático para explorar a coleção de pesca de Stardew Valley e importar o progresso de um save XML 1.6.x diretamente no navegador.

## Estrutura

- `index.html` — redireciona a raiz para o catálogo.
- `catalogo.html` — estrutura da página do catálogo.
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

O repositório usa `main` como branch e mantém `index.html`, `catalogo.html` e `.nojekyll` na raiz. A fonte de publicação correspondente é **Deploy from a branch → `main` → `/ (root)`**. Não é necessário workflow, etapa de build, backend, segredo ou serviço adicional.

1. Envie os commits que deseja publicar com `git push origin main`. Arquivos não rastreados pelo Git não são publicados.
2. Em [Settings → Pages do repositório](https://github.com/jvopereira/stardew-diary/settings/pages), escolha **Deploy from a branch** em **Build and deployment → Source**.
3. Escolha **`main`** e **`/ (root)`**, depois clique em **Save**. É necessário ter permissão de administração ou manutenção no repositório para alterar essa configuração.
4. Aguarde a implantação e abra [https://jvopereira.github.io/stardew-diary/](https://jvopereira.github.io/stardew-diary/). A raiz abre o catálogo. Confira estilos e controles. A URL só responderá após Pages estar habilitado e a implantação terminar.

Para **atualizar** o site, registre as alterações em um commit e execute `git push origin main`; Pages publica as mudanças da raiz dessa branch. Acompanhe o andamento em **Actions** ou **Settings → Pages**. Para testar antes de enviar, execute `node --test tests/*.test.mjs` e siga as instruções de servidor local acima.

Os caminhos internos são relativos, então os recursos funcionam sob o prefixo `/stardew-diary/` do endereço de projeto e em um domínio próprio. `.nojekyll` mantém os arquivos estáticos sem processamento Jekyll.

## Catálogo de pesca

O modelo da aba Peixes e seus limites estão documentados em [docs/fishing-catalog.md](docs/fishing-catalog.md). Há campos de condições de captura pendentes de verificação; o catálogo ainda não é um guia completo.

O registro de coleções em `scripts/data/collections.js` contém apenas categorias implementadas e alimenta a navegação. Para acrescentar outra coleção, veja [docs/adding-collections.md](docs/adding-collections.md); a lógica de pesca permanece isolada.

## Tema

O botão no cabeçalho alterna entre claro e escuro. Sem escolha salva, o site segue a preferência de cores do sistema. A escolha é guardada apenas como `light` ou `dark` em `localStorage` neste navegador; se o armazenamento estiver indisponível, a alternância ainda funciona até recarregar a página.

## Catálogo

Abra a raiz do site ou `catalogo.html` para pesquisar os 72 itens e filtrar por estação, método ou status. O status vem de uma base importada e de ajustes manuais separados. O navegador guarda apenas os IDs de catálogo necessários para recuperar esses estados. **Desfazer alterações manuais** volta à base importada; **Restaurar progresso inicial** remove também essa base; **Importar outro save** só troca a base após uma nova validação bem-sucedida. **Excluir dados locais do site** apaga o progresso e a preferência de tema deste navegador, sem alterar arquivos do jogo. O progresso fica neste navegador e não é sincronizado entre dispositivos. Entradas com estação ainda não verificada ficam no grupo “Estação a verificar”; condições parciais são identificadas no cartão.

**Exportar progresso em JSON** baixa os IDs atualmente registrados, incluindo ajustes manuais, com `formatVersion: 1` e `collectionId: "fishing"`. O arquivo serve como backup ou referência para transferência manual; o site ainda não importa esse JSON. Nenhum dado do save entra no arquivo exportado.

## Importação de saves

No catálogo, selecione o arquivo XML principal de uma partida 1.6.x e clique em **Importar progresso**. Consulte [docs/save-import.md](docs/save-import.md) para formatos, plataformas, limite de 10 MiB e privacidade. A leitura é local; o arquivo, seu XML e seus dados pessoais não são armazenados.

Os resultados da revisão dos requisitos, os cenários testados e os limites da evidência estão em [docs/verification.md](docs/verification.md).
