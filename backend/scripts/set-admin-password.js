const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { hash } = require('bcryptjs');

function loadEnv(envPath) {
  const values = {};

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    values[key] = value;
  }

  return values;
}

async function main() {
  const [, , emailArg, passwordArg] = process.argv;

  if (!emailArg || !passwordArg) {
    console.error(
      'Uso: npm run admin:set-password -- admin@tuempresa.com MiClaveSegura123',
    );
    process.exit(1);
  }

  const env = loadEnv(path.join(process.cwd(), '.env'));
  const client = new Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl:
      env.DB_SSL_ENABLED === 'true'
        ? {
            rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
          }
        : undefined,
    connectionTimeoutMillis: Number(env.DB_CONNECTION_TIMEOUT_MS || '3000'),
  });

  try {
    await client.connect();
    const passwordHash = await hash(passwordArg, 10);
    const result = await client.query(
      `
        UPDATE landing_core.tb_admin_users
        SET
          password_hash = $2,
          must_change_password = FALSE,
          failed_login_attempts = 0,
          locked_until = NULL,
          updated_at = NOW()
        WHERE email = $1
          AND deleted_at IS NULL
        RETURNING public_id::text AS public_id, email::varchar AS email
      `,
      [emailArg, passwordHash],
    );

    if (result.rowCount === 0) {
      console.error(
        `No se encontro un usuario administrativo activo con el correo ${emailArg}.`,
      );
      process.exit(1);
    }

    console.log(
      `Contrasena actualizada para ${result.rows[0].email} (${result.rows[0].public_id}).`,
    );
  } catch (error) {
    console.error(`Error al actualizar la contrasena: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

void main();
