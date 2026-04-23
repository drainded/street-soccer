// iniciar backend: node index.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión dinámica: usa Supabase (DATABASE_URL) o PostgreSQL local como fallback
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Requerido por Supabase
    })
  : new Pool({
      user: 'postgres',
      host: 'localhost',
      database: 'ligamaster_db',
      password: '123321',
      port: 5432,
    });

// ── HEALTH CHECK: verifica conexión a BD al arrancar ──
pool.query('SELECT NOW()').then(r => {
  console.log('✅ Base de datos conectada:', r.rows[0].now);
}).catch(err => {
  console.error('❌ ERROR: No se pudo conectar a la base de datos.');
  console.error('   Causa:', err.message);
  console.error('   ¿El proyecto de Supabase está pausado? Visita: https://supabase.com/dashboard');
});

// ── ENDPOINT DE DIAGNÓSTICO ──
app.get('/api/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db: 'conectada', hora: r.rows[0].now, env: process.env.DATABASE_URL ? 'Supabase' : 'Local' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'sin conexión', causa: err.message, solucion: 'Verifica que el proyecto Supabase esté activo en https://supabase.com/dashboard' });
  }
});


// --- ACTIVIDAD 4: Middleware de Verificación de Estatus [cite: 92, 94] ---
// Este filtro se ejecuta antes de cualquier lógica deportiva para validar al inquilino.
const verificarSuscripcion = async (req, res, next) => {
  const slug = req.headers['x-tenant-slug']; // Identificador de la liga [cite: 95]

  if (!slug) {
    return res.status(400).json({ error: "Identificador de liga (slug) ausente." });
  }

  try {
    const result = await pool.query(
      'SELECT estatus_pago FROM Tenants WHERE subdominio_o_slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inquilino no encontrado." });
    }

    // Lógica: Si estatus_pago es falso, se bloquea el acceso [cite: 96]
    if (!result.rows[0].estatus_pago) {
      return res.status(403).json({ 
        error: "Servicio Suspendido", 
        message: "Pendiente de Pago. Contacte al administrador." 
      });
    }

    next(); // Permitir el paso si el pago está activo [cite: 94]
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor de autenticación." });
  }
};

// --- ACTIVIDAD 3: Gestión de Ciclo de Vida (CRUD) [cite: 85, 87] ---

// ALTA: Crear una nueva liga y asignar un plan [cite: 89]
app.post('/tenants', async (req, res) => {
  const { nombre_liga, subdominio_o_slug, plan } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Tenants (nombre_liga, subdominio_o_slug, plan, estatus_pago) VALUES ($1, $2, $3, false) RETURNING *',
      [nombre_liga, subdominio_o_slug, plan]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al registrar: el slug debe ser único." });
  }
});

