# Diário do Vale

Site estático para acompanhar coleções de Stardew Valley. Esta primeira etapa apresenta o projeto; o catálogo, o acompanhamento de progresso e a importação de saves ainda não estão disponíveis.

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

## Escopo desta etapa

A página apresenta a futura coleção de pesca. Os critérios de inclusão, a versão de Stardew Valley usada como referência, as fontes, os formatos de save aceitos e as regras de privacidade serão documentados junto das respectivas funcionalidades antes de serem disponibilizadas.
