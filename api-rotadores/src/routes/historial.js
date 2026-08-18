import { Router } from 'express';
import { pool, tabla } from '../db.js';
import { cambios } from '../eventos.js';

export const historialRouter = Router();

const HISTORIAL = tabla('historial');

// GET /historial/eventos — SSE, igual que en conteos.js. Va antes de las
// demas rutas para que no choque con ningun otro parametro.
historialRouter.get('/eventos', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  const avisar = () => res.write('data: cambio\n\n');
  cambios.on('historial', avisar);
  const latido = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => {
    clearInterval(latido);
    cambios.off('historial', avisar);
  });
});

const COLUMNAS = [
  'Orden', 'Modulo', 'Codigo', 'Estibas', 'Cajas', 'Unidades',
  'FechaVencimiento', 'Estatus', 'Observaciones', 'Bloquear',
  'Usuario', 'Rol', 'Turno', 'FechaToma', 'Sede',
];

// GET /historial — log completo, mas reciente primero. Nunca se edita ni
// se borra (append-only), por eso no hay PATCH ni DELETE aqui.
historialRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`select * from ${HISTORIAL} order by "FechaToma" desc`);
    res.json(rows);
  } catch (err) {
    console.error('GET /historial', err);
    res.status(500).json({ error: 'No se pudo consultar historial.' });
  }
});

// POST /historial — agrega una fila nueva (una por cada vez que se guarda un conteo).
historialRouter.post('/', async (req, res) => {
  try {
    const columnas = COLUMNAS.filter((c) => req.body[c] !== undefined);
    if (columnas.length === 0) return res.status(400).json({ error: 'No se envio ningun dato.' });
    const valores = columnas.map((c) => req.body[c]);
    const nombres = columnas.map((c) => `"${c}"`).join(', ');
    const marcadores = columnas.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(`insert into ${HISTORIAL} (${nombres}) values (${marcadores}) returning *`, valores);
    res.status(201).json(rows[0]);
    cambios.emit('historial');
  } catch (err) {
    console.error('POST /historial', err);
    res.status(500).json({ error: 'No se pudo crear la fila de historial.' });
  }
});
