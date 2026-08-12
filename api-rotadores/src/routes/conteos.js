import { Router } from 'express';
import { pool } from '../db.js';
import { cambios } from '../eventos.js';

export const conteosRouter = Router();

const COLUMNAS = [
  'Orden', 'Modulo', 'Codigo', 'Estibas', 'Cajas', 'Unidades',
  'FechaVencimiento', 'Estatus', 'Observaciones', 'Bloquear',
  'Usuario', 'Rol', 'Turno', 'FechaToma', 'Sede',
];

// GET /conteos/eventos — Server-Sent Events, reemplaza el tiempo real de
// Supabase para esta tabla. Va antes de "/:id" para que no choque la ruta.
conteosRouter.get('/eventos', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  const avisar = () => res.write('data: cambio\n\n');
  cambios.on('conteos', avisar);
  const latido = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(latido);
    cambios.off('conteos', avisar);
  });
});

// GET /conteos — estado actual de todas las posiciones.
conteosRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from conteos');
    res.json(rows);
  } catch (err) {
    console.error('GET /conteos', err);
    res.status(500).json({ error: 'No se pudo consultar conteos.' });
  }
});

// POST /conteos — crea un conteo nuevo para una posicion.
conteosRouter.post('/', async (req, res) => {
  try {
    const columnas = COLUMNAS.filter((c) => req.body[c] !== undefined);
    if (columnas.length === 0) return res.status(400).json({ error: 'No se envio ningun dato.' });
    const valores = columnas.map((c) => req.body[c]);
    const nombres = columnas.map((c) => `"${c}"`).join(', ');
    const marcadores = columnas.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(`insert into conteos (${nombres}) values (${marcadores}) returning *`, valores);
    res.status(201).json(rows[0]);
    cambios.emit('conteos');
  } catch (err) {
    console.error('POST /conteos', err);
    res.status(500).json({ error: 'No se pudo crear el conteo.' });
  }
});

// PATCH /conteos/:id — edita un conteo existente (confirmar/editar posicion).
conteosRouter.patch('/:id', async (req, res) => {
  try {
    const columnas = COLUMNAS.filter((c) => req.body[c] !== undefined);
    if (columnas.length === 0) return res.status(400).json({ error: 'No se envio ningun dato.' });
    const asignaciones = columnas.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
    const valores = columnas.map((c) => req.body[c]);
    const { rows } = await pool.query(
      `update conteos set ${asignaciones} where id = $${columnas.length + 1} returning *`,
      [...valores, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No existe ese conteo.' });
    res.json(rows[0]);
    cambios.emit('conteos');
  } catch (err) {
    console.error('PATCH /conteos/:id', err);
    res.status(500).json({ error: 'No se pudo actualizar el conteo.' });
  }
});
