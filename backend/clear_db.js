const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'ligamaster_db', password: '123321', port: 5432 });

async function clear() {
  try {
    console.log('Borrando datos...');
    await pool.query('TRUNCATE TABLE Tenants, Usuarios, Equipos, Jugadores, Arbitros, Torneos, Partidos, Torneo_Equipos, Torneo_Arbitros, Canchas, Estadisticas_Jugadores_Partidos CASCADE;');
    console.log('¡Todos los datos han sido borrados exitosamente!');
  } catch (err) {
    console.error('Error al borrar los datos:', err);
  } finally {
    pool.end();
  }
}

clear();
