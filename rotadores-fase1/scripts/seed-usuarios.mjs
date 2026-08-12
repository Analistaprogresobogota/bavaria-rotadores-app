// Crea las cuentas de prueba de Supervisor/Programador/Admin, y migra los
// Rotadores reales que ya existen en la tabla "rotadores" hacia la nueva
// tabla unificada "usuarios_rotadores" (usando su Codigo como Usuario).
// Se puede correr varias veces: usa upsert por "Usuario".
//
// Uso:
//   SUPABASE_URL=https://tu-proyecto.supabase.co \
//   SUPABASE_ANON_KEY=tu-clave-anon \
//   node scripts/seed-usuarios.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Falta SUPABASE_URL y/o SUPABASE_ANON_KEY en el entorno.');
  process.exit(1);
}
const supabase = createClient(url, key);

const CUENTAS_DEMO = [
  { Nombre: 'Administrador Piloto', Usuario: 'admin', Password: 'admin2026', Rol: 'Admin' },
  { Nombre: 'Supervisor Piloto', Usuario: 'supervisor', Password: 'bavaria2026', Rol: 'Supervisor' },
  { Nombre: 'Programador Piloto', Usuario: 'programador', Password: 'program1234', Rol: 'Programador' },
];

async function seedCuentasDemo() {
  const { error } = await supabase.from('usuarios_rotadores').upsert(CUENTAS_DEMO, { onConflict: 'Usuario' });
  if (error) throw error;
  console.log(`usuarios_rotadores: ${CUENTAS_DEMO.length} cuentas demo listas (admin/supervisor/programador).`);
}

async function migrarRotadores() {
  const { data: rotadores, error: errLeer } = await supabase.from('rotadores').select('*');
  if (errLeer) throw errLeer;
  if (!rotadores?.length) {
    console.log('rotadores: no hay filas que migrar.');
    return;
  }
  const filas = rotadores
    .filter((r) => r.Codigo && r.Password)
    .map((r) => ({
      Nombre: r.Nombre,
      Usuario: r.Codigo,
      Password: r.Password,
      Rol: 'Rotador',
      Activo: r.Activo === 'No' ? 'No' : 'Si',
    }));
  const { error } = await supabase.from('usuarios_rotadores').upsert(filas, { onConflict: 'Usuario' });
  if (error) throw error;
  console.log(`usuarios_rotadores: ${filas.length} rotadores migrados desde la tabla "rotadores" (login = Codigo).`);
}

await seedCuentasDemo();
await migrarRotadores();
console.log('Listo.');
