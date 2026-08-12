// Login y administracion de cuentas (tabla "usuarios_rotadores"). El login
// funciona offline: si no hay red, se valida contra la ultima copia de
// "usuarios_rotadores" que quedo en cache.
//
// Backend: usa api-rotadores (VITE_API_URL) si esta configurada, si no cae
// a Supabase (comportamiento original), si no trabaja solo con cache local.
import { createClient } from '@supabase/supabase-js';
import { CONFIG, USAR_API } from '../config';
import { leerCache, escribirCache } from './colaSincronizacion';

const TABLA = 'usuarios_rotadores';

let cliente = null;
function obtenerCliente() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) return null;
  if (!cliente) cliente = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
  return cliente;
}

async function solicitud(ruta, opciones = {}) {
  const resp = await fetch(`${CONFIG.apiUrl}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  if (!resp.ok) {
    const cuerpo = await resp.json().catch(() => ({}));
    throw new Error(cuerpo.error || `api-rotadores respondio ${resp.status}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

function normaliza(u) {
  return (u || '').trim().toLowerCase();
}

export async function listarUsuarios() {
  if (USAR_API) {
    try {
      const data = await solicitud('/usuarios');
      escribirCache(TABLA, data);
      return data;
    } catch {
      return leerCache(TABLA);
    }
  }
  const supabase = obtenerCliente();
  if (supabase) {
    try {
      const { data, error } = await supabase.from(TABLA).select('*').order('Nombre');
      if (error) throw error;
      escribirCache(TABLA, data);
      return data;
    } catch {
      return leerCache(TABLA);
    }
  }
  return leerCache(TABLA);
}

export async function login(usuario, password) {
  const u = normaliza(usuario);

  if (USAR_API) {
    try {
      // La validacion pasa por el servidor: a diferencia de Supabase, aqui
      // nunca se trae la lista completa de contraseñas al dispositivo.
      const encontrado = await solicitud('/usuarios/login', { method: 'POST', body: JSON.stringify({ usuario: u, password }) });
      return encontrado || null;
    } catch {
      // sin red: sigue con la cache de abajo
    }
  } else {
    const supabase = obtenerCliente();
    if (supabase) {
      try {
        const { data, error } = await supabase.from(TABLA).select('*').eq('Activo', 'Si');
        if (error) throw error;
        escribirCache(TABLA, data);
        const encontrado = data.find((x) => normaliza(x.Usuario) === u && x.Password === password);
        return encontrado || null;
      } catch {
        // sin red: sigue con la cache de abajo
      }
    }
  }

  const cache = leerCache(TABLA);
  const encontrado = cache.find((x) => normaliza(x.Usuario) === u && x.Password === password && x.Activo !== 'No');
  return encontrado || null;
}

export async function crearUsuario(datos) {
  const registro = { Nombre: datos.Nombre, Usuario: datos.Usuario, Password: datos.Password, Rol: datos.Rol, Activo: 'Si' };
  if (USAR_API) return solicitud('/usuarios', { method: 'POST', body: JSON.stringify(registro) });
  const supabase = obtenerCliente();
  if (!supabase) throw new Error('No hay backend configurado (ni API ni Supabase).');
  const { data, error } = await supabase.from(TABLA).insert(registro).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarUsuario(id, cambios) {
  if (USAR_API) return solicitud(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) });
  const supabase = obtenerCliente();
  if (!supabase) throw new Error('No hay backend configurado (ni API ni Supabase).');
  const { data, error } = await supabase.from(TABLA).update(cambios).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
