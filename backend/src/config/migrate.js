// src/config/migrate.js
// Cria todas as tabelas no PostgreSQL com segurança e auditoria LGPD

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── USUÁRIOS ──────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        senha_hash    VARCHAR(255) NOT NULL,
        ativo         BOOLEAN DEFAULT true,
        email_verificado BOOLEAN DEFAULT false,
        tentativas_login INTEGER DEFAULT 0,
        bloqueado_ate TIMESTAMPTZ,
        ultimo_acesso TIMESTAMPTZ,
        lgpd_aceito_em TIMESTAMPTZ,
        lgpd_ip       VARCHAR(45),
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── REFRESH TOKENS ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) NOT NULL UNIQUE,
        expires_at  TIMESTAMPTZ NOT NULL,
        revogado    BOOLEAN DEFAULT false,
        ip_origem   VARCHAR(45),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── DÍVIDAS ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS dividas (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('minha', 'terceiro')),
        pessoa_nome     VARCHAR(100),
        descricao       VARCHAR(300) NOT NULL,
        valor           NUMERIC(12,2) NOT NULL CHECK (valor > 0),
        parcelas        INTEGER DEFAULT 1 CHECK (parcelas >= 1 AND parcelas <= 360),
        valor_parcela   NUMERIC(12,2),
        data_compra     DATE,
        data_vencimento DATE,
        observacao      VARCHAR(500),
        status          VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
        pago_em         TIMESTAMPTZ,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── LOG DE AUDITORIA (LGPD Art. 6) ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id  UUID REFERENCES usuarios(id) ON DELETE SET NULL,
        acao        VARCHAR(100) NOT NULL,
        tabela      VARCHAR(50),
        registro_id UUID,
        ip          VARCHAR(45),
        user_agent  TEXT,
        detalhes    JSONB,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── ÍNDICES DE PERFORMANCE ────────────────────────────────────────────
    // Adiciona coluna parcelas_pagas se ainda não existir
    await client.query(`ALTER TABLE dividas ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER DEFAULT 0;`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_dividas_usuario ON dividas(usuario_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_dividas_status ON dividas(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_dividas_vencimento ON dividas(data_vencimento);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_refresh_usuario ON refresh_tokens(usuario_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);`);

    // ── ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────
    await client.query(`ALTER TABLE dividas ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'dividas' AND policyname = 'dividas_isolation'
        ) THEN
          CREATE POLICY dividas_isolation ON dividas
            USING (usuario_id = current_setting('app.current_user_id', true)::UUID);
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('✅ Migração concluída com sucesso!');
    console.log('📋 Tabelas criadas: usuarios, refresh_tokens, dividas, audit_log');
    console.log('🔒 RLS ativado na tabela dividas');
    console.log('📊 Índices criados para performance');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();