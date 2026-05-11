// src/utils/auditLogger.js
// Registro de auditoria exigido pela LGPD (Lei 13.709/2018) Art. 6 e Art. 37
const pool = require('../config/database');

const audit = async ({ usuarioId, acao, tabela, registroId, ip, userAgent, detalhes }) => {
  if (process.env.AUDIT_LOG_ENABLED !== 'true') return;
  try {
    await pool.query(
      `INSERT INTO audit_log (usuario_id, acao, tabela, registro_id, ip, user_agent, detalhes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [usuarioId || null, acao, tabela || null, registroId || null,
       ip || null, userAgent || null, detalhes ? JSON.stringify(detalhes) : null]
    );
  } catch {
    // Nunca deixar falha de log derrubar a aplicação
  }
};

module.exports = audit;
