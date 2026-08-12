import { useEffect, useState } from 'react';
import { useDatos } from '../../hooks/useDatos';
import { formatoFechaLegible } from '../../utilidades/fechas';
import { calcularIndicadores } from '../../logica/macro';
import { descargarExcel } from '../../utilidades/exportarExcel';
import { SectionTitle } from '../comunes/SectionTitle';
import { Cargando } from '../comunes/Cargando';
import { ErrorAviso } from '../comunes/ErrorAviso';
import { TablaCruda } from '../comunes/TablaCruda';
import { TableroResumen } from '../comunes/TableroResumen';

const PESTANAS = ['Tablero', 'Historial'];

export function VistaSupervisor() {
  const { cargando, error, obtenerSkus, obtenerHistorial } = useDatos();
  const [skus, setSkus] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [pestana, setPestana] = useState('Tablero');

  useEffect(() => {
    obtenerSkus().then(setSkus).catch(() => {});
    obtenerHistorial().then(setHistorial).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filasParaExcel() {
    return historial.map((f) => {
      const sku = skus.find((s) => s.Codigo === f.Codigo) || null;
      const calc = calcularIndicadores(f, sku);
      return {
        Modulo: f.Modulo,
        Codigo: f.Codigo,
        Descripcion: sku?.Descripcion || '',
        Estibas: f.Estibas,
        Cajas: f.Cajas,
        Unidades: f.Unidades,
        'Fecha de vencimiento': f.FechaVencimiento ? formatoFechaLegible(f.FechaVencimiento) : '',
        'Dias para vencer': calc?.diasParaVencer ?? '',
        Observaciones: f.Observaciones || '',
        Estatus: f.Estatus || '',
        'Total cajas': calc?.totalCajas ?? '',
        Bloquear: f.Bloquear === 'Bloquear' ? 'Bloqueado' : 'No',
        Usuario: f.Usuario,
        Rol: f.Rol,
        Turno: f.Turno || '',
        'Fecha de toma': f.FechaToma ? new Date(f.FechaToma).toLocaleString('es-CO') : '',
        Sede: f.Sede,
      };
    });
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {PESTANAS.map((p) => (
          <button
            key={p}
            className={`boton-filtro${pestana === p ? ' activo' : ''}`}
            onClick={() => setPestana(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {pestana === 'Tablero' && <TableroResumen />}

      {pestana === 'Historial' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionTitle icono="🗂️" titulo="Historial" sub="Log completo de todo lo capturado (solo lectura)." />
          <ErrorAviso mensaje={error} />
          {cargando && historial.length === 0 && <Cargando texto="Cargando historial…" />}
          <button className="boton-secundario" style={{ justifySelf: 'start' }} onClick={() => descargarExcel('historial', filasParaExcel())}>
            ⬇ Descargar Excel
          </button>
          <TablaCruda filas={historial} skus={skus} />
        </div>
      )}
    </div>
  );
}
