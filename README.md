# Site · Elisete Castilho, Nutricionista e Esteticista

Site estático (HTML + CSS + JS puro, sem build). Basta abrir o `index.html` no navegador.

## Estrutura
```
index.html            página única (todas as seções)
css/styles.css        estilos; cores e fontes nas variáveis do topo (:root)
js/config.js          WhatsApp, Instagram, CRN e mensagem padrão  ← edite aqui
js/trepadeira.js      a trepadeira de jasmim interativa (canvas)
js/main.js            abertura 0→100%, abas dos meses, menu, ligação das trepadeiras
assets/img/           fotos (.webp) e capas dos guias (assets/img/guias/)
assets/favicon.svg    ícone (flor de jasmim)
robots.txt, sitemap.xml
_originais/, qa/      arquivos de trabalho (não precisam ir para o servidor)
```

## Como alterar
- **WhatsApp / CRN / Instagram / mensagem:** `js/config.js`. Todos os botões "Agendar" usam esse número.
- **Fotos:** substitua o arquivo em `assets/img/` mantendo o mesmo nome. Se uma imagem faltar, aparece um bloco elegante "Foto em breve" no lugar.
- **Guias (loja):** no `index.html`, seção `id="guias"`. Cada guia tem capa, título, preço e um botão com o link da Kiwify.
- **Cores e fontes:** `css/styles.css`, bloco `:root` no topo.
- **Logo:** a marca é tipográfica ("Elisete *Castilho*" em Playfair Display). Se ela tiver um logo, troque o conteúdo do `<a class="marca">`.
- **Cache:** ao alterar CSS/JS, aumente o `?v=1` nos links do `index.html`.

## Publicar
Qualquer hospedagem estática serve (GitHub Pages, Hostinger, Netlify). Envie tudo, exceto `_originais/` e `qa/`. Depois atualize o domínio em `index.html` (canonical/og), `sitemap.xml` e `robots.txt`.

## Decisões
- **Conceito "Trepadeira":** o emagrecimento depois dos 40 é visto como algo que precisa de estrutura (a treliça), tempo (90 dias) e cuidado constante. O jasmim-estrela é branco sobre o carvão da identidade dela, e os botões rosados lembram o magenta que ela usa.
- **Interação:** as flores desabrocham quando o mouse passa, as gavinhas se esticam até o cursor, as folhas balançam e um clique faz crescer um broto. Respeita `prefers-reduced-motion`: nesse modo, a planta aparece pronta e sem animação.
- **Fontes:** Playfair Display (a serifada contrastada dos posts dela) em pesos 500/600, para não ficar fina, + Lato no texto.
- **QA:** `node qa/shots.cjs` tira screenshots em 1440 e 390 px (usa o Playwright da skill playwright-skill).
