// Sube los datos semilla reales (Conteos actuales, Rotadores) a las tablas
// de Supabase. Skus y Modulos NO se suben: esos quedan embebidos en la app
// (son datos maestros que casi no cambian, ver src/datos/skusDemo.js y
// modulosDemo.js) — solo lo que cambia todo el tiempo vive en la base online.
// Uso: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/seed-supabase.mjs
import { CONTEOS_ACTUALES_DEMO } from '../src/datos/conteosActualesDemo.js';
import { ROTADORES_DEMO_INICIALES } from '../src/datos/datosDemo.js';

const URL_BASE = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!URL_BASE || !ANON_KEY) {
  console.error('Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el entorno.');
  process.exit(1);
}

async function subirLote(tabla, filas) {
  const res = await fetch(`${URL_BASE}/rest/v1/${tabla}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(filas),
  });
  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`${tabla}: ${res.status} ${texto}`);
  }
}

async function subirEnLotes(tabla, filas, tamano = 250) {
  let subidas = 0;
  for (let i = 0; i < filas.length; i += tamano) {
    const lote = filas.slice(i, i + tamano);
    await subirLote(tabla, lote);
    subidas += lote.length;
    process.stdout.write(`\r${tabla}: ${subidas}/${filas.length}`);
  }
  console.log('');
}

async function main() {
  await subirEnLotes('conteos', CONTEOS_ACTUALES_DEMO);
  await subirEnLotes('rotadores', ROTADORES_DEMO_INICIALES);
  console.log('Listo: todos los datos semilla quedaron en Supabase.');
}

main().catch((err) => {
  console.error('\nError subiendo datos:', err.message);
  process.exit(1);
});