// BAJA/SUSPENSIÓN: Cambiar estatus para impedir el acceso [cite: 90]
app.put('/tenants/:id/status', async (req, res) => {
  const { id } = req.params;
  const { estatus_pago } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Tenants SET estatus_pago = $1 WHERE id = $2 RETURNING *',
      [estatus_pago, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EDICIÓN: Modificar datos de contacto o cambiar plan [cite: 91]
app.put('/tenants/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_liga, plan } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Tenants SET nombre_liga = $1, plan = $2 WHERE id = $3 RETURNING *',
      [nombre_liga, plan, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar datos." });
  }
});

// ACTIVIDAD 2: Obtener todas las ligas para el Dashboard [cite: 81, 84]
app.get('/tenants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Tenants ORDER BY fecha_registro DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RUTA PROTEGIDA (EJEMPLO FASE III) ---
// Solo se puede acceder si el Middleware 'verificarSuscripcion' da luz verde [cite: 94]
app.get('/api/v1/liga/datos-deportivos', verificarSuscripcion, (req, res) => {
  res.json({ message: "Bienvenido al Módulo del Organizador. Acceso permitido." });
});

// 1. REGISTRAR UN NUEVO USUARIO
app.post('/api/registro', async (req, res) => {
  const { nombre, correo, password, tipo_usuario } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Usuarios (nombre, correo, password, tipo_usuario) VALUES ($1, $2, $3, $4) RETURNING id, nombre, correo, tipo_usuario',
      [nombre, correo, password, tipo_usuario || 'Lider']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en /api/registro:', err.message, '| Código:', err.code);
    // Código 23505 = violación de restricción unique (correo duplicado)
    if (err.code === '23505') {
      return res.status(409).json({ error: "El correo ya está registrado.", code: 'EMAIL_DUPLICATE' });
    }
    res.status(500).json({ error: "Error interno del servidor al registrar.", detalle: err.message });
  }
});

// 2. INICIAR SESIÓN (LOGIN)
app.post('/api/login', async (req, res) => {
  const { correo, password } = req.body;
  try {
    // Buscamos al usuario
    const userResult = await pool.query(
      'SELECT id, nombre, correo, tipo_usuario FROM Usuarios WHERE correo = $1 AND password = $2',
      [correo, password]
    );

    if (userResult.rows.length > 0) {
      const usuario = userResult.rows[0];
      
      // Verificamos si este usuario ya tiene una liga (Tenant) registrada y si está pagada
      const tenantResult = await pool.query(
        'SELECT subdominio_o_slug, estatus_pago FROM Tenants WHERE nombre_dueno = $1',
        [usuario.nombre]
      );

      let suscrito = false;
      let slug_liga = null;

      if (tenantResult.rows.length > 0) {
        suscrito = tenantResult.rows[0].estatus_pago;
        slug_liga = tenantResult.rows[0].subdominio_o_slug;
      }

      // Devolvemos toda la información empaquetada a React
      res.json({ ...usuario, suscrito, slug_liga });
    } else {
      res.status(401).json({ error: "Correo o contraseña incorrectos" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 3. OBTENER LOS EQUIPOS DE UNA LIGA ESPECÍFICA
app.get('/api/equipos/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Equipos WHERE slug_liga = $1 ORDER BY id DESC', [slug]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar equipos" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor SaaS corriendo en http://localhost:${PORT}`);
});

// CREAR TORNEO
app.post('/api/torneos', async (req, res) => {
  const { slug_liga, nombre, formato, fecha_inicio, fecha_termino, cancha_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Torneos (slug_liga, nombre, formato, fecha_inicio, fecha_termino, cancha_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [slug_liga, nombre, formato, fecha_inicio, fecha_termino || null, cancha_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al crear torneo" });
  }
});

// CREAR EQUIPO
app.post('/api/equipos', async (req, res) => {
  // 1. Agregamos "escudo" y "capitan_id" a los datos que recibimos
  const { slug_liga, nombre, representante, escudo, capitan_id } = req.body; 
  try {
    const result = await pool.query(
      // 2. Lo agregamos al INSERT
      'INSERT INTO Equipos (slug_liga, nombre, representante, escudo, capitan_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [slug_liga, nombre, representante, escudo, capitan_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al crear equipo" });
  }
});

// PROCESAR SUSCRIPCIÓN O REACTIVACIÓN
app.post('/api/suscripcion-organizador', async (req, res) => {
  const { nombre_liga, subdominio_o_slug, plan, nombre_dueno, genero } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Tenants (nombre_liga, subdominio_o_slug, plan, nombre_dueno, estatus_pago, genero) 
       VALUES ($1, $2, $3, $4, true, $5) 
       ON CONFLICT (subdominio_o_slug) 
       DO UPDATE SET nombre_liga = $1, plan = $3, estatus_pago = true, genero = COALESCE($5, Tenants.genero) 
       RETURNING *`,
      [nombre_liga, subdominio_o_slug, plan, nombre_dueno, genero || 'Mixta']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al procesar la suscripción" });
  }
});

// OBTENER TORNEOS DE UNA LIGA
app.get('/api/torneos/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      `SELECT t.*, c.nombre AS cancha_nombre 
       FROM Torneos t 
       LEFT JOIN Canchas c ON t.cancha_id = c.id 
       WHERE t.slug_liga = $1 
       ORDER BY t.fecha_inicio DESC`, 
      [slug]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar torneos" });
  }
});

// 1. CREAR UN PARTIDO (Programar enfrentamiento)
app.post('/api/partidos', async (req, res) => {
  const { torneo_id, equipo_local_id, equipo_visitante_id, fecha_partido } = req.body;
  
  if (equipo_local_id === equipo_visitante_id) {
    return res.status(400).json({ error: "Un equipo no puede jugar contra sí mismo." });
  }

  try {
    const result = await pool.query(
      'INSERT INTO Partidos (torneo_id, equipo_local_id, equipo_visitante_id, fecha_partido) VALUES ($1, $2, $3, $4) RETURNING *',
      [torneo_id, equipo_local_id, equipo_visitante_id, fecha_partido]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al programar el partido" });
  }
});

// 2. OBTENER PARTIDOS DE UN TORNEO
app.get('/api/partidos/:torneo_id', async (req, res) => {
  const { torneo_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.id, p.fecha_partido, p.resultado,
             el.nombre as local_nombre, el.escudo as local_escudo,
             ev.nombre as visitante_nombre, ev.escudo as visitante_escudo
      FROM Partidos p
      JOIN Equipos el ON p.equipo_local_id = el.id
      JOIN Equipos ev ON p.equipo_visitante_id = ev.id
      WHERE p.torneo_id = $1
      ORDER BY p.fecha_partido ASC
    `, [torneo_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar el calendario" });
  }
});

// 1. AGREGAR JUGADOR A UN EQUIPO
app.post('/api/jugadores', async (req, res) => {
  const { equipo_id, nombre, rol } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Jugadores (equipo_id, nombre, rol) VALUES ($1, $2, $3) RETURNING *',
      [equipo_id, nombre, rol]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al registrar jugador" });
  }
});

// 2. OBTENER JUGADORES DE UN EQUIPO
app.get('/api/jugadores/:equipo_id', async (req, res) => {
  const { equipo_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Jugadores WHERE equipo_id = $1', [equipo_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener la plantilla" });
  }
});

// VERIFICAR ESTATUS DE LA LIGA EN TIEMPO REAL
app.get('/api/estatus-liga/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      'SELECT estatus_pago FROM Tenants WHERE subdominio_o_slug = $1',
      [slug]
    );
    if (result.rows.length > 0) {
      res.json({ activo: result.rows[0].estatus_pago });
    } else {
      res.json({ activo: false });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al verificar estatus" });
  }
});

// OBTENER DATOS PÚBLICOS DE UNA LIGA (Verificando que esté pagada)
app.get('/api/liga-publica/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      'SELECT nombre_liga, estatus_pago FROM Tenants WHERE subdominio_o_slug = $1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Liga no encontrada" });
    }
    
    if (!result.rows[0].estatus_pago) {
      return res.status(403).json({ error: "Esta liga se encuentra suspendida temporalmente." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

// OBTENER TODAS LAS LIGAS ACTIVAS PARA EL DIRECTORIO PÚBLICO
app.get('/api/directorio-ligas', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT nombre_liga, subdominio_o_slug FROM Tenants WHERE estatus_pago = true'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar el directorio" });
  }
});

// --- RUTAS PARA ÁRBITROS ---

// 1. Registrar un nuevo árbitro en la Liga
app.post('/api/arbitros', async (req, res) => {
  const { slug_liga, nombre } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Arbitros (slug_liga, nombre) VALUES ($1, $2) RETURNING *',
      [slug_liga, nombre]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al registrar árbitro" });
  }
});

// 2. Obtener todos los árbitros de la Liga
app.get('/api/arbitros/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Arbitros WHERE slug_liga = $1', [req.params.slug]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar árbitros" });
  }
});

// 3. Asignar un Árbitro a un Torneo
app.post('/api/torneo-arbitros', async (req, res) => {
  const { torneo_id, arbitro_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO Torneo_Arbitros (torneo_id, arbitro_id) VALUES ($1, $2)',
      [torneo_id, arbitro_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "El árbitro ya está asignado o hubo un error." });
  }
});

// 4. Obtener los árbitros asignados a un Torneo específico
app.get('/api/torneo-arbitros/:torneo_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.nombre 
      FROM Torneo_Arbitros ta
      JOIN Arbitros a ON ta.arbitro_id = a.id
      WHERE ta.torneo_id = $1
    `, [req.params.torneo_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar árbitros del torneo" });
  }
});

// --- RUTAS NUEVAS PARA CAPITANES Y EQUIPOS EN TORNEOS ---

// Obtener los equipos de un capitán específico
app.get('/api/equipos/capitan/:capitan_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Equipos WHERE capitan_id = $1 ORDER BY id DESC', [req.params.capitan_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar equipos del capitán" });
  }
});

// Asignar múltiples equipos a un torneo
app.post('/api/torneo-equipos', async (req, res) => {
  const { torneo_id, equipos_ids } = req.body;
  try {
    // Para simplificar, primero limpiamos los existentes en este torneo
    await pool.query('DELETE FROM Torneo_Equipos WHERE torneo_id = $1', [torneo_id]);
    
    // Insertamos los nuevos
    if (equipos_ids && equipos_ids.length > 0) {
      for (const equipo_id of equipos_ids) {
        await pool.query('INSERT INTO Torneo_Equipos (torneo_id, equipo_id) VALUES ($1, $2)', [torneo_id, equipo_id]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Error al asignar equipos al torneo" });
  }
});

// Obtener los equipos asignados a un Torneo
app.get('/api/torneo-equipos/:torneo_id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*
      FROM Torneo_Equipos te
      JOIN Equipos e ON te.equipo_id = e.id
      WHERE te.torneo_id = $1
    `, [req.params.torneo_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar equipos del torneo" });
  }
});

// --- RUTAS PARA CANCHAS ---

// Crear una nueva cancha
app.post('/api/canchas', async (req, res) => {
  const { slug_liga, nombre, ubicacion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Canchas (slug_liga, nombre, ubicacion) VALUES ($1, $2, $3) RETURNING *',
      [slug_liga, nombre, ubicacion]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al registrar cancha" });
  }
});

// Obtener todas las canchas de una liga
app.get('/api/canchas/:slug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Canchas WHERE slug_liga = $1 ORDER BY id DESC', [req.params.slug]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar canchas" });
  }
});

// --- RUTAS PARA ESTADÍSTICAS ---

// Obtener los torneos en los que participa un equipo
app.get('/api/equipos/:equipo_id/torneos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.* 
      FROM Torneos t
      JOIN Torneo_Equipos te ON t.id = te.torneo_id
      WHERE te.equipo_id = $1
    `, [req.params.equipo_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar torneos del equipo" });
  }
});

// Obtener los partidos de un equipo en un torneo
app.get('/api/equipos/:equipo_id/torneo/:torneo_id/partidos', async (req, res) => {
  try {
    const { equipo_id, torneo_id } = req.params;
    const result = await pool.query(`
      SELECT p.id, p.fecha_partido, p.resultado,
             el.nombre as local_nombre, el.escudo as local_escudo,
             ev.nombre as visitante_nombre, ev.escudo as visitante_escudo
      FROM Partidos p
      JOIN Equipos el ON p.equipo_local_id = el.id
      JOIN Equipos ev ON p.equipo_visitante_id = ev.id
      WHERE p.torneo_id = $1 AND (p.equipo_local_id = $2 OR p.equipo_visitante_id = $2)
      ORDER BY p.fecha_partido ASC
    `, [torneo_id, equipo_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar partidos del equipo" });
  }
});

// Obtener estadísticas de un jugador en un partido
app.get('/api/estadisticas/jugador/:jugador_id/partido/:partido_id', async (req, res) => {
  try {
    const { jugador_id, partido_id } = req.params;
    const result = await pool.query(`
      SELECT * FROM Estadisticas_Jugadores_Partidos
      WHERE jugador_id = $1 AND partido_id = $2
    `, [jugador_id, partido_id]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({}); // Vacío si no hay estadísticas
    }
  } catch (err) {
    res.status(500).json({ error: "Error al cargar estadísticas" });
  }
});

// Guardar o actualizar estadísticas de un jugador en un partido
app.post('/api/estadisticas/jugador/:jugador_id/partido/:partido_id', async (req, res) => {
  try {
    const { jugador_id, partido_id } = req.params;
    const stats = { ...req.body };
    
    delete stats.id;
    delete stats.jugador_id;
    delete stats.partido_id;

    // Obtener campos a insertar dinámicamente
    const keys = Object.keys(stats);
    if (keys.length === 0) return res.json({ success: true }); // No hay nada que guardar

    const fields = keys.join(', ');
    const values = keys.map((_, i) => '$' + (i + 3)).join(', ');
    const updateSets = keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
    
    const query = `
      INSERT INTO Estadisticas_Jugadores_Partidos (jugador_id, partido_id, ${fields})
      VALUES ($1, $2, ${values})
      ON CONFLICT (jugador_id, partido_id)
      DO UPDATE SET ${updateSets}
      RETURNING *
    `;
    
    const queryParams = [jugador_id, partido_id, ...keys.map(k => stats[k])];
    const result = await pool.query(query, queryParams);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar estadísticas" });
  }
});

// Obtener estadísticas globales de un jugador
app.get('/api/estadisticas/jugador/:jugador_id/global', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(id) as partidos_jugados,
        COALESCE(SUM(goles), 0) as total_goles,
        COALESCE(SUM(minutos_jugados), 0) as total_minutos
      FROM Estadisticas_Jugadores_Partidos
      WHERE jugador_id = $1 AND minutos_jugados > 0
    `, [req.params.jugador_id]);
    
    if (result.rows.length > 0) {
      const stats = result.rows[0];
      const goles = parseInt(stats.total_goles);
      const partidos = parseInt(stats.partidos_jugados);
      res.json({
        partidos_jugados: partidos,
        total_goles: goles,
        promedio_goles: partidos > 0 ? (goles / partidos).toFixed(2) : "0.00",
        total_minutos: parseInt(stats.total_minutos)
      });
    } else {
      res.json({ partidos_jugados: 0, total_goles: 0, promedio_goles: "0.00", total_minutos: 0 });
    }
  } catch (err) {
    res.status(500).json({ error: "Error al cargar estadísticas globales" });
  }
});

// TOP 5 JUGADORES POR LIGA (para Vista Pública)
app.get('/api/top-jugadores/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        j.id,
        j.nombre AS jugador_nombre,
        j.rol,
        e.nombre AS equipo_nombre,
        e.escudo AS equipo_escudo,
        COALESCE(SUM(ejp.goles), 0) AS total_goles,
        COALESCE(SUM(ejp.asistencias), 0) AS total_asistencias,
        COALESCE(COUNT(DISTINCT ejp.partido_id), 0) AS partidos_jugados,
        COALESCE(SUM(ejp.minutos_jugados), 0) AS total_minutos
      FROM Jugadores j
      JOIN Equipos e ON j.equipo_id = e.id
      LEFT JOIN Estadisticas_Jugadores_Partidos ejp ON j.id = ejp.jugador_id
      WHERE e.slug_liga = $1
      GROUP BY j.id, j.nombre, j.rol, e.nombre, e.escudo
      ORDER BY total_goles DESC, total_asistencias DESC, partidos_jugados DESC
      LIMIT 5
    `, [slug]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar el ranking de jugadores" });
  }
});