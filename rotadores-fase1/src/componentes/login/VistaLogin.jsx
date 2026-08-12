import { useState } from 'react';
import { useSession } from '../../contexto/useSession';
import { useAuth } from '../../auth/useAuth';
import { CONFIG_COMPLETA } from '../../config';
import { login } from '../../datos/usuariosProveedor';

export function VistaLogin() {
  const { entrar } = useSession();
  const { login: loginMsal } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const puedeEntrar = Boolean(usuario.trim() && password) && !cargando;

  async function intentarEntrar() {
    if (!puedeEntrar) return;
    setCargando(true);
    setError(null);
    try {
      const encontrado = await login(usuario, password);
      if (!encontrado) {
        setError('Usuario o contraseña incorrectos.');
        return;
      }
      entrar(encontrado);
    } catch {
      setError('No se pudo validar el usuario. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background:
          'radial-gradient(1100px 480px at 50% -12%, rgba(56,189,248,.16) 0%, transparent 62%), var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 16px',
              borderRadius: 18,
              background: 'linear-gradient(160deg, var(--accent), var(--accent2))',
              color: '#04222f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 28,
              boxShadow: '0 10px 30px -8px rgba(56,189,248,.55)',
            }}
            aria-hidden="true"
          >
            R
          </div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: 'var(--accent)', fontWeight: 700 }}>
            FASE 1 · TOCANCIPÁ
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 6, letterSpacing: -0.5 }}>Rotadores</div>
          <div className="texto-sub" style={{ fontSize: 14, marginTop: 4 }}>
            Índice de frescura y rotación de producto
          </div>
        </div>

        <div className="panel" style={{ borderRadius: 18, padding: 26, boxShadow: '0 20px 50px -24px rgba(0,0,0,.35)' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {error && <div className="aviso-error">{error}</div>}
            <div className="campo">
              <label className="campo-label" htmlFor="login-usuario">
                Usuario
              </label>
              <input
                id="login-usuario"
                className="campo-input"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setError(null);
                }}
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
            <div className="campo">
              <label className="campo-label" htmlFor="login-password">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                className="campo-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && intentarEntrar()}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            className="boton boton-primario"
            style={{ width: '100%', marginTop: 22 }}
            disabled={!puedeEntrar}
            onClick={intentarEntrar}
          >
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>

          {CONFIG_COMPLETA && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  margin: '18px 0',
                  color: 'var(--sub)',
                  fontSize: 12,
                }}
              >
                <div style={{ flex: 1, height: 1, background: 'var(--linea)' }} />
                <span>o</span>
                <div style={{ flex: 1, height: 1, background: 'var(--linea)' }} />
              </div>
              <button className="boton-secundario" style={{ width: '100%' }} onClick={loginMsal}>
                Entrar con cuenta corporativa
              </button>
            </>
          )}
        </div>

        <div className="texto-sub" style={{ textAlign: 'center', fontSize: 11, marginTop: 18 }}>
          Prototipo local · los datos capturados viven en este dispositivo.
        </div>
      </div>
    </div>
  );
}
