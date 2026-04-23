//npm run dev
import './App.css';
import API_URL from './config';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import DashboardOrganizador from './DashboardOrganizador';
import SuperAdmin from './SuperAdmin';
import VistaPublica from './VistaPublica';
import LandingPageUI from './LandingPageUI';
import DashboardCapitan from './DashboardCapitan';

function App() {
  // Estado global simulado del usuario
  const [usuario, setUsuario] = useState(null);

  return (
    <Router>
      <Routes>
        {/* 1. Módulo de Inicio (Landing Page) */}
        <Route path="/" element={<LandingPageUI />} />

        {/* 2. Login / Registro */}
        <Route path="/login" element={<Login setUsuario={setUsuario} />} />

        {/* Flujos de Registro Líder */}
        <Route path="/pago" element={<PagoSimulado usuario={usuario} />} />
        <Route path="/registro-liga" element={<RegistroLiga usuario={usuario} setUsuario={setUsuario} />} />

        {/* 3. Módulo Organizador (Cliente) */}
        <Route path="/organizador" element={<DashboardOrganizador usuario={usuario} setUsuario={setUsuario} />} />

        {/* Módulo Capitán */}
        <Route path="/dashboard-capitan" element={<DashboardCapitan usuario={usuario} setUsuario={setUsuario} />} />

        {/* 4. Módulo SuperAdmin */}
        <Route path="/superadmin" element={<SuperAdmin />} />

        {/* 5. Módulo Público (Directorio de Ligas) */}
        <Route path="/publico" element={<ModuloPublico />} />

        {/* 6. Vista Específica de una Liga */}
        <Route path="/liga/:slug" element={<VistaPublica />} />
      </Routes>
    </Router>
  );
}


