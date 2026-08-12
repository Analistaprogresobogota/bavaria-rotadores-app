import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from './db.js';
import { conteosRouter } from './routes/conteos.js';
import { historialRouter } from './routes/historial.js';
import { bloqueosRouter } from './routes/bloqueos.js';
import { resultadoMacroRouter } from './routes/resultadoMacro.js';
import { usuariosRouter } from './routes/usuarios.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(',') }));
app.use(express.json({ limit: '10mb' }));

app.get('/salud', async (req, res) => {
  try {
    await pool.query('select 1');
    res.json({ estado: 'ok', base_de_datos: 'conectada' });
  } catch (err) {
    res.status(500).json({ estado: 'error', detalle: err.message });
  }
});

app.use('/conteos', conteosRouter);
app.use('/historial', historialRouter);
app.use('/bloqueos', bloqueosRouter);
app.use('/resultado-macro', resultadoMacroRouter);
app.use('/usuarios', usuariosRouter);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`API de Rotadores escuchando en el puerto ${PORT}`);
});
