const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'ligamaster_db', password: '123321', port: 5432 });

async function migrate() {
  try {
    console.log('Creando tabla Estadisticas_Jugadores_Partidos...');
    await pool.query(`
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
    `);
    console.log('¡Tabla creada exitosamente!');
  } catch (err) {
    console.error('Error al crear la tabla:', err);
  } finally {
    pool.end();
  }
}

migrate();
