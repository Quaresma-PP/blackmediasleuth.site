// src/controllers/dividasController.js
const { validationResult } = require('express-validator');
const pool = require('../config/database');
const { sanitizar } = require('../utils/security');
const audit = require('../utils/auditLogger');

const getIP = (req) => req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

// ── LISTAR TODAS ──────────────────────────────────────────────────────────────
const listar = async (req, res) => {
  const { tipo, status, pessoa } = req.query;
  try {
    let query = `
      SELECT id, tipo, pessoa_nome, descricao, valor, parcelas, valor_parcela,
             data_compra, data_vencimento, observacao, status, pago_em, created_at
      FROM dividas
      WHERE usuario_id = $1
    `;
    const params = [req.usuario.id];
    let idx = 2;

    if (tipo && ['minha', 'terceiro'].includes(tipo)) {
      query += ` AND tipo = $${idx++}`;
      params.push(tipo);
    }
    if (status && ['pendente','pago','cancelado'].includes(status)) {
      query += ` AND status = $${idx++}`;
      params.push(status);
    }
    if (pessoa) {
      query += ` AND pessoa_nome ILIKE $${idx++}`;
      params.push(`%${sanitizar(pessoa)}%`);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json({ dividas: rows });
  } catch (err) {
    console.error('Erro ao listar:', err.code);
    res.status(500).json({ erro: 'Erro ao buscar dívidas.' });
  }
};

// ── CRIAR ─────────────────────────────────────────────────────────────────────
const criar = async (req, res) => {
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(422).json({ erros: erros.array() });

  const { tipo, descricao, valor, parcelas, parcelasJaPagas, dataCompra, dataVencimento, observacao } = req.body;
  const pessoaNome = req.body.pessoaNome;

  if (tipo === 'terceiro' && !pessoaNome?.trim()) {
    return res.status(422).json({ erro: 'Nome da pessoa é obrigatório para dívidas de terceiros.' });
  }

  try {
    const parc = parseInt(parcelas) || 1;
    const val = parseFloat(valor);
    const jasPagas = Math.max(0, Math.min(parseInt(parcelasJaPagas) || 0, parc - 1));
    const statusInicial = jasPagas >= parc ? 'pago' : 'pendente';
    const { rows } = await pool.query(
      `INSERT INTO dividas
        (usuario_id, tipo, pessoa_nome, descricao, valor, parcelas, parcelas_pagas, valor_parcela,
         data_compra, data_vencimento, observacao, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        req.usuario.id,
        tipo,
        tipo === 'terceiro' ? sanitizar(pessoaNome) : null,
        sanitizar(descricao),
        val,
        parc,
        jasPagas,
        +(val / parc).toFixed(2),
        dataCompra || null,
        dataVencimento || null,
        observacao ? sanitizar(observacao) : null,
        statusInicial
      ]
    );

    await audit({
      usuarioId: req.usuario.id, acao: 'DIVIDA_CRIADA',
      tabela: 'dividas', registroId: rows[0].id, ip: getIP(req)
    });

    res.status(201).json({ divida: rows[0] });
  } catch (err) {
    console.error('Erro ao criar dívida:', err.code);
    res.status(500).json({ erro: 'Erro ao salvar dívida.' });
  }
};

// ── ATUALIZAR ─────────────────────────────────────────────────────────────────
const atualizar = async (req, res) => {
  const { id } = req.params;
  const erros = validationResult(req);
  if (!erros.isEmpty()) return res.status(422).json({ erros: erros.array() });

  try {
    // Garante que a dívida pertence ao usuário (sem RLS, dupla verificação)
    const { rows: check } = await pool.query(
      'SELECT id FROM dividas WHERE id = $1 AND usuario_id = $2', [id, req.usuario.id]
    );
    if (!check.length) return res.status(404).json({ erro: 'Dívida não encontrada.' });

    const { descricao, valor, parcelas, parcelasJaPagas, dataVencimento, observacao, status, pessoaNome } = req.body;
    const parc = parseInt(parcelas) || 1;
    const val = parseFloat(valor);

    // Se veio parcelasJaPagas, recalcula status automaticamente
    let novoStatus = status || null;
    let novasPagas = parcelasJaPagas !== undefined ? parseInt(parcelasJaPagas) : null;
    if (novasPagas !== null) {
      const { rows: cur } = await pool.query('SELECT parcelas FROM dividas WHERE id = $1', [id]);
      const totalParc = parc || parseInt(cur[0]?.parcelas) || 1;
      novasPagas = Math.max(0, Math.min(novasPagas, totalParc));
      if (novasPagas >= totalParc) novoStatus = 'pago';
      else if (novoStatus === 'pago') novoStatus = 'pendente';
    }

    const { rows } = await pool.query(
      `UPDATE dividas SET
        descricao = COALESCE($1, descricao),
        valor = COALESCE($2, valor),
        parcelas = COALESCE($3, parcelas),
        valor_parcela = COALESCE($4, valor_parcela),
        data_vencimento = COALESCE($5, data_vencimento),
        observacao = $6,
        status = COALESCE($7, status),
        pessoa_nome = COALESCE($8, pessoa_nome),
        parcelas_pagas = COALESCE($9, parcelas_pagas),
        pago_em = CASE WHEN COALESCE($7, status) = 'pago' AND status != 'pago' THEN NOW() ELSE pago_em END,
        updated_at = NOW()
       WHERE id = $10 AND usuario_id = $11
       RETURNING *`,
      [
        descricao ? sanitizar(descricao) : null,
        val || null,
        parc || null,
        val && parc ? +(val / parc).toFixed(2) : null,
        dataVencimento || null,
        observacao !== undefined ? sanitizar(observacao) : undefined,
        novoStatus,
        pessoaNome ? sanitizar(pessoaNome) : null,
        novasPagas,
        id, req.usuario.id
      ]
    );

    await audit({ usuarioId: req.usuario.id, acao: 'DIVIDA_ATUALIZADA', tabela: 'dividas', registroId: id, ip: getIP(req) });
    res.json({ divida: rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar:', err.code);
    res.status(500).json({ erro: 'Erro ao atualizar dívida.' });
  }
};

// ── PAGAR PARCELA ─────────────────────────────────────────────────────────────
const pagarParcela = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: check } = await pool.query(
      'SELECT id, parcelas, parcelas_pagas, status FROM dividas WHERE id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    );
    if (!check.length) return res.status(404).json({ erro: 'Dívida não encontrada.' });

    const d = check[0];
    if (d.status === 'pago') return res.status(400).json({ erro: 'Dívida já está totalmente paga.' });

    const novasPagas = Math.min(parseInt(d.parcelas_pagas) + 1, parseInt(d.parcelas));
    const novoStatus = novasPagas >= parseInt(d.parcelas) ? 'pago' : d.status;
    const pagoEm = novoStatus === 'pago' ? 'NOW()' : 'pago_em';

    const { rows } = await pool.query(
      `UPDATE dividas SET
        parcelas_pagas = $1,
        status = $2,
        pago_em = CASE WHEN $2 = 'pago' THEN NOW() ELSE pago_em END,
        updated_at = NOW()
       WHERE id = $3 AND usuario_id = $4
       RETURNING *`,
      [novasPagas, novoStatus, id, req.usuario.id]
    );

    await audit({ usuarioId: req.usuario.id, acao: 'PARCELA_PAGA', tabela: 'dividas', registroId: id, ip: getIP(req) });
    res.json({ divida: rows[0] });
  } catch (err) {
    console.error('Erro ao pagar parcela:', err.code);
    res.status(500).json({ erro: 'Erro ao registrar parcela.' });
  }
};

// ── EXCLUIR ───────────────────────────────────────────────────────────────────
const excluir = async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM dividas WHERE id = $1 AND usuario_id = $2', [id, req.usuario.id]
    );
    if (!rowCount) return res.status(404).json({ erro: 'Dívida não encontrada.' });

    await audit({ usuarioId: req.usuario.id, acao: 'DIVIDA_EXCLUIDA', tabela: 'dividas', registroId: id, ip: getIP(req) });
    res.json({ mensagem: 'Dívida excluída.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir.' });
  }
};

// ── RESUMO ────────────────────────────────────────────────────────────────────
const resumo = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes,
        COUNT(*) FILTER (WHERE status = 'pago') AS pagas,
        COUNT(*) FILTER (WHERE tipo = 'terceiro' AND status = 'pendente') AS terceiros_pendentes,
        COALESCE(SUM(valor) FILTER (WHERE status = 'pendente'), 0) AS total_pendente,
        COALESCE(SUM(valor) FILTER (WHERE status = 'pago'), 0) AS total_pago,
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'terceiro' AND status = 'pendente'), 0) AS total_terceiros
       FROM dividas WHERE usuario_id = $1`,
      [req.usuario.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar resumo.' });
  }
};

module.exports = { listar, criar, atualizar, excluir, resumo, pagarParcela };