// --- COMPONENTE 2: LOGIN Y REGISTRO ---
const Login = ({ setUsuario }) => {
  const navigate = useNavigate();

  // Estados para la caja de REGISTRO (Organizadores nuevos)
  const [datosRegistro, setDatosRegistro] = useState({ nombre: '', correo: '', password: '', tipo_usuario: 'Lider' });

  // Estados para la caja de INICIO DE SESIÓN (Organizador y Admin)
  const [datosLogin, setDatosLogin] = useState({ correoOusuario: '', password: '' });

  // Función para procesar un NUEVO registro en BD
  const handleRegistro = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosRegistro)
      });
      if (res.ok) {
        const data = await res.json();
        setUsuario({ ...data, suscrito: false, slug_liga: null });
        alert(`¡Bienvenido a STREETSOCCER, ${data.nombre}!`);
        if (data.tipo_usuario === 'Lider') {
          navigate('/pago');
        } else {
          navigate('/dashboard-capitan');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409) {
          alert("❌ Ese correo electrónico ya está registrado. Intenta con otro correo o inicia sesión.");
        } else {
          alert(`❌ Error al registrar: ${errData.error || 'Error desconocido del servidor'}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("❌ No se pudo conectar al servidor. Verifica tu conexión e inténtalo de nuevo.");
    }
  };

  // Función unificada para INICIAR SESIÓN con BD
  const handleLogin = async (e) => {
    e.preventDefault();

    // 1. Verificamos si es el SuperAdmin (Mantenemos esta puerta secreta)
    if (datosLogin.correoOusuario === 'admin' && datosLogin.password === 'admin') {
      navigate('/superadmin');
      return;
    }

    // 2. Si no es admin, consultamos la BD
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: datosLogin.correoOusuario, password: datosLogin.password })
      });

      if (res.ok) {
        const data = await res.json();
        setUsuario(data); // data ya trae nombre, correo, suscrito, slug_liga y tipo_usuario
        
        if (data.tipo_usuario === 'Lider') {
          navigate('/organizador');
        } else {
          navigate('/dashboard-capitan');
        }
      } else {
        alert("❌ Credenciales incorrectas.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '50px auto', display: 'flex', gap: '40px', fontFamily: 'sans-serif' }}>

      {/* CAJA 1: REGISTRO DE NUEVOS ORGANIZADORES */}
      <div style={{ flex: 1, padding: '40px', border: '1px solid #ffffff', backgroundColor: '#000000' }}>
        <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Crear Cuenta Nueva</h2>
        <p style={{ fontSize: '14px', color: '#cccccc', marginBottom: '20px' }}>Únete a SoccerTec y comienza a gestionar tus torneos hoy mismo.</p>

        <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '10px' }}>
            <label style={{ color: '#ffffff', cursor: 'pointer' }}>
              <input type="radio" name="tipo_usuario" value="Lider" checked={datosRegistro.tipo_usuario === 'Lider'} onChange={e => setDatosRegistro({ ...datosRegistro, tipo_usuario: e.target.value })} style={{ marginRight: '5px' }} />
              Líder de Liga
            </label>
            <label style={{ color: '#ffffff', cursor: 'pointer' }}>
              <input type="radio" name="tipo_usuario" value="Capitan" checked={datosRegistro.tipo_usuario === 'Capitan'} onChange={e => setDatosRegistro({ ...datosRegistro, tipo_usuario: e.target.value })} style={{ marginRight: '5px' }} />
              Capitán de Equipo
            </label>
          </div>

          <input
            placeholder="Nombre Completo" required
            onChange={e => setDatosRegistro({ ...datosRegistro, nombre: e.target.value })}
            style={inputStyle}
          />
          <input
            type="email" placeholder="Correo Electrónico" required
            onChange={e => setDatosRegistro({ ...datosRegistro, correo: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password" placeholder="Crear Contraseña" required
            onChange={e => setDatosRegistro({ ...datosRegistro, password: e.target.value })}
            style={inputStyle}
          />
          <button type="submit" style={btnStyle} onMouseEnter={(e) => e.target.style.opacity = '0.8'} onMouseLeave={(e) => e.target.style.opacity = '1'}>Registrarme</button>
        </form>
      </div>

      {/* CAJA 2: INICIO DE SESIÓN UNIFICADO (Admin / Organizador) */}
      <div style={{ flex: 1, padding: '40px', border: '1px solid #ffffff', backgroundColor: '#000000' }}>
        <h2 style={{ color: '#ffffff', marginBottom: '10px' }}>Iniciar Sesión</h2>
        <p style={{ fontSize: '14px', color: '#cccccc', marginBottom: '20px' }}>Ingresa con tu cuenta de Organizador o como Administrador.</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            placeholder="Correo o Usuario" required
            onChange={e => setDatosLogin({ ...datosLogin, correoOusuario: e.target.value })}
            style={inputStyle}
          />
          <input
            type="password" placeholder="Contraseña" required
            onChange={e => setDatosLogin({ ...datosLogin, password: e.target.value })}
            style={inputStyle}
          />
          <button type="submit" style={btnStyle} onMouseEnter={(e) => e.target.style.opacity = '0.8'} onMouseLeave={(e) => e.target.style.opacity = '1'}>Entrar</button>
        </form>
      </div>

    </div>
  );
};

// --- PLANES DISPONIBLES ---
const PLANES = [
  {
    id: 'Bronce',
    precio: '$199',
    periodo: '/mes',
    color: '#CD7F32',
    colorGlow: 'rgba(205,127,50,0.35)',
    emoji: '🥉',
    features: ['Hasta 4 equipos', '1 torneo activo', 'Calendario básico', 'Vista pública'],
  },
  {
    id: 'Plata',
    precio: '$399',
    periodo: '/mes',
    color: '#C0C0C0',
    colorGlow: 'rgba(192,192,192,0.35)',
    emoji: '🥈',
    popular: true,
    features: ['Hasta 10 equipos', '3 torneos activos', 'Estadísticas de jugadores', 'Ranking público', 'Árbitros'],
  },
  {
    id: 'Oro',
    precio: '$699',
    periodo: '/mes',
    color: '#FFD700',
    colorGlow: 'rgba(255,215,0,0.35)',
    emoji: '🥇',
    features: ['Equipos ilimitados', 'Torneos ilimitados', 'Todo de Plata', 'Canchas múltiples', 'Soporte prioritario'],
  },
];

// --- COMPONENTE PAGO SIMULADO ---
const PagoSimulado = ({ usuario }) => {
  const navigate = useNavigate();
  const [planSeleccionado, setPlanSeleccionado] = useState('Plata');
  const [paso, setPaso] = useState(1); // 1=elegir plan, 2=datos de pago

  useEffect(() => {
    if (!usuario) navigate('/login');
  }, [usuario]);

  const planActual = PLANES.find(p => p.id === planSeleccionado);

  const handleConfirmarPago = (e) => {
    e.preventDefault();
    navigate('/registro-liga', { state: { plan: planSeleccionado } });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Outfit', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '13px', letterSpacing: '3px', color: '#555', textTransform: 'uppercase', marginBottom: '10px' }}>Simulador de Pago</div>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#fff' }}>Elige tu Plan</h1>
        <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>Selecciona el plan que mejor se adapte a tu liga</p>
      </div>

      {paso === 1 && (
        <>
          {/* Grid de planes */}
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {PLANES.map(plan => {
              const activo = planSeleccionado === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => setPlanSeleccionado(plan.id)}
                  style={{
                    position: 'relative',
                    width: '220px',
                    padding: '28px 22px',
                    border: `2px solid ${activo ? plan.color : '#1e1e1e'}`,
                    borderRadius: '18px',
                    background: activo
                      ? `linear-gradient(160deg, #111 0%, #0d0d0d 100%)`
                      : '#0a0a0a',
                    boxShadow: activo ? `0 0 28px ${plan.colorGlow}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    transform: activo ? 'translateY(-6px)' : 'none',
                  }}
                >
                  {/* Badge popular */}
                  {plan.popular && (
                    <div style={{
                      position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                      background: `linear-gradient(90deg, ${plan.color}, #e2e2e2)`,
                      color: '#000', fontSize: '10px', fontWeight: 800,
                      padding: '3px 14px', borderRadius: '20px', letterSpacing: '1px',
                      whiteSpace: 'nowrap',
                    }}>MÁS POPULAR</div>
                  )}

                  {/* Emoji + nombre */}
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{plan.emoji}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: plan.color, marginBottom: '4px' }}>{plan.id}</div>

                  {/* Precio */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '18px' }}>
                    <span style={{ fontSize: '30px', fontWeight: 900, color: '#fff' }}>{plan.precio}</span>
                    <span style={{ fontSize: '13px', color: '#666' }}>{plan.periodo}</span>
                  </div>

                  {/* Features */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ fontSize: '12.5px', color: activo ? '#ccc' : '#555', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ color: activo ? plan.color : '#333', fontSize: '14px' }}>✓</span> {f}
                      </div>
                    ))}
                  </div>

                  {/* Indicador seleccionado */}
                  {activo && (
                    <div style={{
                      marginTop: '20px', padding: '8px', borderRadius: '8px',
                      background: `${plan.color}22`, border: `1px solid ${plan.color}55`,
                      textAlign: 'center', fontSize: '12px', fontWeight: 700, color: plan.color,
                    }}>✔ SELECCIONADO</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón continuar */}
          <button
            onClick={() => setPaso(2)}
            style={{
              padding: '14px 48px',
              background: `linear-gradient(90deg, ${planActual.color}, ${planActual.color}bb)`,
              color: '#000', border: 'none', borderRadius: '10px',
              fontWeight: 900, fontSize: '16px', cursor: 'pointer',
              boxShadow: `0 4px 20px ${planActual.colorGlow}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              fontFamily: "'Outfit', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${planActual.colorGlow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 20px ${planActual.colorGlow}`; }}
          >
            Continuar con Plan {planSeleccionado} {planActual.emoji}
          </button>
        </>
      )}

      {paso === 2 && (
        <div style={{ width: '100%', maxWidth: '440px', background: '#0a0a0a', border: `1.5px solid ${planActual.color}55`, borderRadius: '18px', padding: '36px 32px', boxShadow: `0 0 32px ${planActual.colorGlow}` }}>

          {/* Resumen del plan elegido */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #1e1e1e' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#555', letterSpacing: '1px', textTransform: 'uppercase' }}>Plan seleccionado</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: planActual.color, marginTop: '2px' }}>{planActual.emoji} {planActual.id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff' }}>{planActual.precio}</div>
              <div style={{ fontSize: '12px', color: '#555' }}>por mes</div>
            </div>
          </div>

          {/* Formulario de pago */}
          <form onSubmit={handleConfirmarPago} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', letterSpacing: '0.5px' }}>NÚMERO DE TARJETA</div>
              <input placeholder="4000 1234 5678 9010" required style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '8px', borderColor: '#222' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', letterSpacing: '0.5px' }}>VENCIMIENTO</div>
                <input placeholder="MM/YY" required style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '8px', borderColor: '#222' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', letterSpacing: '0.5px' }}>CVC</div>
                <input placeholder="•••" required style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '8px', borderColor: '#222' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', letterSpacing: '0.5px' }}>NOMBRE EN LA TARJETA</div>
              <input placeholder="Como aparece en la tarjeta" required style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '8px', borderColor: '#222' }} />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '8px', padding: '14px',
                background: `linear-gradient(90deg, ${planActual.color}, ${planActual.color}bb)`,
                color: '#000', border: 'none', borderRadius: '10px',
                fontWeight: 900, fontSize: '16px', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: `0 4px 20px ${planActual.colorGlow}`,
              }}
            >
              🔒 Confirmar Pago — {planActual.precio}/mes
            </button>

            <button
              type="button" onClick={() => setPaso(1)}
              style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '13px', cursor: 'pointer', marginTop: '4px', fontFamily: "'Outfit', sans-serif" }}
            >
              ← Cambiar plan
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE REGISTRO DE LIGA ---
const RegistroLiga = ({ usuario, setUsuario }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const planRecibido = location.state?.plan ?? 'Oro';

  const [datosLiga, setDatosLiga] = useState({ nombre_liga: '', subdominio_o_slug: '', genero: 'Mixta' });

  const planInfo = PLANES.find(p => p.id === planRecibido) ?? PLANES[2];

  useEffect(() => {
    if (!usuario) navigate('/login');
  }, [usuario]);

  const handleCrearLiga = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/suscripcion-organizador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre_liga: datosLiga.nombre_liga,
          subdominio_o_slug: datosLiga.subdominio_o_slug,
          plan: planRecibido,
          nombre_dueno: usuario.nombre,
          genero: datosLiga.genero
        })
      });
      if (res.ok) {
        setUsuario({ ...usuario, suscrito: true, slug_liga: datosLiga.subdominio_o_slug });
        alert(`¡Liga configurada con Plan ${planRecibido}!`);
        navigate('/organizador');
      } else {
        alert("Hubo un error o el slug ya está en uso.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", padding: '40px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ width: '100%', maxWidth: '460px', background: '#0a0a0a', border: `1.5px solid ${planInfo.color}55`, borderRadius: '18px', padding: '40px 36px', boxShadow: `0 0 32px ${planInfo.colorGlow}` }}>

        {/* Badge plan */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '32px' }}>{planInfo.emoji}</div>
          <h2 style={{ margin: '8px 0 4px', color: '#fff', fontWeight: 900, fontSize: '24px' }}>Datos de tu Liga</h2>
          <div style={{ display: 'inline-block', padding: '3px 14px', borderRadius: '20px', background: `${planInfo.color}22`, border: `1px solid ${planInfo.color}55`, color: planInfo.color, fontSize: '12px', fontWeight: 700 }}>
            Plan {planRecibido} — {planInfo.precio}/mes
          </div>
        </div>

        <form onSubmit={handleCrearLiga} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', letterSpacing: '0.5px' }}>NOMBRE DE LA LIGA</div>
            <input placeholder="Ej: Liga Tec Monterrey" required value={datosLiga.nombre_liga} onChange={e => setDatosLiga({...datosLiga, nombre_liga: e.target.value})} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '8px', borderColor: '#222' }} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', letterSpacing: '0.5px' }}>SLUG / DOMINIO PÚBLICO</div>
            <input placeholder="Ej: liga-tec (sin espacios)" required value={datosLiga.subdominio_o_slug} onChange={e => setDatosLiga({...datosLiga, subdominio_o_slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '8px', borderColor: '#222' }} />
            {datosLiga.subdominio_o_slug && <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>📎 /liga/{datosLiga.subdominio_o_slug}</div>}
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px', letterSpacing: '0.5px' }}>GÉNERO</div>
            <select value={datosLiga.genero} onChange={e => setDatosLiga({...datosLiga, genero: e.target.value})} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', borderRadius: '8px', borderColor: '#222' }}>
              <option value="Varonil">Varonil</option>
              <option value="Femenil">Femenil</option>
              <option value="Mixta">Mixta</option>
            </select>
          </div>
          <button
            type="submit"
            style={{
              marginTop: '10px', padding: '14px',
              background: `linear-gradient(90deg, ${planInfo.color}, ${planInfo.color}bb)`,
              color: '#000', border: 'none', borderRadius: '10px',
              fontWeight: 900, fontSize: '16px', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            🚀 Activar mi Liga
          </button>
        </form>
      </div>
    </div>
  );
};


// --- COMPONENTE 3: MÓDULO PÚBLICO (Directorio de Ligas) ---
const ModuloPublico = () => {
  // Estado para guardar las ligas que vienen de la BD
  const [ligasDisponibles, setLigasDisponibles] = useState([]);

  // Cargar las ligas al abrir la página
  useEffect(() => {
    fetch(`${API_URL}/api/directorio-ligas`)
      .then(res => res.json())
      .then(data => setLigasDisponibles(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#000000', minHeight: '100vh', color: '#ffffff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <h2 className="titulo-seccion-publica">Módulo Público - Ligas Activas</h2>
        <p style={{ color: '#cccccc', fontSize: '18px', marginBottom: '40px' }}>
          Aquí cualquier persona puede ver ligas, equipos, torneos y horarios sin loguearse.
        </p>

        {/* --- GRID DE LIGAS DESDE LA BASE DE DATOS --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          {ligasDisponibles.length === 0 ? (
            <p style={{ color: '#cccccc' }}>No hay ligas públicas disponibles en este momento.</p>
          ) : (
            ligasDisponibles.map(liga => (
              <Link
                key={liga.subdominio_o_slug}
                to={`/liga/${liga.subdominio_o_slug}`}
                style={{
                  textDecoration: 'none', backgroundColor: '#000000', padding: '25px',
                  color: '#ffffff', border: '1px solid #ffffff', display: 'block',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <strong style={{ fontSize: '18px', display: 'block' }}>{liga.nombre_liga}</strong>
                <div style={{ fontSize: '13px', color: '#ffffff', marginTop: '8px', fontWeight: 'bold' }}>
                  VER TORNEOS Y EQUIPOS
                </div>
              </Link>
            ))
          )}
        </div>

        <Link to="/" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 'bold', fontSize: '16px' }}>
          Volver al Inicio
        </Link>

      </div>
    </div>
  );
};


// --- ESTILOS COMPARTIDOS ---
const inputStyle = {
  padding: '12px',
  border: '1px solid #ffffff',
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '15px',
  outline: 'none'
};

const btnStyle = {
  display: 'inline-block',
  backgroundColor: '#000000',
  color: '#ffffff',
  padding: '12px 20px',
  textDecoration: 'none',
  border: '1px solid #ffffff',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold',
  marginTop: '10px',
  transition: 'opacity 0.2s ease'
};

export default App;