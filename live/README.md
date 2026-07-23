# Clone — "Manuscrito dos Milagres" (estilo YouTube Live)

Clone fiel do layout/estilo da página original, 100% estático (1 arquivo HTML,
sem build, sem dependências). Basta abrir `index.html` ou subir a pasta para
qualquer hospedagem estática (Vercel, Netlify, etc).

## O que foi mantido (igual ao original)
- Layout completo estilo "YouTube ao vivo": header, player, título, chips,
  botões de inscrever/curtir/compartilhar, aviso de expiração.
- **Mensagens automáticas do chat** — mesmo texto, mesmos nomes, mesmo
  comportamento (carrega 6 mensagens, depois injeta novas em intervalos
  aleatórios de 4–10s, limita a 60 no DOM, auto-scroll).
- Contador de "assistindo agora" com variação aleatória a cada 3s.
- Data de expiração que sempre mostra o dia atual.
- Todas as imagens (avatar do canal + 17 avatares do chat) baixadas para
  `assets/images/` — a página funciona 100% offline, sem depender de
  domínios de terceiros para imagens.

## O que foi removido (rastreamento)
- **UTMify** (`cdn.utmify.com.br/scripts/utms/latest.js` e `pixel.js`) —
  script de atribuição de campanha + Pixel do Facebook (`pixelId`).
- Snippet de performance da VTurb (`window._plt = ...`) — telemetria enviada
  para a conta de analytics do dono original.
- Todos os parâmetros de rastreamento da URL (`utm_source`, `utm_campaign`,
  `utm_medium`, `utm_content`, `utm_term`, `utm_id`, `fbclid`) simplesmente não
  existem mais aqui, já que a página é estática e não lê/reenvia esses dados.

## O que você precisa trocar
- **Vídeo do player**: o original usa um player hospedado na VTurb
  (`scripts.converteai.net`) com o ID da conta do dono original — não é
  possível "copiar" esse vídeo, ele pertence a outra pessoa. Troquei o player
  por uma tag `<video>` nativa apontando para `assets/video/seu-video.mp4`.
  Coloque seu próprio vídeo ali (ou troque por um embed seu de VTurb, Panda
  Video, Vimeo etc — o HTML está comentado no arquivo indicando onde mexer).
- Se quiser reativar rastreamento **seu** (ex: seu próprio Pixel/UTMify para
  medir suas campanhas), basta adicionar o script novamente no `<head>` com
  as suas credenciais — não vem nada de terceiro aqui por padrão.

## Como rodar
Abra `index.html` direto no navegador, ou sirva a pasta com qualquer servidor
estático:

```bash
npx serve .
```

## Como fazer deploy (Vercel)
```bash
cd manuscrito-clone
vercel deploy
```
(Peça confirmação antes de rodar `vercel --prod` em produção.)
