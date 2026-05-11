// src/controllers/authController.js
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const {
  hashSenha, verificarSenha,
  gerarAccessToken, gerarRefreshToken, verificarAccessToken,
  sanitizar
} = require('../utils/security');
const audit = require('../utils/auditLogger');
const crypto = require('crypto');

const getIP = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

// ── CADASTRO ─────────────────────────────────────────────────────────────────
const cadastrar = async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(422).json({ erros: erros.array() });

  const { nome, email, senha, lgpdAceito } = req.body;

  if (!lgpdAceito) {
    return res.status(422).json({ erro: 'Você deve aceitar os termos de privacidade (LGPD).' });
  }

  try {
    const { rows: existe } = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]
    );
    if (existe.length) {
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    }

    const senhaHash = await hashSenha(senha);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, lgpd_aceito_em, lgpd_ip)
       VALUES ($1, $2, $3, NOW(), $4) RETURNING id, nome, email`,
      [sanitizar(nome), email.toLowerCase(), senhaHash, getIP(req)]
    );

    const usuario = rows[0];
    await audit({
      usuarioId: usuario.id, acao: 'CADASTRO',
      ip: getIP(req), userAgent: req.headers['user-agent']
    });

    const accessToken = gerarAccessToken(usuario.id);
    const { token: refreshToken, hash } = gerarRefreshToken(usuario.id);

    await pool.query(
      `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at, ip_origem)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
      [usuario.id, hash, getIP(req)]
    );

    res.status(201).json({
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Erro no cadastro:', err.code);
    res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(422).json({ erros: erros.array() });

  const { email, senha } = req.body;
  const ip = getIP(req);

  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, senha_hash, ativo, tentativas_login, bloqueado_ate FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    // Timing-safe: sempre compara senha mesmo se usuário não existe
    const hashFalso = '$2a$12$invalidhashfortimingnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    const usuario = rows[0];
    const hashParaComparar = usuario ? usuario.senha_hash : hashFalso;
    const senhaCorreta = await verificarSenha(senha, hashParaComparar);

    if (!usuario || !senhaCorreta || !usuario.ativo) {
      // Incrementa tentativas se usuário existe
      if (usuario) {
        await pool.query(
          `UPDATE usuarios SET
            tentativas_login = tentativas_login + 1,
            bloqueado_ate = CASE WHEN tentativas_login >= 4 THEN NOW() + INTERVAL '30 minutes' ELSE bloqueado_ate END
           WHERE id = $1`,
          [usuario.id]
        );
        await audit({ usuarioId: usuario.id, acao: 'LOGIN_FALHOU', ip, userAgent: req.headers['user-agent'] });
      }
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    // Verifica bloqueio
    if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
      return res.status(429).json({ erro: 'Conta temporariamente bloqueada. Tente mais tarde.' });
    }

    // Reset tentativas
    await pool.query(
      'UPDATE usuarios SET tentativas_login = 0, bloqueado_ate = NULL, ultimo_acesso = NOW() WHERE id = $1',
      [usuario.id]
    );

    const accessToken = gerarAccessToken(usuario.id);
    const { token: refreshToken, hash } = gerarRefreshToken(usuario.id);

    await pool.query(
      `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at, ip_origem)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
      [usuario.id, hash, ip]
    );

    await audit({ usuarioId: usuario.id, acao: 'LOGIN_OK', ip, userAgent: req.headers['user-agent'] });

    res.json({
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Erro no login:', err.code);
    res.status(500).json({ erro: 'Erro interno.' });
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(401).json({ erro: 'Refresh token não fornecido.' });

  try {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const { rows } = await pool.query(
      `SELECT rt.*, u.id as uid, u.nome, u.email, u.ativo
       FROM refresh_tokens rt
       JOIN usuarios u ON u.id = rt.usuario_id
       WHERE rt.token_hash = $1 AND rt.revogado = false AND rt.expires_at > NOW()`,
      [hash]
    );

    if (!rows.length || !rows[0].ativo) {
      return res.status(401).json({ erro: 'Refresh token inválido ou expirado.' });
    }

    const rt = rows[0];

    // Rotação de refresh token (invalidate old, issue new)
    await pool.query('UPDATE refresh_tokens SET revogado = true WHERE id = $1', [rt.id]);

    const novoAccess = gerarAccessToken(rt.uid);
    const { token: novoRefresh, hash: novoHash } = gerarRefreshToken(rt.uid);

    await pool.query(
      `INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at, ip_origem)
       VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
      [rt.uid, novoHash, getIP(req)]
    );

    res.json({ accessToken: novoAccess, refreshToken: novoRefresh });
  } catch (err) {
    res.status(401).json({ erro: 'Erro ao renovar sessão.' });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query('UPDATE refresh_tokens SET revogado = true WHERE token_hash = $1', [hash]);
  }
  await audit({ usuarioId: req.usuario?.id, acao: 'LOGOUT', ip: getIP(req) });
  res.json({ mensagem: 'Sessão encerrada.' });
};

// ── EXCLUIR CONTA (Direito ao Esquecimento - LGPD Art. 18 VI) ─────────────────
const excluirConta = async (req, res) => {
  const { senha } = req.body;
  try {
    const { rows } = await pool.query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
    const valida = await verificarSenha(senha, rows[0].senha_hash);
    if (!valida) return res.status(401).json({ erro: 'Senha incorreta.' });

    // Anonimiza ao invés de deletar para manter integridade do audit_log
    await pool.query(
      `UPDATE usuarios SET
        nome = 'Usuário Removido', email = $1,
        senha_hash = '', ativo = false
       WHERE id = $2`,
      [`removido_${req.usuario.id}@deleted`, req.usuario.id]
    );
    await pool.query('DELETE FROM dividas WHERE usuario_id = $1', [req.usuario.id]);
    await pool.query('UPDATE refresh_tokens SET revogado = true WHERE usuario_id = $1', [req.usuario.id]);

    await audit({ usuarioId: req.usuario.id, acao: 'CONTA_EXCLUIDA', ip: getIP(req) });
    res.json({ mensagem: 'Conta e dados excluídos conforme LGPD Art. 18.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir conta.' });
  }
};

module.exports = { cadastrar, login, refreshToken, logout, excluirConta };
