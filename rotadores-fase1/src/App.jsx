import { SessionProvider } from './contexto/SessionContext';
import { useSession } from './contexto/useSession';
import { useAuth } from './auth/useAuth';
import { useTema } from './hooks/useTema';
import { MsalProviderApp } from './auth/MsalProviderApp';
import { CONFIG_COMPLETA } from './config';
import { TopBar } from './componentes/comunes/TopBar';
import { VistaLogin } from './componentes/login/VistaLogin';
import { VistaRotador } from './componentes/rotador/VistaRotador';
import { VistaSupervisor } from './componentes/supervisor/VistaSupervisor';
import { VistaProgramador } from './componentes/programador/VistaProgramador';
import { VistaAdmin } from './componentes/admin/VistaAdmin';

export default function App() {
  // MsalProviderApp solo se monta si hay configuracion real de Entra/SharePoint:
  // evita instanciar MSAL con un clientId invalido cuando solo se usara el modo demo.
  if (CONFIG_COMPLETA) {
    return (
      <MsalProviderApp>
        <SessionProvider>
          <Contenido />
        </SessionProvider>
      </MsalProviderApp>
    );
  }
  return (
    <SessionProvider>
      <Contenido />
    </SessionProvider>
  );
}

function Contenido() {
  const { modo, rol, usuario, salir } = useSession();
  const { logout } = useAuth();
  const { tema, alternar } = useTema();

  if (!modo || !rol) return <VistaLogin />;

  function cerrarSesion() {
    salir();
    if (modo === 'real') logout();
  }

  return (
    <div className="app-shell">
      <TopBar usuario={usuario} rol={rol} tema={tema} alternarTema={alternar} onSalir={cerrarSesion} />
      <div className="app-contenido">
        {rol === 'Rotador' ? (
          <VistaRotador />
        ) : rol === 'Programador' ? (
          <VistaProgramador />
        ) : rol === 'Admin' ? (
          <VistaAdmin />
        ) : (
          <VistaSupervisor />
        )}
      </div>
    </div>
  );
}
