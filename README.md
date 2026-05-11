# 💳 Gerenciador de Dívidas — Full Stack Seguro

Aplicativo completo para gerenciar suas dívidas e as de quem compra no seu cartão.
**Backend Node.js + PostgreSQL + Frontend HTML puro. 100% LGPD compliant.**

---

## 🚀 COMO RODAR (Passo a Passo)

### 1. Banco de Dados (Supabase — Grátis)

1. Acesse https://supabase.com → Criar conta grátis
2. Novo projeto → anote a **DATABASE_URL** (Settings > Database > Connection string > URI)
3. Copie a URL no formato: `postgresql://postgres:[SENHA]@db.[ID].supabase.co:5432/postgres`

### 2. Backend

```bash
cd backend
npm install

# Copie o arquivo de configuração
cp .env.example .env

# Edite o .env com seus dados reais:
# - DATABASE_URL (do Supabase)
# - JWT_SECRET (gere com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - JWT_REFRESH_SECRET (gere outro diferente do acima)
# - ENCRYPTION_KEY (gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Criar tabelas no banco
npm run migrate

# Iniciar servidor
npm run dev
```

Servidor rodando em: http://localhost:3001

### 3. Frontend

Abra o arquivo `frontend/index.html` no navegador.
**Ou** use o Live Server do VS Code para servir na porta 5500.

> ⚠️ Certifique-se que `FRONTEND_URL=http://localhost:5500` no seu `.env` do backend.

---

## 🌐 DEPLOY (Para acessar pelo celular / WhatsApp)

### Backend → Railway.app (Grátis)

1. https://railway.app → Criar conta
2. "New Project" → "Deploy from GitHub" (suba o código lá)
3. Adicione as variáveis de ambiente no painel do Railway
4. Railway te dá uma URL tipo: `https://seu-app.railway.app`

### Frontend → Netlify Drop (Grátis, 30 segundos)

1. https://app.netlify.com/drop
2. Arraste a pasta `frontend/` para a página
3. Netlify te dá uma URL tipo: `https://nome-aleatorio.netlify.app`
4. No arquivo `frontend/index.html`, troque `http://localhost:3001/api` pela URL do Railway

### Depois do deploy:
- Salve o link do Netlify como favorito no WhatsApp
- Adicione à tela inicial do celular = funciona como app

---

## 🔒 ANÁLISE DE SEGURANÇA COMPLETA

### ✅ Autenticação e Sessões
| Proteção | Status | Implementação |
|----------|--------|---------------|
| Senha criptografada | ✅ | bcrypt custo 12 |
| JWT de curta duração | ✅ | Access token: 15 min |
| Refresh token rotativo | ✅ | Troca a cada uso, expira em 7 dias |
| Bloqueio por tentativas | ✅ | 5 tentativas → bloqueio 30 min |
| Timing-safe login | ✅ | Sempre compara hash (anti-enumeração) |

### ✅ Proteção de Dados
| Proteção | Status | Implementação |
|----------|--------|---------------|
| Criptografia em repouso | ✅ | AES-256-GCM para dados sensíveis |
| HTTPS obrigatório | ✅ | Configurado no Helmet HSTS |
| Payload limitado | ✅ | 50KB máximo por requisição |
| SQL Injection | ✅ | Queries parametrizadas (pg lib) |
| XSS | ✅ | Helmet CSP + sanitização de inputs |
| CSRF | ✅ | Token JWT no header (não cookie) |

### ✅ Proteção de Rede
| Proteção | Status | Implementação |
|----------|--------|---------------|
| Rate limiting global | ✅ | 100 req/15min por IP |
| Rate limiting login | ✅ | 10 tentativas/15min por IP |
| Rate limiting cadastro | ✅ | 5 cadastros/hora por IP |
| CORS restrito | ✅ | Só origens explicitamente permitidas |
| Headers seguros | ✅ | Helmet.js (15+ headers configurados) |

### ✅ Isolamento de Dados
| Proteção | Status | Implementação |
|----------|--------|---------------|
| Row Level Security | ✅ | PostgreSQL RLS ativado |
| Verificação dupla | ✅ | WHERE usuario_id = $userId em toda query |
| Audit log | ✅ | Todas as ações gravadas com IP e timestamp |

---

## ⚖️ ANÁLISE LGPD (Lei 13.709/2018)

### Artigos atendidos:

**Art. 5 — Definições**
- ✅ Dados pessoais identificados: nome, e-mail
- ✅ Dados pessoais tratados com finalidade específica (gestão de dívidas pessoais)

**Art. 6 — Princípios**
- ✅ Finalidade: uso exclusivo para gerenciar dívidas
- ✅ Necessidade: coletamos apenas o mínimo necessário
- ✅ Transparência: política de privacidade exibida no app
- ✅ Segurança: criptografia + controles de acesso documentados
- ✅ Não discriminação: dados não usados para decisões automatizadas

**Art. 7 — Bases legais**
- ✅ Consentimento explícito coletado no cadastro (checkbox LGPD)
- ✅ IP e data do consentimento gravados no banco

**Art. 9 — Transparência**
- ✅ Política de privacidade acessível dentro do app
- ✅ Finalidade declarada, dados coletados listados

**Art. 18 — Direitos do titular**
- ✅ Acesso: usuário vê todos os próprios dados
- ✅ Correção: PUT /api/dividas/:id
- ✅ Exclusão: DELETE /api/auth/conta (anonimiza + apaga dívidas)
- ✅ Portabilidade: pode exportar JSON
- ✅ Revogação: logout revoga todos os tokens

**Art. 37 — Registros de operações**
- ✅ Audit log com todas as ações, IP, user-agent, timestamp
- ✅ Log imutável mesmo após exclusão da conta

### ⚠️ O que você deve fazer se tiver outros usuários:
1. Nomear um **DPO** (Encarregado de Proteção de Dados)
2. Criar um e-mail de contato para solicitações LGPD
3. Registrar o app na ANPD se tratar dados de terceiros em escala
4. Contratar HTTPS (Let's Encrypt é grátis via Railway/Netlify)

---

## 📁 Estrutura do Projeto

```
dividas-app/
├── backend/
│   ├── server.js              ← Entrada principal
│   ├── .env.example           ← Template de configuração
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── database.js    ← Pool PostgreSQL
│       │   └── migrate.js     ← Cria tabelas
│       ├── controllers/
│       │   ├── authController.js    ← Login, cadastro, logout
│       │   └── dividasController.js ← CRUD de dívidas
│       ├── middlewares/
│       │   ├── auth.js        ← Verificação JWT
│       │   └── rateLimiter.js ← Anti-brute-force
│       ├── routes/
│       │   ├── auth.js        ← POST /api/auth/*
│       │   └── dividas.js     ← GET/POST/PUT/DELETE /api/dividas
│       └── utils/
│           ├── security.js    ← bcrypt, JWT, AES-256
│           └── auditLogger.js ← Log LGPD
└── frontend/
    └── index.html             ← App completo (HTML + CSS + JS)
```

---

## 🛠️ Endpoints da API

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/cadastro | Criar conta |
| POST | /api/auth/login | Entrar |
| POST | /api/auth/refresh | Renovar token |
| POST | /api/auth/logout | Sair |
| DELETE | /api/auth/conta | Excluir conta (LGPD) |

### Dívidas (requerem autenticação)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/dividas | Listar dívidas |
| GET | /api/dividas/resumo | Totais e estatísticas |
| POST | /api/dividas | Criar dívida |
| PUT | /api/dividas/:id | Atualizar / marcar pago |
| DELETE | /api/dividas/:id | Excluir dívida |
