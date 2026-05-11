// server.js — Servidor principal
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { limiterGeral } = require('./src/middlewares/rateLimiter');

const app = express();

// ── SEGURANÇA — HEADERS HTTP ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const origensPermitidas = (process.env.FRONTEND_URL || 'http://localhost:5500').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origensPermitidas.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origem não permitida'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── PARSING ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' })); // limita payload
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ── RATE LIMITER GLOBAL ───────────────────────────────────────────────────────
app.use('/api/', limiterGeral);

// ── LOGS (sem dados sensíveis) ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  morgan.token('id', (req) => req.usuario?.id || 'anon');
  app.use(morgan(':method :url :status :response-time ms - user::id'));
}

// ── ROTAS ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./src/routes/auth'));
app.use('/api/dividas', require('./src/routes/dividas'));

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ── ROTA NÃO ENCONTRADA ───────────────────────────────────────────────────────
app.use((_, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// ── HANDLER DE ERROS GLOBAL ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Nunca expõe stack trace em produção
  console.error('Erro não tratado:', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`🔒 CORS permitido para: ${origensPermitidas.join(', ')}`);
});
