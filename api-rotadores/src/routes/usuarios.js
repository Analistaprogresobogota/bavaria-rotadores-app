import { Router } from 'express';
import { pool, tabla } from '../db.js';

export const usuariosRouter = Router();

const USUARIOS = tabla('usuarios_rotadores');

const COLUMNAS = ['Nombre', 'Usuario', 'Password', 'Rol', 'Activo'];

// Nunca se devuelve la contraseña al cliente — ni en login, ni en listados,
// ni al crear/editar un usuario.
const sinPassword = (fila) => {
  if (!fila) return fila;
  const { Password, ...resto } = fila;
  return resto;
};

// GET /usuarios — todas las cuentas (Rotador, Supervisor, Programador, Admin).
usuariosRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`select * from ${USUARIOS} order by "Nombre"`);
    res.json(rows.map(sinPassword));
  } catch (err) {
    console.error('GET /usuarios', err);
    res.status(500).json({ error: 'No se pudo consultar usuarios.' });
  }
});

// POST /usuarios/login — valida usuario/contraseña del lado del servidor
// (a diferencia de Supabase, aqui NO se manda la lista completa de
// contraseñas al dispositivo).
usuariosRouter.post('/login', async (req, res) => {
  const { usuario, password } = req.body || {};
  if (!usuario || !password) return res.status(400).json({ error: 'Falta usuario o password.' });
  try {
    const { rows } = await pool.query(
      `select * from ${USUARIOS} where lower("Usuario") = lower($1) and "Activo" = 'Si'`,
      [String(usuario).trim()]
    );
    const encontrado = rows.find((u) => u.Password === password);
    res.json(sinPassword(encontrado) || null);
  } catch (err) {
    console.error('POST /usuarios/login', err);
    res.status(500).json({ error: 'No se pudo validar el usuario.' });
  }
});

// POST /usuarios — crea una cuenta nueva.
usuariosRouter.post('/', async (req, res) => {
  try {
    const columnas = COLUMNAS.filter((c) => req.body[c] !== undefined);
    if (columnas.length === 0) return res.status(400).json({ error: 'No se envio ningun dato.' });
    const valores = columnas.map((c) => req.body[c]);
    const nombres = columnas.map((c) => `"${c}"`).join(', ');
    const marcadores = columnas.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `insert into ${USUARIOS} (${nombres}) values (${marcadores}) returning *`,
      valores
    );
    res.status(201).json(sinPassword(rows[0]));
  } catch (err) {
    console.error('POST /usuarios', err);
    res.status(500).json({ error: 'No se pudo crear el usuario (¿el usuario ya existe?).' });
  }
});

// PATCH /usuarios/:id — cambia rol, estado activo, etc.
usuariosRouter.patch('/:id', async (req, res) => {
  try {
    const columnas = COLUMNAS.filter((c) => req.body[c] !== undefined);
    if (columnas.length === 0) return res.status(400).json({ error: 'No se envio ningun dato.' });
    const asignaciones = columnas.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
    const valores = columnas.map((c) => req.body[c]);
    const { rows } = await pool.query(
      `update ${USUARIOS} set ${asignaciones} where id = $${columnas.length + 1} returning *`,
      [...valores, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No existe ese usuario.' });
    res.json(sinPassword(rows[0]));
  } catch (err) {
    console.error('PATCH /usuarios/:id', err);
    res.status(500).json({ error: 'No se pudo actualizar el usuario.' });
  }
});
