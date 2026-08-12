import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Azure Database for PostgreSQL exige SSL. "rejectUnauthorized: false" evita
// tener que instalar el certificado raiz de Azure a mano — suficiente para
// el piloto; si Tecnologia quiere validacion estricta de certificado, aqui
// se puede pasar { ca: <contenido del .pem de Azure> } en su lugar.
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 8000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres:', err);
});
