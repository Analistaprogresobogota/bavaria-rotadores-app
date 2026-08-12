import { useEffect, useMemo, useState } from 'react';
import { useDatos } from '../../hooks/useDatos';
import { calcularResultadoMacro } from '../../logica/macro';
import { SectionTitle } from './SectionTitle';
import { Cargando } from './Cargando';
import { ErrorAviso } from './ErrorAviso';
import { Empty } from './Empty';

const TURNOS = [
  { valor: 'Mañana', icono: '🌅' },
  { valor: 'Tarde', icono: '🌇' },
  { valor: 'Noche', icono: '🌙' },
];

function esMismoDiaLocal(fechaA, fechaB) {
  return (
    fechaA.getFullYear() === fechaB.getFullYear() &&
    fechaA.getMonth() === fechaB.getMonth() &&
    fechaA.getDate() === fechaB.getDate()
  );
}

function formatoHora(fechaISO) {
  if (!fechaISO) return '—';
  return new Date(fechaISO).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Tablero enfocado en monitoreo operativo: que esta haciendo cada Rotador
// ahora mismo, cuanto avanzo cada turno hoy, y un resumen del estado de los
// dos modulos de datos que maneja la app (Conteos y MPRot). No repite lo que
// ya se ve en las pestañas Conteos/Historial/MPRot — es la vista de un
// vistazo para Supervisor/Programador/Admin.
export function TableroResumen() {
  const { cargando, error, obtenerSkus, obtenerConteos, obtenerHistorial } = useDatos();
  const [skus, setSkus] = useState([]);
  const [conteos, setConteos] = useState([]);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    obtenerSkus().then(setSkus).catch(() => {});
    obtenerConteos().then(setConteos).catch(() => {});
    obtenerHistorial().then(setHistorial).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPosiciones = conteos.length;
  const conProducto = useMemo(() => conteos.filter((c) => c.Codigo), [conteos]);

  // MPRot: mismo filtro que la pestaña MPRot (solo posiciones con producto).
  const resultadoMacro = useMemo(() => calcularResultadoMacro(conProducto, skus), [conProducto, skus]);
  const porFamilia = useMemo(() => {
    const conteo = new Map();
    resultadoMacro.forEach((r) => {
      const familia = r._sku?.Familia || 'Sin familia';
      conteo.set(familia, (conteo.get(familia) || 0) + 1);
    });
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  }, [resultadoMacro]);

  const hoy = new Date();
  const revisadasHoy = useMemo(
    () => conteos.filter((c) => c.FechaToma && esMismoDiaLocal(new Date(c.FechaToma), hoy)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conteos]
  );
  const rotadoresActivosHoy = new Set(
    revisadasHoy.filter((c) => c.Rol === 'Rotador').map((c) => c.Usuario)
  ).size;

  const porTurno = TURNOS.map((t) => ({
    ...t,
    revisadas: revisadasHoy.filter((c) => c.Turno === t.valor).length,
  }));

  const actividadReciente = historial.slice(0, 15);

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <SectionTitle
        icono="📊"
        titulo="Tablero"
        sub="Monitoreo de rotadores y resumen de Conteos y MPRot."
      />

      <ErrorAviso mensaje={error} />

      {cargando && totalPosiciones === 0 && <Cargando texto="Cargando…" />}

      {!cargando && totalPosiciones === 0 && (
        <Empty texto="No hay conteos todavía. Cuando un rotador capture datos, aquí aparecerán los indicadores." />
      )}

      {totalPosiciones > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="panel" style={{ padding: 16 }}>
              <div className="texto-sub" style={{ fontSize: 12 }}>POSICIONES CONTADAS</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{conProducto.length}<span className="texto-sub" style={{ fontSize: 16 }}>/{totalPosiciones}</span></div>
            </div>
            <div className="panel" style={{ padding: 16 }}>
              <div className="texto-sub" style={{ fontSize: 12 }}>REVISADAS HOY</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{revisadasHoy.length}</div>
            </div>
            <div className="panel" style={{ padding: 16 }}>
              <div className="texto-sub" style={{ fontSize: 12 }}>ROTADORES ACTIVOS HOY</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{rotadoresActivosHoy}</div>
            </div>
            <div className="panel" style={{ padding: 16 }}>
              <div className="texto-sub" style={{ fontSize: 12 }}>PRODUCTOS EN MPROT</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{resultadoMacro.length}</div>
            </div>
          </div>

          <div className="panel" style={{ padding: 16, display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Avance por turno (hoy)</div>
            {porTurno.map((t) => (
              <div key={t.valor} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 90 }}>{t.icono} {t.valor}</div>
                <div style={{ flex: 1, background: 'var(--panel2)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${totalPosiciones ? Math.min(100, (t.revisadas / totalPosiciones) * 100) : 0}%`,
                      background: 'var(--accent)',
                      height: '100%',
                    }}
                  />
                </div>
                <div style={{ width: 40, textAlign: 'right', fontWeight: 600 }}>{t.revisadas}</div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: 16, display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>MPRot por familia</div>
            {porFamilia.length === 0 ? (
              <div className="texto-sub" style={{ fontSize: 13 }}>Todavía no hay productos en rotación.</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {porFamilia.map(([familia, cantidad]) => (
                  <div key={familia} className="texto-sub" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 999, background: 'var(--panel2)' }}>
                    {familia}: <strong style={{ color: 'var(--texto)' }}>{cantidad}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontWeight: 700 }}>Actividad reciente</div>
            {actividadReciente.length === 0 ? (
              <Empty texto="Todavía no hay actividad registrada." />
            ) : (
              <div className="tabla-envoltorio" style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Usuario</th>
                      <th>Turno</th>
                      <th>Módulo</th>
                      <th>Código</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actividadReciente.map((h) => (
                      <tr key={h.id}>
                        <td>{formatoHora(h.FechaToma)}</td>
                        <td className="texto-sub">{h.Usuario}</td>
                        <td className="texto-sub">{h.Turno || '—'}</td>
                        <td>{h.Modulo}</td>
                        <td className="texto-sub">{h.Codigo || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
