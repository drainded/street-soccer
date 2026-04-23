const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'ligamaster_db', password: '123321', port: 5432 });

async function migrate() {
  try {
    console.log('Agregando columna fecha_termino a Torneos...');
    await pool.query('ALTER TABLE Torneos ADD COLUMN IF NOT EXISTS fecha_termino DATE;');
    console.log('¡Columna agregada exitosamente!');
  } catch (err) {
    console.error('Error al agregar columna:', err);
  } finally {
    pool.end();
  }
}

migrate();
