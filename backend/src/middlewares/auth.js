// src/middlewares/auth.js
const { verificarAccessToken } = require('../utils/security');
const pool = require('../config/database');

const autenticar = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const token = header.split(' ')[1];
    const payload = verificarAccessToken(token);

    if (payload.type !== 'access') {
      return res.status(401).json({ erro: 'Token inválido' });
    }

    // Verifica se o usuário ainda existe e está ativo
    const { rows } = await pool.query(
      'SELECT id, nome, email, ativo FROM usuarios WHERE id = $1',
      [payload.sub]
    );

    if (!rows.length || !rows[0].ativo) {
      return res.status(401).json({ erro: 'Usuário inativo ou não encontrado' });
    }

    req.usuario = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado', codigo: 'TOKEN_EXPIRADO' });
    }
    return res.status(401).json({ erro: 'Token inválido' });
  }
};

module.exports = { autenticar };
