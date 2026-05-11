// src/utils/security.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ALGORITHM = 'aes-256-gcm';

// ── HASH DE SENHA ────────────────────────────────────────────────────────────
const hashSenha = async (senha) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hash(senha, rounds);
};

const verificarSenha = async (senha, hash) => {
  return bcrypt.compare(senha, hash);
};

// ── JWT ──────────────────────────────────────────────────────────────────────
const gerarAccessToken = (userId) => {
  return jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m', algorithm: 'HS256' }
  );
};

const gerarRefreshToken = (userId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
};

const verificarAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ── CRIPTOGRAFIA DE DADOS SENSÍVEIS (AES-256-GCM) ───────────────────────────
const getEncKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 64) throw new Error('ENCRYPTION_KEY inválida');
  return Buffer.from(key.slice(0, 64), 'hex');
};

const criptografar = (texto) => {
  if (!texto) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncKey(), iv);
  const enc = Buffer.concat([cipher.update(String(texto), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
};

const descriptografar = (encTxt) => {
  if (!encTxt) return null;
  try {
    const [ivHex, tagHex, encHex] = encTxt.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(encHex, 'hex')),
      decipher.final()
    ]).toString('utf8');
  } catch {
    return null;
  }
};

// ── SANITIZAÇÃO ──────────────────────────────────────────────────────────────
const sanitizar = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

module.exports = {
  hashSenha, verificarSenha,
  gerarAccessToken, gerarRefreshToken, verificarAccessToken,
  criptografar, descriptografar, sanitizar
};
