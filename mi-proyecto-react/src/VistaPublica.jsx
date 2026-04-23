import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   Colores por posición del ranking
───────────────────────────────────────── */
const RANK_COLORS = {
  1: { color: '#FFD700', label: '#1', shadow: '0 0 12px rgba(255,215,0,0.7)' },   // Oro
  2: { color: '#C0C0C0', label: '#2', shadow: '0 0 10px rgba(192,192,192,0.6)' }, // Plata
  3: { color: '#CD7F32', label: '#3', shadow: '0 0 10px rgba(205,127,50,0.6)' },  // Cobre
};

/* Badge numérico de ranking */
const RankBadge = ({ rank }) => {
  const cfg = RANK_COLORS[rank] ?? { color: '#ffffff', label: `#${rank}`, shadow: 'none' };
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: rank <= 3
        ? `radial-gradient(circle at 35% 35%, #fff3, ${cfg.color})`
        : 'rgba(255,255,255,0.12)',
      border: `2px solid ${cfg.color}`,
      boxShadow: cfg.shadow,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      fontSize: '13px',
      color: cfg.color,
      zIndex: 2,
      fontFamily: "'Outfit', sans-serif",
      letterSpacing: '-0.5px',
    }}>
      {cfg.label ?? `#${rank}`}
    </div>
  );
};

/* Barra de estadística individual */
const StatBar = ({ label, value, max, color = '#22c55e' }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: '9px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#aaa', marginBottom: '3px', fontFamily: "'Outfit', sans-serif" }}>
        <span>{label}</span>
        <span style={{ color: '#fff', fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}, #86efac)`,
          borderRadius: '4px',
          transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>
    </div>
  );
};

