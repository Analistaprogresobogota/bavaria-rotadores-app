// Reglas de negocio para el flujo de captura por posicion (Rotador).
// `conteos` es el estado ACTUAL de cada posicion, igual que la hoja
// "Conteos" del Excel real. Normalmente hay un solo registro por Orden, pero
// un modulo "mixto" (con 2 o mas productos distintos guardados ahi) puede
// tener varios — por eso todo se maneja como lista, nunca se asume un unico
// registro. Se busca por `Orden` (no por Modulo) porque hay nombres de
// modulo repetidos en la bodega real.

function esMismoDiaLocal(fechaA, fechaB) {
  return (
    fechaA.getFullYear() === fechaB.getFullYear() &&
    fechaA.getMonth() === fechaB.getMonth() &&
    fechaA.getDate() === fechaB.getDate()
  );
}

// Todos los registros actuales de una posicion (uno por producto que tenga
// guardado ahi — normalmente 1, mas de 1 si es un modulo mixto).
export function estadosActualesDe(orden, conteos) {
  return conteos.filter((c) => c.Orden === orden);
}

// El primer/unico estado actual de una posicion, o null si nunca se ha
// contado. Se usa donde solo hace falta "algo" para mostrar una vista previa.
export function estadoActualDe(orden, conteos) {
  return estadosActualesDe(orden, conteos)[0] || null;
}

// Una posicion esta "revisada" en el turno actual si alguno de sus registros
// quedo guardado hoy con ese mismo turno.
export function esRevisadaHoy(orden, conteos, turno) {
  const hoy = new Date();
  return estadosActualesDe(orden, conteos).some(
    (c) => c.Turno === turno && esMismoDiaLocal(new Date(c.FechaToma), hoy)
  );
}

// Cuanto dura un bloqueo de edicion antes de considerarse abandonado (por
// ejemplo si el Rotador cerro la app sin guardar ni cancelar).
const BLOQUEO_TTL_MS = 5 * 60 * 1000;

export function bloqueoVigente(bloqueo) {
  if (!bloqueo) return false;
  return Date.now() - new Date(bloqueo.CreadoEn).getTime() < BLOQUEO_TTL_MS;
}

// El bloqueo vigente de una posicion (por Orden), o null si no hay ninguno
// o si el que habia ya expiro.
export function bloqueoDe(orden, bloqueos) {
  const b = bloqueos.find((x) => x.Orden === orden);
  return bloqueoVigente(b) ? b : null;
}
