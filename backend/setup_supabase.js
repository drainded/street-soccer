require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setup() {
  try {
    console.log('🔌 Conectando a Supabase...');
    await pool.query('SELECT 1'); // Test de conexión
    console.log('✅ Conexión exitosa!\n');

    console.log('📋 Creando tablas...');
    const sql = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ ¡Todas las tablas creadas exitosamente!\n');

    // Verificar tablas creadas
    const res = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('📊 Tablas en tu base de datos Supabase:');
    res.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    pool.end();
  }
}

setup();
