import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from './config';

const DashboardCapitan = ({ usuario, setUsuario }) => {
  const navigate = useNavigate();
  const [vistaActual, setVistaActual] = useState('inicio');
  const [listaEquipos, setListaEquipos] = useState([]);
  const [ligasDisponibles, setLigasDisponibles] = useState([]);
  const [modalEquipo, setModalEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', representante: '', escudo: 'A', slug_liga: '' });
  
  // Variables para la plantilla (jugadores)
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [plantilla, setPlantilla] = useState([]);
  const [nuevoJugador, setNuevoJugador] = useState({ nombre: '', rol: 'Jugador' });

  // Variables para Estadísticas
  const [pestanaEstadisticas, setPestanaEstadisticas] = useState('jugadores');
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [torneosEquipo, setTorneosEquipo] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [partidosEquipo, setPartidosEquipo] = useState([]);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState(null);
  const [estadisticasActuales, setEstadisticasActuales] = useState({});
  const [estadisticasGlobales, setEstadisticasGlobales] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(true);

  const iconosDisponibles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
    } else {
      cargarEquipos();
      cargarLigas();
    }
  }, [usuario]);

  const cargarEquipos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/equipos/capitan/${usuario.id}`);
      if (res.ok) {
        const data = await res.json();
        setListaEquipos(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cargarLigas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/directorio-ligas`);
      if (res.ok) {
        const data = await res.json();
        setLigasDisponibles(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();
    if (!nuevoEquipo.slug_liga) {
      alert("Debes seleccionar una liga a la cual unirte.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/equipos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoEquipo, capitan_id: usuario.id })
      });
      if (res.ok) {
        alert("¡Equipo registrado con éxito en la liga!");
        setModalEquipo(false);
        setNuevoEquipo({ nombre: '', representante: '', escudo: 'A', slug_liga: '' });
        await cargarEquipos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const verPlantilla = async (equipo) => {
    setEquipoSeleccionado(equipo);
    setVistaActual('plantilla');
    try {
      const res = await fetch(`${API_URL}/api/jugadores/${equipo.id}`);
      if (res.ok) setPlantilla(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const verEstadisticasEquipo = async (equipo) => {
    setEquipoSeleccionado(equipo);
    setVistaActual('estadisticas-equipo');
    setPestanaEstadisticas('jugadores');
    setJugadorSeleccionado(null);
    setTorneoSeleccionado(null);
    setPartidoSeleccionado(null);
    
    // Cargar plantilla para usarla en ambas pestañas
    try {
      const resJug = await fetch(`${API_URL}/api/jugadores/${equipo.id}`);
      if (resJug.ok) setPlantilla(await resJug.json());
      
      const resTor = await fetch(`${API_URL}/api/equipos/${equipo.id}/torneos`);
      if (resTor.ok) setTorneosEquipo(await resTor.json());
    } catch (error) {
      console.error(error);
    }
  };

  const guardarJugador = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/jugadores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoJugador, equipo_id: equipoSeleccionado.id })
      });
      if (res.ok) {
        setNuevoJugador({ nombre: '', rol: 'Jugador' });
        const resList = await fetch(`${API_URL}/api/jugadores/${equipoSeleccionado.id}`);
        if (resList.ok) setPlantilla(await resList.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cargarEstadisticasGlobales = async (jugador_id) => {
    try {
      const res = await fetch(`${API_URL}/api/estadisticas/jugador/${jugador_id}/global`);
      if (res.ok) {
        setEstadisticasGlobales(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const seleccionarTorneo = async (torneo) => {
    setTorneoSeleccionado(torneo);
    setPartidoSeleccionado(null);
    setJugadorSeleccionado(null);
    try {
      const res = await fetch(`${API_URL}/api/equipos/${equipoSeleccionado.id}/torneo/${torneo.id}/partidos`);
      if (res.ok) setPartidosEquipo(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const seleccionarPartido = (partido) => {
    setPartidoSeleccionado(partido);
    setJugadorSeleccionado(null);
  };

  const cargarEstadisticasJugadorPartido = async (jugador) => {
    setJugadorSeleccionado(jugador);
    try {
      const res = await fetch(`${API_URL}/api/estadisticas/jugador/${jugador.id}/partido/${partidoSeleccionado.id}`);
      if (res.ok) {
        const data = await res.json();
        setEstadisticasActuales(data);
        if (Object.keys(data).length > 0 && data.id) {
          setModoEdicion(false); // Si ya existen, modo lectura
        } else {
          setModoEdicion(true); // Si no existen, modo edición
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatChange = (field, value) => {
    setEstadisticasActuales(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const guardarEstadisticasPartido = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/estadisticas/jugador/${jugadorSeleccionado.id}/partido/${partidoSeleccionado.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estadisticasActuales)
      });
      if (res.ok) {
        const datosGuardados = await res.json();
        setEstadisticasActuales(datosGuardados); // Sync con lo que devolvió el server
        setModoEdicion(false);
        alert("¡Estadísticas guardadas con éxito!");
      } else {
        alert("Error al guardar. Intenta de nuevo.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cerrarSesion = () => {
    setUsuario(null);
    navigate('/');
  };

  if (!usuario) return null;

  const renderNumberInput = (label, field) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
      <label style={{ fontSize: '13px', color: '#cccccc' }}>{label}</label>
      <input 
        type="number" 
        min="0"
        value={estadisticasActuales[field] || 0}
        onChange={(e) => handleStatChange(field, e.target.value)}
        disabled={!modoEdicion}
        style={{
          ...inputStyle,
          width: '100px',
          padding: '8px 12px',
          fontSize: '16px',
          fontWeight: 'bold',
          border: '2px solid #333',
          borderRadius: '4px',
          backgroundColor: modoEdicion ? '#111' : '#000',
          color: modoEdicion ? '#ffffff' : '#aaaaaa',
          boxShadow: modoEdicion ? 'inset 0 1px 3px rgba(0,0,0,0.5)' : 'none',
          transition: 'border 0.2s',
          cursor: modoEdicion ? 'text' : 'not-allowed'
        }}
        onFocus={(e) => { if(modoEdicion) e.target.style.border = '2px solid #ffffff' }}
        onBlur={(e) => { if(modoEdicion) e.target.style.border = '2px solid #333' }}
      />
    </div>
  );

  const renderPercentageInput = (label, field) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '13px', color: '#cccccc' }}>{label}</label>
        <span style={{ fontWeight: 'bold', color: modoEdicion ? '#fff' : '#aaa' }}>{estadisticasActuales[field] || 0}%</span>
      </div>
      <input 
        type="range" 
        min="0" max="100"
        value={estadisticasActuales[field] || 0}
        onChange={(e) => handleStatChange(field, e.target.value)}
        disabled={!modoEdicion}
        style={{
          width: '100%',
          cursor: modoEdicion ? 'pointer' : 'not-allowed',
          accentColor: '#ffffff',
          height: '6px',
          backgroundColor: '#333',
          outline: 'none',
          borderRadius: '3px',
          opacity: modoEdicion ? 1 : 0.5
        }}
      />
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#000000', color: '#ffffff' }}>
      
      {/* BARRA LATERAL (Sidebar) */}
      <div style={{ width: '250px', backgroundColor: '#000000', borderRight: '1px solid #ffffff', padding: '20px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <img 
            src="/assetsinterfaz/logo_principal.png" 
            alt="StreetSoccer Logo" 
            style={{ width: '100%', cursor: 'pointer' }} 
            onClick={() => navigate('/')}
          />
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li onClick={() => { setVistaActual('inicio'); setEquipoSeleccionado(null); }} style={sidebarItem(vistaActual === 'inicio' || vistaActual === 'plantilla')}>Mis Equipos</li>
          <li onClick={() => { setVistaActual('estadisticas-inicio'); setEquipoSeleccionado(null); }} style={sidebarItem(vistaActual.includes('estadisticas'))}>Estadísticas</li>
          <li onClick={cerrarSesion} style={sidebarItem(false)}>Cerrar Sesión</li>
        </ul>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* BARRA SUPERIOR */}
        <div style={{ backgroundColor: '#000000', borderBottom: '1px solid #ffffff', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', color: '#ffffff' }}>
          <span style={{ marginRight: '20px' }}>Capitán: {usuario.nombre} ({usuario.correo})</span>
        </div>

        {/* ÁREA DE TRABAJO */}
        <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>

          {vistaActual === 'inicio' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Equipos que administro</h2>
                <button onClick={() => setModalEquipo(true)} style={btnAction(true)}>
                  + Registrar Equipo
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {listaEquipos.length === 0 ? (
                  <p style={{ color: '#cccccc' }}>Aún no tienes ningún equipo. ¡Registra uno y únete a una liga!</p>
                ) : (
                  listaEquipos.map(equipo => (
                    <div 
                      key={equipo.id} onClick={() => verPlantilla(equipo)} 
                      style={cardStyle}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <div style={{ fontSize: '50px', marginBottom: '10px' }}>{equipo.escudo || 'A'}</div>
                      <h4 style={{ color: '#ffffff', margin: '0 0 5px 0' }}>{equipo.nombre}</h4>
                      <p style={{ fontSize: '12px', color: '#cccccc', margin: '0 0 10px 0' }}>DT: {equipo.representante}</p>
                      <p style={{ fontSize: '13px', color: '#ffffff', margin: 0, fontWeight: 'bold' }}>Gestionar plantilla</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {vistaActual === 'plantilla' && equipoSeleccionado && (
            <>
              <button onClick={() => { setVistaActual('inicio'); setEquipoSeleccionado(null); }} style={{ ...btnAction(true), marginBottom: '20px' }}>
                Volver a Mis Equipos
              </button>
              
              <h2 style={{ borderBottom: '1px solid #ffffff', paddingBottom: '10px' }}>
                Plantilla: {equipoSeleccionado.nombre}
              </h2>

              <div style={{ backgroundColor: '#000000', padding: '20px', border: '1px solid #ffffff', marginBottom: '20px' }}>
                <form onSubmit={guardarJugador} style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    placeholder="Nombre del Jugador" required 
                    value={nuevoJugador.nombre} onChange={e => setNuevoJugador({...nuevoJugador, nombre: e.target.value})}
                    style={{ flex: 2, ...inputStyle }}
                  />
                  <select 
                    value={nuevoJugador.rol} onChange={e => setNuevoJugador({...nuevoJugador, rol: e.target.value})}
                    style={{ flex: 1, ...inputStyle }}
                  >
                    <option value="Portero">Portero</option>
                    <option value="Defensa">Defensa</option>
                    <option value="Medio">Medio</option>
                    <option value="Delantero">Delantero</option>
                  </select>
                  <button type="submit" style={btnAction(true)}>
                    Añadir Jugador
                  </button>
                </form>
              </div>

              <div style={{ backgroundColor: '#000000', border: '1px solid #ffffff' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#111111', borderBottom: '1px solid #ffffff' }}>
                      <th style={{ padding: '15px' }}>Nombre</th>
                      <th style={{ padding: '15px' }}>Posición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantilla.length === 0 ? (
                      <tr><td colSpan="2" style={{ padding: '15px', textAlign: 'center', color: '#cccccc' }}>Sin jugadores registrados.</td></tr>
                    ) : (
                      plantilla.map(jug => (
                        <tr key={jug.id} style={{ borderBottom: '1px solid #333333' }}>
                          <td style={{ padding: '15px' }}>{jug.nombre}</td>
                          <td style={{ padding: '15px' }}>{jug.rol}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {vistaActual === 'estadisticas-inicio' && (
            <>
              <h2 style={{ marginBottom: '20px' }}>Selecciona un Equipo para Ver Estadísticas</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {listaEquipos.length === 0 ? (
                  <p style={{ color: '#cccccc' }}>Aún no tienes ningún equipo.</p>
                ) : (
                  listaEquipos.map(equipo => (
                    <div 
                      key={equipo.id} onClick={() => verEstadisticasEquipo(equipo)} 
                      style={cardStyle}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <div style={{ fontSize: '50px', marginBottom: '10px' }}>{equipo.escudo || 'A'}</div>
                      <h4 style={{ color: '#ffffff', margin: '0 0 5px 0' }}>{equipo.nombre}</h4>
                      <p style={{ fontSize: '13px', color: '#ffffff', margin: 0, fontWeight: 'bold' }}>Ver Estadísticas</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {vistaActual === 'estadisticas-equipo' && equipoSeleccionado && (
            <>
              <button onClick={() => { setVistaActual('estadisticas-inicio'); setEquipoSeleccionado(null); }} style={{ ...btnAction(true), marginBottom: '20px' }}>
                Volver a Equipos
              </button>
              
              <h2 style={{ borderBottom: '1px solid #ffffff', paddingBottom: '10px', marginBottom: '20px' }}>
                Estadísticas: {equipoSeleccionado.nombre}
              </h2>

              <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #333' }}>
                <div 
                  onClick={() => { setPestanaEstadisticas('jugadores'); setJugadorSeleccionado(null); }} 
                  style={tabStyle(pestanaEstadisticas === 'jugadores')}
                >
                  Jugadores
                </div>
                <div 
                  onClick={() => { setPestanaEstadisticas('partidos'); setJugadorSeleccionado(null); }} 
                  style={tabStyle(pestanaEstadisticas === 'partidos')}
                >
                  Partidos
                </div>
              </div>

              {pestanaEstadisticas === 'jugadores' && (
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ flex: 1, backgroundColor: '#000000', border: '1px solid #ffffff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#111111', borderBottom: '1px solid #ffffff' }}>
                          <th style={{ padding: '15px' }}>Nombre</th>
                          <th style={{ padding: '15px' }}>Posición</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plantilla.map(jug => (
                          <tr 
                            key={jug.id} 
                            onClick={() => { setJugadorSeleccionado(jug); cargarEstadisticasGlobales(jug.id); }}
                            style={{ 
                              borderBottom: '1px solid #333333', cursor: 'pointer',
                              backgroundColor: jugadorSeleccionado?.id === jug.id ? '#222' : 'transparent' 
                            }}
                          >
                            <td style={{ padding: '15px' }}>{jug.nombre}</td>
                            <td style={{ padding: '15px' }}>{jug.rol}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {jugadorSeleccionado && estadisticasGlobales && (
                    <div style={{ flex: 1, backgroundColor: '#000000', border: '1px solid #ffffff', padding: '20px' }}>
                      <h3 style={{ marginTop: 0 }}>Estadísticas Globales: {jugadorSeleccionado.nombre}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        <div style={globalStatBox}>
                          <span>Partidos Jugados:</span>
                          <strong>{estadisticasGlobales.partidos_jugados}</strong>
                        </div>
                        <div style={globalStatBox}>
                          <span>Total de Goles:</span>
                          <strong>{estadisticasGlobales.total_goles}</strong>
                        </div>
                        <div style={globalStatBox}>
                          <span>Promedio de Goles:</span>
                          <strong>{estadisticasGlobales.promedio_goles}</strong>
                        </div>
                        <div style={globalStatBox}>
                          <span>Minutos Totales:</span>
                          <strong>{estadisticasGlobales.total_minutos}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pestanaEstadisticas === 'partidos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {!torneoSeleccionado && (
                    <div>
                      <h3>Selecciona un Torneo</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        {torneosEquipo.length === 0 ? <p>No hay torneos registrados para este equipo.</p> : 
                          torneosEquipo.map(t => (
                            <div key={t.id} onClick={() => seleccionarTorneo(t)} style={cardStyle}>
                              <h4>{t.nombre}</h4>
                              <p style={{ fontSize: '12px', color: '#ccc' }}>Formato: {t.formato}</p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {torneoSeleccionado && !partidoSeleccionado && (
                    <div>
                      <button onClick={() => setTorneoSeleccionado(null)} style={{...btnAction(true), marginBottom: '15px'}}>Volver a Torneos</button>
                      <h3>Partidos en {torneoSeleccionado.nombre}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                        {partidosEquipo.length === 0 ? <p>No hay partidos programados.</p> :
                          partidosEquipo.map(p => (
                            <div key={p.id} onClick={() => seleccionarPartido(p)} style={cardStyle}>
                              <p style={{ fontSize: '12px', color: '#ccc', marginBottom: '5px' }}>{new Date(p.fecha_partido).toLocaleDateString()}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{p.local_nombre}</span>
                                <strong>VS</strong>
                                <span>{p.visitante_nombre}</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {partidoSeleccionado && (
                    <div>
                      <button onClick={() => { setPartidoSeleccionado(null); setJugadorSeleccionado(null); }} style={{...btnAction(true), marginBottom: '15px'}}>Volver a Partidos</button>
                      <h3>Estadísticas del Partido</h3>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        
                        {/* Lista de Jugadores */}
                        <div style={{ flex: 1, backgroundColor: '#000000', border: '1px solid #ffffff' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#111111', borderBottom: '1px solid #ffffff' }}>
                                <th style={{ padding: '15px' }}>Jugador</th>
                                <th style={{ padding: '15px' }}>Posición</th>
                              </tr>
                            </thead>
                            <tbody>
                              {plantilla.map(jug => (
                                <tr 
                                  key={jug.id} 
                                  onClick={() => cargarEstadisticasJugadorPartido(jug)}
                                  style={{ 
                                    borderBottom: '1px solid #333333', cursor: 'pointer',
                                    backgroundColor: jugadorSeleccionado?.id === jug.id ? '#222' : 'transparent' 
                                  }}
                                >
                                  <td style={{ padding: '15px' }}>{jug.nombre}</td>
                                  <td style={{ padding: '15px' }}>{jug.rol}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Formulario de Estadísticas */}
                        {jugadorSeleccionado && (
                          <div style={{ flex: 2, backgroundColor: '#000000', border: '1px solid #ffffff', padding: '20px' }}>
                            <h3 style={{ marginTop: 0 }}>Estadísticas: {jugadorSeleccionado.nombre} ({jugadorSeleccionado.rol})</h3>
                            <form onSubmit={guardarEstadisticasPartido}>
                              
                              <h4 style={{ borderBottom: '1px dashed #555', paddingBottom: '5px' }}>Base</h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                {renderNumberInput('Minutos Jugados', 'minutos_jugados')}
                                {renderNumberInput('Goles', 'goles')}
                                {renderNumberInput('Asistencias', 'asistencias')}
                                {renderNumberInput('T. Amarillas', 'tarjetas_amarillas')}
                                {renderNumberInput('T. Rojas', 'tarjetas_rojas')}
                              </div>

                              {jugadorSeleccionado.rol === 'Portero' && (
                                <>
                                  <h4 style={{ borderBottom: '1px dashed #555', paddingBottom: '5px', marginTop: '10px' }}>Portero</h4>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {renderNumberInput('Atajadas', 'atajadas')}
                                    {renderNumberInput('Goles Recibidos', 'goles_recibidos')}
                                    {renderNumberInput('Porterías en 0', 'porterias_en_cero')}
                                    {renderNumberInput('Penales Atajados', 'penales_atajados')}
                                    {renderNumberInput('Salidas', 'salidas')}
                                  </div>
                                </>
                              )}

                              {jugadorSeleccionado.rol === 'Defensa' && (
                                <>
                                  <h4 style={{ borderBottom: '1px dashed #555', paddingBottom: '5px', marginTop: '10px' }}>Defensa</h4>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {renderNumberInput('Entradas', 'entradas')}
                                    {renderNumberInput('Intercepciones', 'intercepciones')}
                                    {renderNumberInput('Despejes', 'despejes')}
                                    {renderNumberInput('Duelos Ganados', 'duelos_ganados')}
                                    {renderNumberInput('Faltas Cometidas', 'faltas_cometidas')}
                                  </div>
                                </>
                              )}

                              {jugadorSeleccionado.rol === 'Medio' && (
                                <>
                                  <h4 style={{ borderBottom: '1px dashed #555', paddingBottom: '5px', marginTop: '10px' }}>Mediocampista</h4>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {renderNumberInput('Pases Completados', 'pases_completados')}
                                    {renderNumberInput('Pases Clave', 'pases_clave')}
                                    {renderNumberInput('Recuperaciones', 'recuperaciones')}
                                  </div>
                                  <div style={{ marginTop: '10px' }}>
                                    {renderPercentageInput('Precisión de Pase (%)', 'precision_pase')}
                                  </div>
                                </>
                              )}

                              {jugadorSeleccionado.rol === 'Delantero' && (
                                <>
                                  <h4 style={{ borderBottom: '1px dashed #555', paddingBottom: '5px', marginTop: '10px' }}>Delantero</h4>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                    {renderNumberInput('Tiros', 'tiros')}
                                    {renderNumberInput('Tiros a Puerta', 'tiros_a_puerta')}
                                  </div>
                                  <div style={{ marginTop: '10px' }}>
                                    {renderPercentageInput('% de Efectividad', 'efectividad')}
                                  </div>
                                </>
                              )}

                              {!modoEdicion ? (
                                <button type="button" onClick={() => setModoEdicion(true)} style={{ ...btnAction(true), width: '100%', marginTop: '20px' }}>
                                  Editar Estadísticas
                                </button>
                              ) : (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                  <button type="submit" style={{ ...btnAction(true), flex: 1 }}>
                                    Guardar Estadísticas
                                  </button>
                                  {estadisticasActuales.id && (
                                    <button type="button" onClick={() => cargarEstadisticasJugadorPartido(jugadorSeleccionado)} style={{ ...btnAction(true), flex: 1, backgroundColor: 'transparent', border: '1px dashed #ffffff' }}>
                                      Cancelar
                                    </button>
                                  )}
                                </div>
                              )}
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </>
          )}

        </div>
      </div>

      {/* MODAL: REGISTRAR EQUIPO */}
      {modalEquipo && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Registrar Nuevo Equipo</h3>
            <form onSubmit={guardarEquipo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '14px', color: '#cccccc', marginBottom: '5px', display: 'block' }}>Selecciona una Liga para Unirte:</label>
                <select required value={nuevoEquipo.slug_liga} onChange={e => setNuevoEquipo({...nuevoEquipo, slug_liga: e.target.value})} style={inputStyle}>
                  <option value="">-- Elige una Liga --</option>
                  {ligasDisponibles.map((liga) => (
                    <option key={liga.subdominio_o_slug} value={liga.subdominio_o_slug}>{liga.nombre_liga}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '14px', color: '#cccccc', marginBottom: '5px', display: 'block' }}>Selecciona un Escudo:</label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: '#000000', border: '1px solid #ffffff', padding: '10px' }}>
                  {iconosDisponibles.map((icono, index) => (
                    <div 
                      key={index} onClick={() => setNuevoEquipo({...nuevoEquipo, escudo: icono})}
                      style={{
                        fontSize: '30px', cursor: 'pointer', padding: '5px 10px',
                        border: nuevoEquipo.escudo === icono ? '1px solid #ffffff' : '1px solid transparent',
                        backgroundColor: nuevoEquipo.escudo === icono ? '#111111' : 'transparent',
                        transition: 'all 0.2s'
                      }}
                    >
                      {icono}
                    </div>
                  ))}
                </div>
              </div>
              <input placeholder="Nombre del Equipo" required value={nuevoEquipo.nombre} onChange={e => setNuevoEquipo({...nuevoEquipo, nombre: e.target.value})} style={inputStyle} />
              <input placeholder="Nombre del Representante/DT" required value={nuevoEquipo.representante} onChange={e => setNuevoEquipo({...nuevoEquipo, representante: e.target.value})} style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={btnSubmit}>Guardar</button>
                <button type="button" onClick={() => setModalEquipo(false)} style={btnCancel}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// --- ESTILOS ---
const inputStyle = { padding: '10px', border: '1px solid #ffffff', backgroundColor: '#000000', color: '#ffffff', outline: 'none', width: '100%', boxSizing: 'border-box' };
const sidebarItem = (activo) => ({ padding: '15px 20px', borderBottom: '1px solid #ffffff', cursor: 'pointer', color: '#ffffff', backgroundColor: activo ? '#111111' : 'transparent', fontWeight: activo ? 'bold' : 'normal', transition: 'opacity 0.2s', opacity: activo ? 1 : 0.7 });
const btnAction = (suscrito) => ({ backgroundColor: '#000000', color: '#ffffff', border: '1px solid #ffffff', padding: '10px 15px', cursor: suscrito ? 'pointer' : 'not-allowed', fontWeight: 'bold', transition: 'opacity 0.2s', opacity: suscrito ? 1 : 0.5 });
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#000000', padding: '30px', border: '1px solid #ffffff', width: '400px', color: '#ffffff' };
const btnSubmit = { backgroundColor: '#000000', color: '#ffffff', padding: '10px', border: '1px solid #ffffff', cursor: 'pointer', flex: 1, fontWeight: 'bold' };
const btnCancel = { backgroundColor: '#000000', color: '#ffffff', padding: '10px', border: '1px dashed #ffffff', cursor: 'pointer', flex: 1, fontWeight: 'bold' };
const cardStyle = { backgroundColor: '#000000', padding: '20px', border: '1px solid #ffffff', textAlign: 'center', cursor: 'pointer', transition: 'opacity 0.2s' };
const tabStyle = (activo) => ({ padding: '10px 20px', cursor: 'pointer', borderBottom: activo ? '3px solid #ffffff' : 'none', fontWeight: activo ? 'bold' : 'normal', color: activo ? '#ffffff' : '#aaaaaa', transition: 'all 0.2s' });
const globalStatBox = { display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #333', borderRadius: '5px', backgroundColor: '#111' };

export default DashboardCapitan;
