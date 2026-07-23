# Clone traduzido — "The gates are opening" (awordfromjesus.online)

Clone fiel da página de captura (fila + portão se abrindo) do site
`awordfromjesus.online`, traduzido para português e com todo o
rastreamento de terceiros removido.

⚠️ **O `chat.html` foi trocado para a copy da "Desatadora dos Nós"**
(documento com comentário do Filipe Santana), substituindo a conversa
com "Jesus" que estava aqui antes. Ver seção própria abaixo.

## Estrutura

```
projeto/
├── index.html          ← página de captura (fila/portão) — AINDA tema "Jesus" (ver aviso)
├── chat.html            ← chat "Nossa Senhora Desatadora dos Nós"
├── assets/
│   └── images/
│       ├── favicon.png
│       ├── hostAvatar.png         (avatar pequeno de Jesus, usado no index.html)
│       ├── jesus_welcome.png      (imagem revelada ao final da animação do index.html)
│       ├── czrvynzfjsoh78ztoxultl61.jpg  (foto grande de Jesus que você adicionou)
│       └── hero-desatadora.png    (foto de Nossa Senhora Desatadora dos Nós, usada no chat.html)
└── README.md
```

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
| `chat.html` | `URL_DA_VSL` — link real da sua live/VSL/oferta (hoje aponta pra `#`) |

## Sobre o `chat.html` (Desatadora dos Nós)

HTML/CSS/JS puro, sem depender de Typebot ou conta externa.

**Detecção de gênero em 3 níveis** (do mais pro menos confiável):

1. `?genero=f` ou `?genero=m` na URL, se vier pronto
2. Inferência automática pelo **primeiro nome** — lista de nomes comuns
   no Brasil + regra de terminação (-a → feminino, -o → masculino) +
   lista de exceções (ex: "Raquel" é feminino mesmo terminando em
   consoante)
3. Só se as duas anteriores falharem (nome ambíguo, tipo "Alex"), o chat
   pergunta ("SOU MULHER" / "SOU HOMEM") antes de começar

Ou seja: como o `index.html` já pede o nome, a esmagadora maioria das
pessoas **não vê pergunta nenhuma** — o chat já identifica sozinho. Só
nomes fora da lista e sem terminação clara caem na pergunta, como rede
de segurança.

A partir do gênero resolvido (de qualquer uma das 3 formas), o chat usa
"minha filha"/"meu filho", "sozinha"/"sozinho", "pronta"/"pronto" — com
a concordância certa (bloco "minha amada filha" / "meu amado filho",
não palavra trocada isolada). "MINHA RAINHA" fica igual pros dois
gêneros (é o visitante chamando Nossa Senhora, não o contrário).

```
chat.html?firstName=Maria           ← infere "f" pela lista, não pergunta
chat.html?firstName=Carlos          ← infere "m" pela lista, não pergunta
chat.html?firstName=Alex            ← nome ambíguo, pergunta dentro do chat
chat.html?firstName=Joao&genero=m   ← genero explícito na URL, ignora inferência
```

### Pontos em aberto

1. **Redirecionamento final**: ao terminar o roteiro, a página
   redireciona sozinha (sem precisar clicar em botão) pra `URL_DA_VSL`
   — hoje só um placeholder `#`.

Nota: o botão "EU QUERO TE OUVIR, MINHA RAINHA" fica igual pra homem e
mulher — é o visitante chamando Nossa Senhora de "minha rainha" (título
dela), não ela chamando o visitante, então não varia por gênero.

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
