import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Colores por plan ── */
const PLAN_META = {
  Bronce: { color: '#CD7F32', emoji: '🥉' },
  Plata:  { color: '#C0C0C0', emoji: '🥈' },
  Oro:    { color: '#FFD700', emoji: '🥇' },
};

function SuperAdmin() {
  const navigate = useNavigate();
  const [ligas,       setLigas]       = useState([]);
  const [editandoId,  setEditandoId]  = useState(null);
  const [datosEditados, setDatosEditados] = useState({ nombre_liga: '', plan: 'Bronce' });
  const [cargando,    setCargando]    = useState(true);

  useEffect(() => { fetchLigas(); }, []);

  /* ── API ── */
  const fetchLigas = async () => {
    setCargando(true);
    try {
      const res  = await fetch('http://localhost:3001/tenants');
      const data = await res.json();
      setLigas(data);
    } catch (err) {
      console.error('Error al cargar ligas:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleToggleStatus = async (id, estatusActual) => {
    const accion = estatusActual ? 'suspender' : 'activar';
    if (!window.confirm(`¿Seguro que deseas ${accion} este servicio?`)) return;
    try {
      await fetch(`http://localhost:3001/tenants/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus_pago: !estatusActual }),
      });
      fetchLigas();
    } catch (err) {
      console.error('Error al cambiar estatus');
    }
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await fetch(`http://localhost:3001/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEditados),
      });
      if (res.ok) { setEditandoId(null); fetchLigas(); }
    } catch (err) {
      console.error('Error al editar liga');
    }
  };

  /* ── Métricas ── */
  const activas   = ligas.filter(l => l.estatus_pago).length;
  const inactivas = ligas.length - activas;

  /* ── Ingresos estimados por plan ── */
  const PRECIO_PLAN = { Bronce: 199, Plata: 399, Oro: 699 };
  const ingresos = ligas
    .filter(l => l.estatus_pago)
    .reduce((sum, l) => sum + (PRECIO_PLAN[l.plan] ?? 0), 0);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: "'Outfit', sans-serif", padding: '0' }}>

        {/* ── HEADER ── */}
        <div style={{ borderBottom: '1px solid #1a1a1a', padding: '18px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/assetsinterfaz/logo_principal.png"
              alt="StreetSoccer Logo"
              style={{ height: '40px', width: 'auto', cursor: 'pointer' }}
              onClick={() => navigate('/')}
            />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px' }}>Panel SuperAdmin</div>
              <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px', textTransform: 'uppercase' }}>StreetSoccer SaaS</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: '1px solid #222', color: '#888', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: "'Outfit', sans-serif" }}
          >
            ← Salir
          </button>
        </div>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px' }}>

          {/* ── TARJETAS DE MÉTRICAS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {[
              { label: 'Total Ligas',       value: ligas.length,   icon: '🏆', color: '#fff' },
              { label: 'Servicios Activos', value: activas,         icon: '🟢', color: '#22c55e' },
              { label: 'Suspendidos',       value: inactivas,       icon: '🔴', color: '#ef4444' },
              { label: 'Ingresos Est.',     value: `$${ingresos.toLocaleString()}`, icon: '💰', color: '#FFD700' },
            ].map(card => (
              <div key={card.label} style={{
                background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '14px',
                padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                <div style={{ fontSize: '22px' }}>{card.icon}</div>
                <div style={{ fontSize: '28px', fontWeight: 900, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '12px', color: '#555', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* ── TÍTULO SECCIÓN ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Ligas Registradas</h2>
            <button onClick={fetchLigas} style={{ background: 'transparent', border: '1px solid #222', color: '#666', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Outfit', sans-serif" }}>
              ↻ Actualizar
            </button>
          </div>

          {/* ── TABLA ── */}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>Cargando ligas...</div>
          ) : ligas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#444', border: '1px dashed #222', borderRadius: '14px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <div>No hay ligas registradas aún.</div>
              <div style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>Las ligas aparecerán aquí cuando los organizadores completen su suscripción.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ligas.map(l => {
                const planMeta  = PLAN_META[l.plan] ?? { color: '#888', emoji: '📋' };
                const editando  = editandoId === l.id;

                return (
                  <div key={l.id} style={{
                    background: '#0a0a0a',
                    border: `1px solid ${editando ? planMeta.color + '55' : '#1a1a1a'}`,
                    borderRadius: '14px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                    boxShadow: editando ? `0 0 20px ${planMeta.color}22` : 'none',
                    transition: 'all 0.2s ease',
                  }}>

                    {/* Status dot */}
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                      background: l.estatus_pago ? '#22c55e' : '#ef4444',
                      boxShadow: l.estatus_pago ? '0 0 8px #22c55e88' : '0 0 8px #ef444488',
                    }} />

                    {/* Info principal */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      {editando ? (
                        <input
                          value={datosEditados.nombre_liga}
                          onChange={e => setDatosEditados({ ...datosEditados, nombre_liga: e.target.value })}
                          style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '15px', fontFamily: "'Outfit', sans-serif", width: '100%', outline: 'none' }}
                        />
                      ) : (
                        <div style={{ fontSize: '15px', fontWeight: 700 }}>{l.nombre_liga}</div>
                      )}
                      <div style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>
                        {l.nombre_dueno ? `👤 ${l.nombre_dueno}` : 'Sin dueño asignado'} &nbsp;·&nbsp; /liga/{l.subdominio_o_slug}
                      </div>
                    </div>

                    {/* Plan badge / selector */}
                    <div style={{ minWidth: '120px' }}>
                      {editando ? (
                        <select
                          value={datosEditados.plan}
                          onChange={e => setDatosEditados({ ...datosEditados, plan: e.target.value })}
                          style={{ background: '#111', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '14px', fontFamily: "'Outfit', sans-serif", outline: 'none', cursor: 'pointer' }}
                        >
                          <option value="Bronce">🥉 Bronce — $199</option>
                          <option value="Plata">🥈 Plata — $399</option>
                          <option value="Oro">🥇 Oro — $699</option>
                        </select>
                      ) : (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '4px 12px', borderRadius: '20px',
                          background: `${planMeta.color}18`,
                          border: `1px solid ${planMeta.color}44`,
                          color: planMeta.color, fontSize: '13px', fontWeight: 700,
                        }}>
                          {planMeta.emoji} {l.plan}
                        </span>
                      )}
                    </div>

                    {/* Estatus texto */}
                    <div style={{ minWidth: '90px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                        color: l.estatus_pago ? '#22c55e' : '#ef4444',
                        textTransform: 'uppercase',
                      }}>
                        {l.estatus_pago ? '● Activo' : '● Suspendido'}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {editando ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(l.id)}
                            style={{ ...btnBase, background: planMeta.color, color: '#000', border: 'none' }}
                          >
                            ✓ Guardar
                          </button>
                          <button
                            onClick={() => setEditandoId(null)}
                            style={{ ...btnBase, color: '#888' }}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditandoId(l.id); setDatosEditados({ nombre_liga: l.nombre_liga, plan: l.plan }); }}
                            style={{ ...btnBase }}
                            title="Editar nombre y plan"
                          >
                            ✏️ Plan
                          </button>
                          <button
                            onClick={() => handleToggleStatus(l.id, l.estatus_pago)}
                            style={{
                              ...btnBase,
                              borderColor: l.estatus_pago ? '#ef444455' : '#22c55e55',
                              color: l.estatus_pago ? '#ef4444' : '#22c55e',
                            }}
                          >
                            {l.estatus_pago ? '⏸ Suspender' : '▶ Activar'}
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

const btnBase = {
  background: 'transparent',
  border: '1px solid #2a2a2a',
  color: '#ccc',
  padding: '7px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: "'Outfit', sans-serif",
  transition: 'opacity 0.2s',
  whiteSpace: 'nowrap',
};

export default SuperAdmin;