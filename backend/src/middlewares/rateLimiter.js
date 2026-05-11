// src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Limite geral da API
const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' }
});

// Limite rigoroso para login (anti-brute-force)
const limiterLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // máximo 10 tentativas de login por 15 min por IP
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos.' }
});

// Limite para criação de conta
const limiterCadastro = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { erro: 'Limite de cadastros atingido. Tente em 1 hora.' }
});

module.exports = { limiterGeral, limiterLogin, limiterCadastro };
