-- =====================================================
-- SCHEMA COMPLETO - STREETSOCCER SaaS
-- Ejecuta este SQL en Supabase > SQL Editor
-- =====================================================

-- 1. TENANTS (Ligas)
CREATE TABLE IF NOT EXISTS Tenants (
  id SERIAL PRIMARY KEY,
  nombre_liga VARCHAR(100) NOT NULL,
  subdominio_o_slug VARCHAR(50) UNIQUE NOT NULL,
  plan VARCHAR(20) DEFAULT 'Bronce',
  nombre_dueno VARCHAR(100),
  genero VARCHAR(20) DEFAULT 'Mixta',
  estatus_pago BOOLEAN DEFAULT false,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 2. USUARIOS
CREATE TABLE IF NOT EXISTS Usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  tipo_usuario VARCHAR(20) DEFAULT 'Lider',
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 3. EQUIPOS
CREATE TABLE IF NOT EXISTS Equipos (
  id SERIAL PRIMARY KEY,
  slug_liga VARCHAR(50) REFERENCES Tenants(subdominio_o_slug) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  representante VARCHAR(100),
  escudo VARCHAR(10),
  capitan_id INTEGER REFERENCES Usuarios(id) ON DELETE SET NULL,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 4. JUGADORES
CREATE TABLE IF NOT EXISTS Jugadores (
  id SERIAL PRIMARY KEY,
  equipo_id INTEGER REFERENCES Equipos(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  rol VARCHAR(50) DEFAULT 'Jugador',
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 5. CANCHAS
CREATE TABLE IF NOT EXISTS Canchas (
  id SERIAL PRIMARY KEY,
  slug_liga VARCHAR(50) REFERENCES Tenants(subdominio_o_slug) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  ubicacion TEXT,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 6. TORNEOS
CREATE TABLE IF NOT EXISTS Torneos (
  id SERIAL PRIMARY KEY,
  slug_liga VARCHAR(50) REFERENCES Tenants(subdominio_o_slug) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  formato VARCHAR(50),
  fecha_inicio DATE,
  fecha_termino DATE,
  cancha_id INTEGER REFERENCES Canchas(id) ON DELETE SET NULL,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 7. ÁRBITROS
CREATE TABLE IF NOT EXISTS Arbitros (
  id SERIAL PRIMARY KEY,
  slug_liga VARCHAR(50) REFERENCES Tenants(subdominio_o_slug) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 8. TORNEO_EQUIPOS (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS Torneo_Equipos (
  id SERIAL PRIMARY KEY,
  torneo_id INTEGER REFERENCES Torneos(id) ON DELETE CASCADE,
  equipo_id INTEGER REFERENCES Equipos(id) ON DELETE CASCADE,
  UNIQUE(torneo_id, equipo_id)
);

-- 9. TORNEO_ÁRBITROS (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS Torneo_Arbitros (
  id SERIAL PRIMARY KEY,
  torneo_id INTEGER REFERENCES Torneos(id) ON DELETE CASCADE,
  arbitro_id INTEGER REFERENCES Arbitros(id) ON DELETE CASCADE,
  UNIQUE(torneo_id, arbitro_id)
);

-- 10. PARTIDOS
CREATE TABLE IF NOT EXISTS Partidos (
  id SERIAL PRIMARY KEY,
  torneo_id INTEGER REFERENCES Torneos(id) ON DELETE CASCADE,
  equipo_local_id INTEGER REFERENCES Equipos(id) ON DELETE CASCADE,
  equipo_visitante_id INTEGER REFERENCES Equipos(id) ON DELETE CASCADE,
  fecha_partido TIMESTAMP,
  resultado VARCHAR(20),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- 11. ESTADÍSTICAS DE JUGADORES POR PARTIDO
CREATE TABLE IF NOT EXISTS Estadisticas_Jugadores_Partidos (
  id SERIAL PRIMARY KEY,
  jugador_id INTEGER REFERENCES Jugadores(id) ON DELETE CASCADE,
  partido_id INTEGER REFERENCES Partidos(id) ON DELETE CASCADE,
  minutos_jugados INTEGER DEFAULT 0,
  goles INTEGER DEFAULT 0,
  asistencias INTEGER DEFAULT 0,
  tarjetas_amarillas INTEGER DEFAULT 0,
  tarjetas_rojas INTEGER DEFAULT 0,
  -- Portero
  atajadas INTEGER DEFAULT 0,
  goles_recibidos INTEGER DEFAULT 0,
  porterias_en_cero INTEGER DEFAULT 0,
  penales_atajados INTEGER DEFAULT 0,
  salidas INTEGER DEFAULT 0,
  -- Defensa
  entradas INTEGER DEFAULT 0,
  intercepciones INTEGER DEFAULT 0,
  despejes INTEGER DEFAULT 0,
  duelos_ganados INTEGER DEFAULT 0,
  faltas_cometidas INTEGER DEFAULT 0,
  -- Medio
  pases_completados INTEGER DEFAULT 0,
  precision_pase INTEGER DEFAULT 0,
  pases_clave INTEGER DEFAULT 0,
  recuperaciones INTEGER DEFAULT 0,
  -- Delantero
  tiros INTEGER DEFAULT 0,
  tiros_a_puerta INTEGER DEFAULT 0,
  efectividad INTEGER DEFAULT 0,
  UNIQUE(jugador_id, partido_id)
);
