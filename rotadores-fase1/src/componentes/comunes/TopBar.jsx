export function TopBar({ usuario, rol, tema, alternarTema, onSalir }) {
  return (
    <div
      className="panel"
      style={{
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: 'var(--accent)',
            color: '#04222f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
          }}
          aria-hidden="true"
        >
          R
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1 }}>Rotadores · Fase 1</div>
          <div className="texto-sub" style={{ fontSize: 11 }}>
            {usuario} — {rol}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="boton-icono"
          onClick={alternarTema}
          aria-label={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {tema === 'oscuro' ? '☀️' : '🌙'}
        </button>
        <button className="boton-secundario" onClick={onSalir}>
          Salir
        </button>
      </div>
    </div>
  );
}
