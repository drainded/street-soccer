import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardOrganizador = ({ usuario, setUsuario }) => {
  const navigate = useNavigate();

  const [listaArbitros, setListaArbitros] = useState([]);
  const [arbitrosTorneo, setArbitrosTorneo] = useState([]);
  const [nuevoArbitro, setNuevoArbitro] = useState('');

  const [listaCanchas, setListaCanchas] = useState([]);
  const [nuevaCancha, setNuevaCancha] = useState({ nombre: '', ubicacion: '' });

  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [listaJugadores, setListaJugadores] = useState([]);
  const [nuevoJugador, setNuevoJugador] = useState({ nombre: '', rol: 'Delantero' });

  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null);
  const [listaPartidos, setListaPartidos] = useState([]);
  const [nuevoPartido, setNuevoPartido] = useState({ equipo_local_id: '', equipo_visitante_id: '', fecha_partido: '' });

  // 1. Estados para modales de creación
  const [modalTorneo, setModalTorneo] = useState(false);
  const [modalEquipo, setModalEquipo] = useState(false);
  const [nuevoTorneo, setNuevoTorneo] = useState({ nombre: '', formato: 'Liga', fecha_inicio: '', fecha_termino: '', cancha_id: '', arbitro_id: '' });
  const [nuevoEquipo, setNuevoEquipo] = useState({ nombre: '', representante: '', escudo: 'A' });

  const iconosDisponibles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // 2. Estados para el modal de suscripción
  const [modalSuscripcion, setModalSuscripcion] = useState(false);
  const [datosSuscripcion, setDatosSuscripcion] = useState({
    nombre_liga: '',
    subdominio_o_slug: '',
    plan: 'Bronce'
  });

  const [listaEquipos, setListaEquipos] = useState([]);

  // Cada vez que el componente carga o el usuario cambia de estatus, buscamos sus equipos
  useEffect(() => {
    if (usuario && usuario.slug_liga) {
      verificarAcceso(); // 1. Primero checa si sigue activo
      cargarTorneos();
      cargarEquipos();
      cargarArbitros();
      cargarCanchas();
    }
  }, [usuario?.slug_liga]);

  const verificarAcceso = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/estatus-liga/${usuario.slug_liga}`);
      if (res.ok) {
        const data = await res.json();

        // Si la base de datos dice que estatus_pago es false, pero React cree que es true:
        if (data.activo === false && usuario.suscrito === true) {
          // Bloqueamos la interfaz instantáneamente
          setUsuario({ ...usuario, suscrito: false });
          alert("Tu suscripción ha sido suspendida por el Administrador. Renueva tu plan para recuperar el acceso.");
        }
      }
    } catch (error) {
      console.error("Error al verificar acceso", error);
    }
  };

  const cargarEquipos = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/equipos/${usuario.slug_liga}`);
      if (res.ok) {
        const data = await res.json();
        setListaEquipos(data);
      }
    } catch (error) {
      console.error("Error al cargar equipos", error);
    }
  };

  const cargarCanchas = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/canchas/${usuario.slug_liga}`);
      if (res.ok) {
        const data = await res.json();
        setListaCanchas(data);
      }
    } catch (error) {
      console.error("Error al cargar canchas", error);
    }
  };

  // Si intenta entrar sin cuenta, lo mandamos al login
  if (!usuario) {
    return <div style={{ padding: '20px' }}>Por favor inicia sesión primero. <button onClick={() => navigate('/login')}>Ir al Login</button></div>;
  }

  // --- FUNCIONES API ---

  // Enviar la suscripción al servidor (Conecta con SuperAdmin)
  const finalizarSuscripcion = async (e) => {
    e.preventDefault();

    // Si ya tiene slug, usamos ese; si no, usamos el del input
    const slugAEnviar = usuario.slug_liga || datosSuscripcion.subdominio_o_slug;
    const nombreAEnviar = usuario.nombre_liga || datosSuscripcion.nombre_liga;

    try {
      const res = await fetch('http://localhost:3001/api/suscripcion-organizador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_liga: nombreAEnviar,
          subdominio_o_slug: slugAEnviar,
          plan: datosSuscripcion.plan,
          nombre_dueno: usuario.nombre
        })
      });

      if (res.ok) {
        setUsuario({ ...usuario, suscrito: true, slug_liga: slugAEnviar });
        setModalSuscripcion(false);
        alert("¡Cuenta reactivada con éxito!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const guardarTorneo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoTorneo, slug_liga: datosSuscripcion.subdominio_o_slug || usuario.slug_liga })
      });
      if (res.ok) {
        const torneoCreado = await res.json();
        
        // Asignar árbitro si se eligió
        if (nuevoTorneo.arbitro_id) {
          await fetch('http://localhost:3001/api/torneo-arbitros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ torneo_id: torneoCreado.id, arbitro_id: nuevoTorneo.arbitro_id })
          });
        }

        alert("¡Torneo creado con éxito!");
        setModalTorneo(false);
        setNuevoTorneo({ nombre: '', formato: 'Liga', fecha_inicio: '', fecha_termino: '', cancha_id: '', arbitro_id: '' });
        await cargarTorneos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoEquipo, slug_liga: datosSuscripcion.subdominio_o_slug || 'demo' })
      });
      if (res.ok) {
        alert("¡Equipo registrado con éxito!");
        setModalEquipo(false);
        setNuevoEquipo({ nombre: '', representante: '' });

        await cargarEquipos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [vistaActual, setVistaActual] = useState('inicio'); // 'inicio', 'torneos', 'equipos'
  const [listaTorneos, setListaTorneos] = useState([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // Cargar torneos cuando el usuario tenga su slug_liga
  useEffect(() => {
    if (usuario?.slug_liga) {
      cargarTorneos();
      cargarEquipos(); // La que ya tenías
    }
  }, [usuario?.slug_liga]);

  const cargarTorneos = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/torneos/${usuario.slug_liga}`);
      if (res.ok) {
        const data = await res.json();
        setListaTorneos(data);

        cargarTorneos()
      }
    } catch (error) {
      console.error("Error al cargar torneos", error);
    }
  };

  const cargarArbitros = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/arbitros/${usuario.slug_liga}`);
      if (res.ok) {
        const data = await res.json();
        setListaArbitros(data);
      }
    } catch (error) {
      console.error("Error al cargar árbitros", error);
    }
  };

  //manejar partidos
  const abrirCalendario = async (torneo) => {
    setTorneoSeleccionado(torneo);
    setVistaActual('calendario');

    // Cargar los partidos de este torneo
    try {
      const res = await fetch(`http://localhost:3001/api/partidos/${torneo.id}`);
      if (res.ok) {
        const data = await res.json();
        setListaPartidos(data);
      }

      const resArb = await fetch(`http://localhost:3001/api/torneo-arbitros/${torneo.id}`);
      if (resArb.ok) setArbitrosTorneo(await resArb.json());

    } catch (error) {
      console.error(error);
    }
  };

  const guardarPartido = async (e) => {
    e.preventDefault();
    try {
      // Registrar ambos equipos en el torneo si es necesario (el backend puede manejar duplicados o lo hacemos para asegurar)
      await fetch('http://localhost:3001/api/torneo-equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          torneo_id: torneoSeleccionado.id, 
          equipos_ids: [nuevoPartido.equipo_local_id, nuevoPartido.equipo_visitante_id] 
        })
      });

      const res = await fetch('http://localhost:3001/api/partidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoPartido, torneo_id: torneoSeleccionado.id })
      });
      if (res.ok) {
        alert("Partido programado con éxito");
        setNuevoPartido({ equipo_local_id: '', equipo_visitante_id: '', fecha_partido: '' });
        abrirCalendario(torneoSeleccionado); // Recargar la lista
      } else {
        alert("Error al programar el partido.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const verPlantilla = async (equipo) => {
    setEquipoSeleccionado(equipo);
    setVistaActual('plantilla');
    try {
      const res = await fetch(`http://localhost:3001/api/jugadores/${equipo.id}`);
      if (res.ok) {
        const data = await res.json();
        setListaJugadores(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const guardarJugador = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/jugadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nuevoJugador, equipo_id: equipoSeleccionado.id })
      });
      if (res.ok) {
        setNuevoJugador({ nombre: '', rol: 'Delantero' });
        verPlantilla(equipoSeleccionado); // Recargar lista
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#000000', color: '#ffffff' }}>

      {/* BARRA LATERAL (Sidebar) */}
      <div style={{ width: '250px', backgroundColor: '#000000', borderRight: '1px solid #ffffff', padding: '20px 0' }}>
        <div style={{ padding: '0 20px', marginBottom: '20px' }}>
          <img 
            src="/assetsinterfaz/logo_principal.png" 
            alt="StreetSoccer Logo" 
            style={{ width: '100%', cursor: 'pointer' }} 
            onClick={() => navigate('/')}
          />
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li onClick={() => setVistaActual('inicio')} style={sidebarItem(vistaActual === 'inicio')}>Inicio</li>
          <li onClick={() => setVistaActual('torneos')} style={sidebarItem(vistaActual === 'torneos')}>Torneos</li>
          <li onClick={() => setVistaActual('equipos')} style={sidebarItem(vistaActual === 'equipos')}>Equipos</li>
          <li onClick={() => setVistaActual('arbitros')} style={sidebarItem(vistaActual === 'arbitros')}>Árbitros</li>
          <li onClick={() => setVistaActual('canchas')} style={sidebarItem(vistaActual === 'canchas')}>Canchas</li>
        </ul>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* BARRA SUPERIOR */}
        <div style={{ backgroundColor: '#000000', borderBottom: '1px solid #ffffff', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', color: '#ffffff' }}>
          <span style={{ marginRight: '20px' }}>{usuario.correo}</span>
          <div style={{ width: '35px', height: '35px', border: '1px solid #ffffff', backgroundColor: '#000000' }}></div>
        </div>

        {/* ÁREA DE TRABAJO */}
        <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>

          {/* BANNER DE SUSCRIPCIÓN */}
          {!usuario.suscrito && (
            <div style={{ backgroundColor: '#000000', border: '1px solid #ffffff', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>Estás en modo Lectura (Plan Gratuito)</h3>
                <p style={{ margin: 0, color: '#cccccc' }}>Solo puedes ver las ligas de otros. Para crear torneos y gestionar tu liga, suscríbete.</p>
              </div>
              <button
                onClick={() => setModalSuscripcion(true)}
                style={btnAction(true)}
              >
                Suscribirse Ahora
              </button>
            </div>
          )}

          {/* ==================================== */}
          {/* --- VISTA: INICIO ---                */}
          {/* ==================================== */}
          {vistaActual === 'inicio' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Hola, {usuario.nombre}</h2>

                {/* BOTONES GLOBALES */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setMostrarCalendario(!mostrarCalendario)}
                    style={btnAction(usuario.suscrito)} 
                    disabled={!usuario.suscrito}
                  >
                    {mostrarCalendario ? 'Ocultar Calendario' : 'Generar Calendario'}
                  </button>
                </div>
              </div>
              <p style={{ color: '#cccccc', fontSize: '16px' }}>
                Bienvenido al resumen de tu liga. Selecciona "Torneos" o "Equipos" en el menú lateral para comenzar a gestionar tu torneo.
              </p>

              {mostrarCalendario && (
                <div style={{ marginTop: '20px', backgroundColor: '#000000', border: '1px solid #ffffff', padding: '20px' }}>
                  <h3 style={{ borderBottom: '1px solid #ffffff', paddingBottom: '10px', marginTop: 0 }}>Próximos Torneos</h3>
                  {listaTorneos.length === 0 ? (
                    <p style={{ color: '#cccccc' }}>No hay torneos próximos registrados.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {listaTorneos.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111111', padding: '15px', border: '1px solid #333333' }}>
                          <div>
                            <strong style={{ fontSize: '18px', color: '#ffffff' }}>{t.nombre}</strong>
                            <div style={{ color: '#cccccc', fontSize: '14px', marginTop: '5px' }}>Formato: {t.formato}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffffff' }}>{new Date(t.fecha_inicio).toLocaleDateString()}</div>
                            {t.cancha_nombre && <div style={{ color: '#aaaaaa', fontSize: '13px', marginTop: '5px' }}>📍 {t.cancha_nombre}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ==================================== */}
          {/* --- VISTA: TORNEOS ---               */}
          {/* ==================================== */}
          {vistaActual === 'torneos' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Mis Torneos</h2>
                <button onClick={() => setModalTorneo(true)} style={btnAction(usuario.suscrito)} disabled={!usuario.suscrito}>
                  + Crear Torneo
                </button>
              </div>

              {/* Bloqueamos la lista si no está suscrito */}
              {!usuario.suscrito ? (
                <div style={lockedStateStyle}>
                  <h3>Sección Bloqueada</h3>
                  <p>Tu cuenta está suspendida. Reactiva tu suscripción para ver y gestionar tus torneos.</p>
                </div>
              ) : (

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {listaTorneos.length === 0 ? (
                    <p style={{ color: '#cccccc' }}>Aún no tienes torneos registrados. ¡Crea el primero!</p>
                  ) : (
                    listaTorneos.map(t => (
                      <div key={t.id} style={cardStyle}>
                        <h4 style={{ color: '#ffffff', margin: '0 0 10px 0', fontSize: '18px' }}>{t.nombre}</h4>
                        <p style={{ margin: '5px 0', color: '#cccccc' }}>Formato: <strong>{t.formato}</strong></p>
                        <p style={{ margin: '5px 0', color: '#cccccc' }}>Inicia: {new Date(t.fecha_inicio).toLocaleDateString()}</p>
                        {t.fecha_termino && <p style={{ margin: '5px 0', color: '#cccccc' }}>Termina: {new Date(t.fecha_termino).toLocaleDateString()}</p>}
                        {t.cancha_nombre && <p style={{ margin: '5px 0', color: '#cccccc' }}>Cancha: <strong>{t.cancha_nombre}</strong></p>}
                        <button
                          onClick={() => abrirCalendario(t)}
                          style={btnAction(true)}>
                          Ver Información del Torneo
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

            </>
          )}

          {/* ==================================== */}
          {/* --- VISTA: EQUIPOS ---               */}
          {/* ==================================== */}
          {vistaActual === 'equipos' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Mis Equipos Registrados</h2>
              </div>

              {/* Bloqueamos la lista si no está suscrito */}
              {!usuario.suscrito ? (
                <div style={lockedStateStyle}>
                  <h3>Sección Bloqueada</h3>
                  <p>Tu cuenta está suspendida. Reactiva tu suscripción para ver y gestionar tus torneos.</p>
                </div>
              ) : (


                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {listaEquipos.length === 0 ? (
                    <p style={{ color: '#cccccc' }}>Aún no has registrado ningún equipo. ¡Crea el primero!</p>
                  ) : (

                    listaEquipos.map(equipo => (
                      <div
                        key={equipo.id}
                        onClick={() => verPlantilla(equipo)}
                        style={{
                          backgroundColor: '#000000',
                          padding: '20px',
                          border: '1px solid #ffffff',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <div style={{ fontSize: '50px', marginBottom: '10px' }}>{equipo.escudo || 'A'}</div>
                        <h4 style={{ color: '#ffffff', margin: '0 0 5px 0' }}>{equipo.nombre}</h4>
                        <p style={{ fontSize: '12px', color: '#cccccc', margin: '0 0 10px 0' }}>DT: {equipo.representante}</p>

                        {/* Un texto extra para que sea muy intuitivo */}
                        <p style={{ fontSize: '13px', color: '#ffffff', margin: 0, fontWeight: 'bold' }}>
                          Gestionar plantilla
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* ==================================== */}
          {/* --- VISTA: CALENDARIO DEL TORNEO --- */}
          {/* ==================================== */}
          {vistaActual === 'calendario' && torneoSeleccionado && (
            <>
              {/* 1. ENCABEZADO (Título y botón de volver) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="titulo-panel" style={{ margin: 0, border: 'none', padding: 0 }}>
                  Información del Torneo: {torneoSeleccionado.nombre}
                </h2>
                <button onClick={() => setVistaActual('torneos')} style={btnAction(true)}>
                  Volver a Torneos
                </button>
              </div>
              {/* AQUÍ CIERRA EL ENCABEZADO, LO SIGUIENTE VA DEBAJO */}
              
              {/* FORMULARIO CREAR PARTIDO */}
              <div style={{ backgroundColor: '#111111', padding: '20px', border: '1px solid #ffffff', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>Programar Enfrentamiento</h3>
                <form onSubmit={guardarPartido} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select required style={{ flex: 1, ...inputStyle }} value={nuevoPartido.equipo_local_id} onChange={e => setNuevoPartido({ ...nuevoPartido, equipo_local_id: e.target.value })}>
                      <option value="">Seleccionar Local...</option>
                      {listaEquipos.map(eq => <option key={eq.id} value={eq.id}>{eq.escudo} {eq.nombre}</option>)}
                    </select>
                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>VS</span>
                    <select required style={{ flex: 1, ...inputStyle }} value={nuevoPartido.equipo_visitante_id} onChange={e => setNuevoPartido({ ...nuevoPartido, equipo_visitante_id: e.target.value })}>
                      <option value="">Seleccionar Visitante...</option>
                      {listaEquipos.map(eq => <option key={eq.id} value={eq.id}>{eq.escudo} {eq.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', color: '#cccccc', display: 'block', marginBottom: '5px' }}>Fecha del Partido:</label>
                    <input 
                      type="date" required 
                      min={torneoSeleccionado.fecha_inicio.split('T')[0]} 
                      max={torneoSeleccionado.fecha_termino ? torneoSeleccionado.fecha_termino.split('T')[0] : ''}
                      value={nuevoPartido.fecha_partido} 
                      onChange={e => setNuevoPartido({ ...nuevoPartido, fecha_partido: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                  <button type="submit" style={btnAction(true)}>
                    + Guardar Partido
                  </button>
                </form>
              </div>

              {/* LISTA DE PARTIDOS PROGRAMADOS */}
              <div style={{ display: 'grid', gap: '15px' }}>
                {listaPartidos.length === 0 ? (
                  <p>No hay partidos programados aún.</p>
                ) : (
                  listaPartidos.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000000', border: '1px solid #ffffff', padding: '15px 30px' }}>
                      <span style={{ color: '#cccccc', width: '100px' }}>{new Date(p.fecha_partido).toLocaleDateString()}</span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'center' }}>
                        <h3 style={{ margin: 0 }}>{p.local_escudo} {p.local_nombre}</h3>
                        <span style={{ backgroundColor: '#000000', border: '1px solid #ffffff', color: '#ffffff', padding: '5px 15px', fontWeight: 'bold' }}>
                          {p.resultado}
                        </span>
                        <h3 style={{ margin: 0 }}>{p.visitante_nombre} {p.visitante_escudo}</h3>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ==================================== */}
          {/* --- VISTA: PLANTILLA (JUGADORES) --- */}
          {/* ==================================== */}
          {vistaActual === 'plantilla' && equipoSeleccionado && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '40px' }}>{equipoSeleccionado.escudo}</span>
                  <h2 style={{ margin: 0 }}>Plantilla: {equipoSeleccionado.nombre}</h2>
                </div>
                <button onClick={() => setVistaActual('equipos')} style={btnAction(true)}>
                  Volver a Equipos
                </button>
              </div>



              {/* LISTADO DE JUGADORES */}
              <div style={{ backgroundColor: '#000000', border: '1px solid #ffffff', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#111111' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ffffff' }}>Nombre</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ffffff' }}>Posición / Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaJugadores.map(j => (
                      <tr key={j.id} style={{ borderBottom: '1px solid #ffffff' }}>
                        <td style={{ padding: '12px' }}>{j.nombre}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ border: '1px solid #ffffff', color: '#ffffff', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}>
                            {j.rol.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ==================================== */}
          {/* --- VISTA: GESTIÓN DE ÁRBITROS ---   */}
          {/* ==================================== */}
          {vistaActual === 'arbitros' && (
            <>
              <h2 className="titulo-panel" style={{ textAlign: 'left', borderBottom: 'none' }}>Mi Plantilla de Árbitros</h2>

              <div style={{ backgroundColor: '#000000', padding: '20px', border: '1px solid #ffffff', marginBottom: '20px' }}>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch('http://localhost:3001/api/arbitros', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug_liga: usuario.slug_liga, nombre: nuevoArbitro })
                  });
                  if (res.ok) { setNuevoArbitro(''); cargarArbitros(); }
                }} style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Nombre completo del árbitro" required value={nuevoArbitro} onChange={e => setNuevoArbitro(e.target.value)} style={{ flex: 1, ...inputStyle }} />
                  <button type="submit" style={btnAction(true)}>
                    + Registrar Árbitro
                  </button>
                </form>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {listaArbitros.map(arb => (
                  <div key={arb.id} style={{ backgroundColor: '#000000', padding: '15px', border: '1px solid #ffffff' }}>
                    <h4 style={{ margin: 0, color: '#ffffff' }}>{arb.nombre}</h4>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#cccccc' }}>Árbitro Oficial</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ==================================== */}
          {/* --- VISTA: GESTIÓN DE CANCHAS ---    */}
          {/* ==================================== */}
          {vistaActual === 'canchas' && (
            <>
              <h2 className="titulo-panel" style={{ textAlign: 'left', borderBottom: 'none' }}>Mis Canchas Registradas</h2>

              <div style={{ backgroundColor: '#000000', padding: '20px', border: '1px solid #ffffff', marginBottom: '20px' }}>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const res = await fetch('http://localhost:3001/api/canchas', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug_liga: usuario.slug_liga, nombre: nuevaCancha.nombre, ubicacion: nuevaCancha.ubicacion })
                  });
                  if (res.ok) { 
                    setNuevaCancha({ nombre: '', ubicacion: '' }); 
                    cargarCanchas(); 
                  }
                }} style={{ display: 'flex', gap: '10px' }}>
                  <input placeholder="Nombre de la cancha" required value={nuevaCancha.nombre} onChange={e => setNuevaCancha({ ...nuevaCancha, nombre: e.target.value })} style={{ flex: 1, ...inputStyle }} />
                  <input placeholder="Ubicación" required value={nuevaCancha.ubicacion} onChange={e => setNuevaCancha({ ...nuevaCancha, ubicacion: e.target.value })} style={{ flex: 2, ...inputStyle }} />
                  <button type="submit" style={btnAction(true)}>
                    + Añadir Cancha
                  </button>
                </form>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {listaCanchas.map(cancha => (
                  <div key={cancha.id} style={{ backgroundColor: '#000000', padding: '15px', border: '1px solid #ffffff', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src="/assetsinterfaz/cancha.png" alt="Cancha" style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '10px' }} />
                    <div>
                      <h4 style={{ margin: 0, color: '#ffffff', fontSize: '18px' }}>{cancha.nombre}</h4>
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#cccccc' }}>{cancha.ubicacion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL: SUSCRIPCIÓN (ALTA DE LIGA)         */}
      {/* ========================================= */}
      {modalSuscripcion && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            {/* Título dinámico */}
            <h3>{usuario.slug_liga ? 'Reactivar Suscripción' : 'Activar Suscripción'}</h3>

            <form onSubmit={finalizarSuscripcion} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Solo mostramos los inputs si NO tiene una liga registrada */}
              {!usuario.slug_liga ? (
                <>
                  <input
                    placeholder="Nombre de la Liga" required
                    value={datosSuscripcion.nombre_liga}
                    onChange={e => setDatosSuscripcion({ ...datosSuscripcion, nombre_liga: e.target.value })}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Identificador (slug)" required
                    value={datosSuscripcion.subdominio_o_slug}
                    onChange={e => setDatosSuscripcion({ ...datosSuscripcion, subdominio_o_slug: e.target.value })}
                    style={inputStyle}
                  />
                </>
              ) : (
                <div style={{ backgroundColor: '#111111', padding: '15px', border: '1px solid #ffffff', marginBottom: '10px' }}>
                  <p style={{ margin: 0 }}><strong>Liga:</strong> {usuario.nombre_liga || 'Tu liga existente'}</p>
                  <p style={{ margin: 0 }}><strong>ID:</strong> {usuario.slug_liga}</p>
                  <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '10px' }}>
                    Ya tienes una liga registrada. Al confirmar, recuperarás el acceso inmediato.
                  </p>
                </div>
              )}

              <select style={inputStyle} value={datosSuscripcion.plan} onChange={e => setDatosSuscripcion({ ...datosSuscripcion, plan: e.target.value })}>
                <option value="Bronce">Plan Bronce</option>
                <option value="Plata">Plan Plata</option>
                <option value="Oro">Plan Oro</option>
              </select>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" style={btnSubmit}>
                  {usuario.slug_liga ? 'Pagar y Reactivar' : 'Confirmar y Pagar'}
                </button>
                <button type="button" onClick={() => setModalSuscripcion(false)} style={btnCancel}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: CREAR TORNEO                       */}
      {/* ========================================= */}
      {modalTorneo && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Crear Nuevo Torneo</h3>
            <form onSubmit={guardarTorneo} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                placeholder="Nombre del Torneo" required
                value={nuevoTorneo.nombre} onChange={e => setNuevoTorneo({ ...nuevoTorneo, nombre: e.target.value })}
                style={inputStyle}
              />
              <select style={inputStyle} value={nuevoTorneo.formato} onChange={e => setNuevoTorneo({ ...nuevoTorneo, formato: e.target.value })}>
                <option value="Liga">Formato Liga (Todos vs Todos)</option>
                <option value="Eliminatoria">Eliminatoria Directa</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', color: '#cccccc', display: 'block', marginBottom: '5px' }}>Fecha de Inicio:</label>
                  <input
                    type="date" required
                    value={nuevoTorneo.fecha_inicio} onChange={e => setNuevoTorneo({ ...nuevoTorneo, fecha_inicio: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', color: '#cccccc', display: 'block', marginBottom: '5px' }}>Fecha de Término:</label>
                  <input
                    type="date" required
                    min={nuevoTorneo.fecha_inicio}
                    value={nuevoTorneo.fecha_termino} onChange={e => setNuevoTorneo({ ...nuevoTorneo, fecha_termino: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <select style={inputStyle} value={nuevoTorneo.cancha_id} onChange={e => setNuevoTorneo({ ...nuevoTorneo, cancha_id: e.target.value })}>
                <option value="">(Opcional) Seleccionar Cancha</option>
                {listaCanchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>

              <select style={inputStyle} value={nuevoTorneo.arbitro_id} onChange={e => setNuevoTorneo({ ...nuevoTorneo, arbitro_id: e.target.value })}>
                <option value="">(Opcional) Seleccionar Árbitro</option>
                {listaArbitros.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="submit" style={btnSubmit}>Guardar Torneo</button>
                <button type="button" onClick={() => setModalTorneo(false)} style={btnCancel}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: CREAR EQUIPO                       */}
      {/* ========================================= */}
      {modalEquipo && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3>Registrar Equipo</h3>
            <form onSubmit={guardarEquipo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

              {/* SECCIÓN DE ESCUDO */}
              <div>
                <label style={{ fontSize: '14px', color: '#cccccc', marginBottom: '5px', display: 'block' }}>
                  Selecciona un Escudo:
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: '#000000', border: '1px solid #ffffff', padding: '10px' }}>
                  {iconosDisponibles.map((icono, index) => (
                    <div
                      key={index}
                      onClick={() => setNuevoEquipo({ ...nuevoEquipo, escudo: icono })}
                      style={{
                        fontSize: '30px',
                        cursor: 'pointer',
                        padding: '5px 10px',
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

              <input
                placeholder="Nombre del Equipo" required
                value={nuevoEquipo.nombre} onChange={e => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Nombre del Representante/DT" required
                value={nuevoEquipo.representante} onChange={e => setNuevoEquipo({ ...nuevoEquipo, representante: e.target.value })}
                style={inputStyle}
              />
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

const inputStyle = {
  padding: '10px',
  border: '1px solid #ffffff',
  backgroundColor: '#000000',
  color: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%'
};

const sidebarItem = (activo) => ({
  padding: '15px 20px',
  borderBottom: '1px solid #ffffff',
  cursor: 'pointer',
  color: '#ffffff',
  backgroundColor: activo ? '#111111' : 'transparent',
  fontWeight: activo ? 'bold' : 'normal',
  transition: 'opacity 0.2s',
  opacity: activo ? 1 : 0.7
});

const cardStyle = { backgroundColor: '#000000', padding: '20px', border: '1px solid #ffffff' };
const btnAction = (suscrito) => ({
  backgroundColor: '#000000',
  color: '#ffffff',
  border: '1px solid #ffffff',
  padding: '10px 15px',
  cursor: suscrito ? 'pointer' : 'not-allowed',
  fontWeight: 'bold',
  transition: 'opacity 0.2s',
  opacity: suscrito ? 1 : 0.5
});
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: '#000000', padding: '30px', border: '1px solid #ffffff', width: '400px', color: '#ffffff', boxSizing: 'border-box', maxWidth: '90%' };
const btnSubmit = { backgroundColor: '#000000', color: '#ffffff', padding: '10px', border: '1px solid #ffffff', cursor: 'pointer', flex: 1, fontWeight: 'bold' };
const btnCancel = { backgroundColor: '#000000', color: '#ffffff', padding: '10px', border: '1px dashed #ffffff', cursor: 'pointer', flex: 1, fontWeight: 'bold' };

const lockedStateStyle = {
  backgroundColor: '#000000',
  border: '1px dashed #ffffff',
  padding: '40px',
  textAlign: 'center',
  color: '#ffffff',
  marginTop: '20px'
};

export default DashboardOrganizador;