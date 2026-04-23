const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'ligamaster_db', password: '123321', port: 5432 });
pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public';").then(res => { console.table(res.rows); pool.end(); });