/* Tarjeta de jugador */
const PlayerCard = ({ jugador, rank, maxStats }) => {
  const rankCfg = RANK_COLORS[rank] ?? { color: '#ffffff', shadow: 'none' };
  const borderColor = rank <= 3 ? rankCfg.color : '#2a2a2a';

  return (
    <div style={{
      position: 'relative',
      minWidth: '220px',
      maxWidth: '220px',
      background: 'linear-gradient(160deg, #111 0%, #0d0d0d 100%)',
      border: `1.5px solid ${borderColor}`,
      borderRadius: '16px',
      padding: '44px 18px 18px 18px',
      flexShrink: 0,
      boxShadow: rank <= 3
        ? `0 4px 24px ${rankCfg.color}22, inset 0 0 0 1px ${rankCfg.color}18`
        : '0 4px 16px #00000080',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
      e.currentTarget.style.boxShadow = rank <= 3
        ? `0 12px 36px ${rankCfg.color}44, inset 0 0 0 1px ${rankCfg.color}30`
        : '0 12px 32px #000000aa';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = '';
      e.currentTarget.style.boxShadow = rank <= 3
        ? `0 4px 24px ${rankCfg.color}22, inset 0 0 0 1px ${rankCfg.color}18`
        : '0 4px 16px #00000080';
    }}
    >
      <RankBadge rank={rank} />

      {/* Avatar inicial */}
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${borderColor}44, #1a1a1a)`,
        border: `2px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        marginBottom: '10px',
        color: '#fff',
        fontWeight: 700,
        fontFamily: "'Outfit', sans-serif",
        boxShadow: rank <= 3 ? `0 0 16px ${rankCfg.color}44` : 'none',
      }}>
        {jugador.equipo_escudo || jugador.jugador_nombre?.charAt(0).toUpperCase()}
      </div>

      {/* Nombre y equipo */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2, marginBottom: '4px' }}>
          {jugador.jugador_nombre}
        </div>
        <div style={{ fontSize: '11.5px', color: rank <= 3 ? rankCfg.color : '#888', fontWeight: 600, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.3px' }}>
          {jugador.equipo_nombre}
        </div>
      </div>

      {/* Barras de estadísticas */}
      <StatBar label="⚽ Goles"        value={parseInt(jugador.total_goles)}       max={maxStats.goles}    color="#22c55e" />
      <StatBar label="🎯 Asistencias"  value={parseInt(jugador.total_asistencias)} max={maxStats.asistencias} color="#16a34a" />
      <StatBar label="🏟️ Partidos"     value={parseInt(jugador.partidos_jugados)}  max={maxStats.partidos} color="#15803d" />
    </div>
  );
};

/* ─────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────── */
const VistaPublica = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [ligaInfo,    setLigaInfo]    = useState(null);
  const [equipos,     setEquipos]     = useState([]);
  const [torneos,     setTorneos]     = useState([]);
  const [topJugadores, setTopJugadores] = useState([]);
  const [error,       setError]       = useState(null);

  const sliderRef = useRef(null);
  const [isDragging,  setIsDragging]  = useState(false);
  const [startX,      setStartX]      = useState(0);
  const [scrollLeft,  setScrollLeft]  = useState(0);

  useEffect(() => { cargarDatosPublicos(); }, [slug]);

  const cargarDatosPublicos = async () => {
    try {
      const resLiga = await fetch(`http://localhost:3001/api/liga-publica/${slug}`);
      if (!resLiga.ok) { const e = await resLiga.json(); throw new Error(e.error); }
      setLigaInfo(await resLiga.json());

      const [resEquipos, resTorneos, resTop] = await Promise.all([
        fetch(`http://localhost:3001/api/equipos/${slug}`),
        fetch(`http://localhost:3001/api/torneos/${slug}`),
        fetch(`http://localhost:3001/api/top-jugadores/${slug}`),
      ]);

      if (resEquipos.ok)  setEquipos(await resEquipos.json());
      if (resTorneos.ok)  setTorneos(await resTorneos.json());
      if (resTop.ok)      setTopJugadores(await resTop.json());
    } catch (err) {
      setError(err.message);
    }
  };

  /* ── Drag-to-scroll ── */
  const onMouseDown  = e => { setIsDragging(true); setStartX(e.pageX - sliderRef.current.offsetLeft); setScrollLeft(sliderRef.current.scrollLeft); };
  const onMouseLeave = ()  => setIsDragging(false);
  const onMouseUp    = ()  => setIsDragging(false);
  const onMouseMove  = e => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    sliderRef.current.scrollLeft = scrollLeft - (x - startX) * 1.2;
  };

  const scrollSlider = (dir) => {
    if (sliderRef.current) sliderRef.current.scrollBy({ left: dir * 250, behavior: 'smooth' });
  };

  /* máximos para escalar las barras */
  const maxStats = {
    goles:       Math.max(1, ...topJugadores.map(j => parseInt(j.total_goles))),
    asistencias: Math.max(1, ...topJugadores.map(j => parseInt(j.total_asistencias))),
    partidos:    Math.max(1, ...topJugadores.map(j => parseInt(j.partidos_jugados))),
  };

  if (error) return (
    <div style={{ textAlign:'center', padding:'100px 20px', fontFamily:'sans-serif', backgroundColor:'#000', color:'#fff', minHeight:'100vh' }}>
      <h2>Oops... {error}</h2>
      <Link to="/" style={{ color:'#fff', textDecoration:'underline' }}>Volver al inicio</Link>
    </div>
  );

  if (!ligaInfo) return (
    <div style={{ padding:'50px', textAlign:'center', backgroundColor:'#000', color:'#fff', minHeight:'100vh' }}>
      Cargando liga...
    </div>
  );

  return (
    <>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ fontFamily:"'Outfit', sans-serif", backgroundColor:'#000', minHeight:'100vh', color:'#fff' }}>

        {/* ── HEADER ── */}
        <div style={{ backgroundColor:'#000', borderBottom:'1px solid #222', padding:'20px', textAlign:'center' }}>
          <div style={{ marginBottom:'20px' }}>
            <img src="/assetsinterfaz/logo_principal.png" alt="StreetSoccer Logo"
              style={{ width:'200px', cursor:'pointer' }} onClick={() => navigate('/publico')} />
          </div>
          <h1 style={{ margin:0, fontSize:'40px', color:'#fff' }}>{ligaInfo.nombre_liga}</h1>
          <p style={{ margin:'10px 0 0 0', color:'#888' }}>Plataforma Oficial de Resultados</p>
        </div>

        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'30px 20px' }}>

          {/* ── TORNEOS ── */}
          <h2 style={{ borderBottom:'1px solid #222', paddingBottom:'10px', color:'#fff' }}>Torneos Activos</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap:'20px', marginBottom:'40px' }}>
            {torneos.length === 0
              ? <p style={{ color:'#666' }}>No hay torneos activos en este momento.</p>
              : torneos.map(t => (
                <div key={t.id} style={{ backgroundColor:'#0a0a0a', padding:'20px', border:'1px solid #222', borderRadius:'12px' }}>
                  <h3 style={{ margin:'0 0 10px 0', color:'#fff' }}>{t.nombre}</h3>
                  <p style={{ margin:0, color:'#888' }}>Formato: {t.formato}</p>
                  <p style={{ margin:0, color:'#888' }}>Inicia: {new Date(t.fecha_inicio).toLocaleDateString()}</p>
                </div>
              ))
            }
          </div>

          {/* ── EQUIPOS ── */}
          <h2 style={{ borderBottom:'1px solid #222', paddingBottom:'10px', color:'#fff' }}>Equipos Participantes</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'20px', marginBottom:'50px' }}>
            {equipos.length === 0
              ? <p style={{ color:'#666' }}>Aún no hay equipos inscritos.</p>
              : equipos.map(eq => (
                <div key={eq.id} style={{ backgroundColor:'#0a0a0a', padding:'20px', border:'1px solid #222', borderRadius:'12px', textAlign:'center' }}>
                  <div style={{ fontSize:'40px' }}>{eq.escudo || '⚽'}</div>
                  <h4 style={{ margin:'10px 0 0 0', color:'#fff' }}>{eq.nombre}</h4>
                </div>
              ))
            }
          </div>

          {/* ══════════════════════════════════════
              RANKING DE MEJORES JUGADORES
          ══════════════════════════════════════ */}
          <div style={{ marginBottom: '60px' }}>

            {/* Título de sección */}
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'8px' }}>
              <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg, transparent, #22c55e44)' }} />
              <h2 style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #22c55e, #86efac)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.3px',
              }}>
                🏆 Mejores Jugadores
              </h2>
              <div style={{ flex:1, height:'1px', background:'linear-gradient(90deg, #22c55e44, transparent)' }} />
            </div>
            <p style={{ textAlign:'center', color:'#555', fontSize:'13px', marginBottom:'24px' }}>
              Ranking basado en goles, asistencias y partidos jugados
            </p>

            {topJugadores.length === 0 ? (
              <p style={{ textAlign:'center', color:'#555', padding:'40px 0' }}>
                Aún no hay estadísticas registradas en esta liga.
              </p>
            ) : (
              <div style={{ position:'relative' }}>

                {/* Botón izquierdo */}
                <button onClick={() => scrollSlider(-1)} style={{
                  position:'absolute', left:'-18px', top:'50%', transform:'translateY(-50%)',
                  zIndex:10, background:'rgba(34,197,94,0.15)', border:'1px solid #22c55e44',
                  color:'#22c55e', width:'38px', height:'38px', borderRadius:'50%',
                  fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', transition:'background 0.2s',
                }} onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.3)'}
                   onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.15)'}>
                  ‹
                </button>

                {/* Slider */}
                <div
                  ref={sliderRef}
                  onMouseDown={onMouseDown}
                  onMouseLeave={onMouseLeave}
                  onMouseUp={onMouseUp}
                  onMouseMove={onMouseMove}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    paddingBottom: '12px',
                    paddingTop: '8px',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    scrollBehavior: 'smooth',
                  }}
                >
                  {topJugadores.map((jugador, idx) => (
                    <PlayerCard
                      key={jugador.id}
                      jugador={jugador}
                      rank={idx + 1}
                      maxStats={maxStats}
                    />
                  ))}
                </div>

                {/* Botón derecho */}
                <button onClick={() => scrollSlider(1)} style={{
                  position:'absolute', right:'-18px', top:'50%', transform:'translateY(-50%)',
                  zIndex:10, background:'rgba(34,197,94,0.15)', border:'1px solid #22c55e44',
                  color:'#22c55e', width:'38px', height:'38px', borderRadius:'50%',
                  fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center',
                  justifyContent:'center', transition:'background 0.2s',
                }} onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,0.3)'}
                   onMouseLeave={e=>e.currentTarget.style.background='rgba(34,197,94,0.15)'}>
                  ›
                </button>

                {/* Indicadores de puntos */}
                <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginTop:'20px' }}>
                  {topJugadores.map((_, idx) => {
                    const cfg = RANK_COLORS[idx+1] ?? { color:'#333' };
                    return (
                      <div key={idx} style={{
                        width: idx === 0 ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: idx === 0 ? cfg.color : '#333',
                        transition: 'all 0.3s',
                      }} />
                    );
                  })}
                </div>

              </div>
            )}
          </div>
          {/* ── fin ranking ── */}

        </div>
      </div>

      {/* Ocultar scrollbar webkit */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
};

export default VistaPublica;