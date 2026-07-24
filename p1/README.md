# Clone traduzido — "The gates are opening" (awordfromjesus.online)

Clone fiel da página de captura (fila + portão se abrindo) do site
`awordfromjesus.online`, traduzido para português e com todo o
rastreamento de terceiros removido.

⚠️ **O `chat.html` foi trocado para a copy da "Desatadora dos Nós"**
(documento com comentário do Filipe Santana), substituindo a conversa
com "Jesus" que estava aqui antes. Ver seção própria abaixo.

## Estrutura — funil completo em 3 etapas

```
projeto/
├── index.html          ← 1) fila/portão abrindo — AINDA tema "Jesus" (ver aviso)
├── chat.html            ← 2) chat "Nossa Senhora Desatadora dos Nós"
├── live.html             ← 3) live falsa (estilo Facebook), só a simulação (sem ofertas)
├── assets/
│   └── images/
│       ├── favicon.png
│       ├── hostAvatar.png         (avatar pequeno de Jesus, usado no index.html)
│       ├── jesus_welcome.png      (imagem revelada ao final da animação do index.html)
│       ├── czrvynzfjsoh78ztoxultl61.jpg  (foto grande de Jesus que você adicionou)
│       └── hero-desatadora.png    (Nossa Senhora Desatadora dos Nós, usada em chat.html e live.html)
└── README.md
```

`index.html` → `chat.html` (via botão "garantir lugar na fila") →
`live.html` (redirecionamento automático ao fim da conversa).

## ⚠️ Descompasso de tema entre as páginas

`index.html` (a fila + portão abrindo) continua com a persona **Jesus**
("Os portões estão se abrindo", imagem de Jesus revelada no final).
`chat.html` agora é a persona **Nossa Senhora Desatadora dos Nós**. As
duas páginas estão linkadas (index.html manda pra chat.html), mas com
personas diferentes — isso vai confundir quem passar pelo funil. Avisa
se quiser que eu troque o `index.html` pra Desatadora também, ou se
esse `chat.html` vai ser usado solto, sem passar pelo `index.html`.

## O que foi removido (rastreamento, no index.html)

- Construção de cookies `_fbp`/`_fbc` do Facebook Pixel
- Repasse de `fbclid` e parâmetros `utm_*` para a página de chat
- Chamadas para `window.clarity(...)` (Microsoft Clarity)
- Comentário de verificação de domínio do Facebook (`facebook-domain-verification`)

## ⚠️ Placeholders para você preencher

Marcados com `⚠️ PLACEHOLDER` no código:

| Onde | O quê |
|---|---|
| `index.html` `<head>` | Meta tag `facebook-domain-verification` (se for anunciar no Meta Ads) |
| `index.html` `<head>` | Seu Pixel do Meta/Facebook |
| `index.html` `<head>` | Seu script do UTMify (ou outro rastreador de campanha) |
| `index.html` `<head>` | Microsoft Clarity (opcional) |
| `index.html` (bloco de prova social) | Número "12.847 pessoas" — troque por um número real ou remova |
| `live.html` `.video-inner` | Cole seu código de embed da VTurb no espaço marcado "COLE AQUI" (ver seção própria abaixo) |

## Sobre o `chat.html` (Desatadora dos Nós)

HTML/CSS/JS puro, sem depender de Typebot ou conta externa.

**Não usa mais gênero.** A revisão mais recente da copy tirou "minha
filha"/"meu filho" e a variação de "sozinho"/"pronto" — então a lógica
de inferir gênero pelo nome (que tínhamos antes) foi removida do código
também, não é mais necessária. Só `{{nome}}` é substituído dinamicamente
(pelo `firstName` da URL); todo o resto é transcrição literal da copy.

"MINHA RAINHA" é fixo (é o visitante chamando Nossa Senhora de "minha
rainha", título dela — não ela chamando o visitante). "Já pedi ao meu
filho Jesus..." também é fixo — ali "meu filho" é Jesus, não a pessoa no
chat.

```
chat.html?firstName=Maria
chat.html?firstName=Carlos
```

### Pontos em aberto

1. **Redirecionamento final**: ao terminar o roteiro, a página
   redireciona sozinha (sem precisar clicar em botão) pra `./live.html`
   — testado e funcionando.

## Sobre o `live.html` (live falsa estilo Facebook)

Clone traduzido de `yourrequestdontskip.lovable.app/live` — simula uma
transmissão ao vivo do Facebook (visualizações, curtidas e comentários
falsos). **Sem seção de ofertas/depoimentos/FAQ** — a pedido, tirei toda
a parte de "doação"/pagamento. Fica só a simulação: cabeçalho, vídeo,
reações, e o loop de comentários falsos rodando pra sempre (sem timer,
sem revelar nada depois).

**Rastreamento removido** (o HTML puro do original quase não mostrava
nada — o rastreio de verdade só era injetado via JavaScript depois que a
página carregava; tive que abrir o bundle JS pra achar):
- Script da UTMify
- **Pixel do Meta/Facebook** do dono original (`pixelId: "6a0f8be32f65ceffd5705495"`)
- **Pixel do TikTok** do dono original (`tikTokPixelId: "6a4c0e88c99dce671e1288de"`)
- IDs de produto + **afiliado do dono original** (`?aff=nbascaleboy`) que estavam nos botões de oferta originais

**Dark pattern não reproduzido**: o original sequestra o botão voltar do
navegador (redireciona à força pra uma página `/wait`). Deixei de fora —
avisa se quiser mesmo assim.

**Vídeo**: é conteúdo proprietário (IA "Jesus falando") da conta
ConverteAI/VTurb do dono original — não pude copiar. Tem um espaço bem
demarcado em `.video-inner` com `<!-- ▼▼▼ COLE AQUI ▼▼▼ -->` pra você
colar o embed do SEU player. Enquanto isso, uma imagem estática segura o
lugar (pode apagar a div `placeholderFallback` quando colar o vídeo).

Testado de ponta a ponta via Playwright (chat.html → live.html, loop de
comentários contínuo, sem seção de ofertas no DOM) — zero erros.

## Observação sobre o site original (index.html)

O HTML bruto baixado do site já veio com comentários deixados pelo
próprio criador do funil, tipo `<!-- [removido] pixel UTMify do outro
projeto - plugar o SEU aqui -->`. Isso indica que esse funil já era
vendido/reaproveitado como template por afiliados, com "buracos" de
rastreamento para cada comprador plugar o seu. Não é nada malicioso,
só contexto de origem.

## Como testar localmente

Abra `index.html` num navegador (ou sirva a pasta com qualquer servidor
estático, ex: `npx serve .`), ou abra `chat.html` direto com
`?firstName=...&genero=...` na URL pra testar só o chat.
