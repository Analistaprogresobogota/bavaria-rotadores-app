import { useEffect, useState } from 'react';
import { useDatos } from '../../hooks/useDatos';
import { calcularIndicadores, calcularResultadoMacro } from '../../logica/macro';
import { formatoFechaLegible } from '../../utilidades/fechas';
import { descargarExcel } from '../../utilidades/exportarExcel';
import { SectionTitle } from '../comunes/SectionTitle';
import { Cargando } from '../comunes/Cargando';
import { ErrorAviso } from '../comunes/ErrorAviso';
import { TablaCruda } from '../comunes/TablaCruda';
import { TablaMPRot } from '../comunes/TablaMPRot';
import { TableroResumen } from '../comunes/TableroResumen';
import { VistaUsuarios } from './VistaUsuarios';

const PESTANAS = ['Tablero', 'Conteos', 'Historial', 'MPRot', 'Usuarios'];

// Vista del Admin: ve todo lo que ve Supervisor + Programador juntos
// (Tablero, Conteos, Historial, MPRot, todo de solo
// lectura con Excel), mas la pestaña Usuarios para crear cuentas nuevas de
// cualquier rol. No existe ningun boton para borrar/vaciar Historial — el
// log queda append-only siempre, sin excepciones.
export function VistaAdmin() {
  const { cargando, error, obtenerSkus, obtenerConteos, obtenerHistorial } = useDatos();
  const [skus, setSkus] = useState([]);
  const [conteos, setConteos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [pestana, setPestana] = useState('Tablero');

  useEffect(() => {
    obtenerSkus().then(setSkus).catch(() => {});
    obtenerConteos().then(setConteos).catch(() => {});
    obtenerHistorial().then(setHistorial).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Solo estas 11 columnas — a proposito, en el mismo orden de la hoja
  // "Conteos" del Excel real (se descarga para pegarla directo ahi).
  function filasConteosParaExcel() {
    return conteos.map((f) => {
      const sku = skus.find((s) => s.Codigo === f.Codigo) || null;
      const calc = calcularIndicadores(f, sku);
      return {
        Modulo: f.Modulo,
        Código: f.Codigo,
        Descripción: sku?.Descripcion || '',
        Estibas: f.Estibas,
        Cajas: f.Cajas,
        Unidades: f.Unidades,
        'Fecha de vencimiento': f.FechaVencimiento ? formatoFechaLegible(f.FechaVencimiento) : '',
        'Días para vencer': calc?.diasParaVencer ?? '',
        Observaciones: f.Observaciones || '',
        Estatus: f.Estatus || '',
        'Total Cajas': calc?.totalCajas ?? '',
      };
    });
  }

  // Historial si lleva columnas de mas (Bloquear + datos de sesion): son
  // los que hacen falta para trazabilidad/dashboard, a diferencia de Conteos.
  function filasHistorialParaExcel() {
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

  const botonDescargar = (nombreArchivo, filas) => (
    <button className="boton-secundario" style={{ justifySelf: 'start' }} onClick={() => descargarExcel(nombreArchivo, filas)}>
      ⬇ Descargar Excel
    </button>
  );

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PESTANAS.map((p) => (
          <button key={p} className={`boton-filtro${pestana === p ? ' activo' : ''}`} onClick={() => setPestana(p)}>
            {p}
          </button>
        ))}
      </div>

      {pestana === 'Tablero' && <TableroResumen />}

      {pestana === 'Conteos' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionTitle icono="📋" titulo="Conteos" sub="Estado actual de todas las posiciones (solo lectura)." />
          <ErrorAviso mensaje={error} />
          {cargando && conteos.length === 0 && <Cargando texto="Cargando conteos…" />}
          {botonDescargar('conteos', filasConteosParaExcel())}
          <TablaCruda filas={conteos} skus={skus} columnasCompletas={false} />
        </div>
      )}

      {pestana === 'Historial' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionTitle icono="🗂️" titulo="Historial" sub="Log completo de todo lo capturado (solo lectura, nunca se borra)." />
          <ErrorAviso mensaje={error} />
          {cargando && historial.length === 0 && <Cargando texto="Cargando historial…" />}
          {botonDescargar('historial', filasHistorialParaExcel())}
          <TablaCruda filas={historial} skus={skus} />
        </div>
      )}

      {pestana === 'MPRot' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionTitle icono="🧮" titulo="MPRot" sub="Módulos en rotación, mismo cálculo y orden que la macro en Excel — solo para consultar, no se descarga." />
          <ErrorAviso mensaje={error} />
          {/* Solo posiciones con producto asignado, igual que el Excel: una posicion vacia no aparece en su hoja de rotacion. */}
          <TablaMPRot conteos={calcularResultadoMacro(conteos.filter((c) => c.Codigo), skus)} />
        </div>
      )}

      {pestana === 'Usuarios' && <VistaUsuarios />}
    </div>
  );
}
