import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ModuloPublico = () => {
  // Estado para guardar las ligas que vienen de la BD
  const [ligasDisponibles, setLigasDisponibles] = useState([]);

  // Cargar las ligas al abrir la página
  useEffect(() => {
    fetch('http://localhost:3001/api/directorio-ligas')
      .then(res => res.json())
      .then(data => setLigasDisponibles(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <h2 style={{ color: '#2c3e50', fontSize: '32px' }}>Módulo Público - Ligas Activas</h2>
        <p style={{ color: '#7f8c8d', fontSize: '18px', marginBottom: '40px' }}>
          Aquí cualquier persona puede ver ligas, equipos, torneos y horarios sin loguearse.
        </p>

        {/* --- GRID DE LIGAS --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          {ligasDisponibles.length === 0 ? (
            <p style={{ color: '#95a5a6' }}>No hay ligas públicas disponibles en este momento.</p>
          ) : (
            ligasDisponibles.map(liga => (
              <Link 
                key={liga.subdominio_o_slug}
                to={`/liga/${liga.subdominio_o_slug}`} 
                style={{ 
                  textDecoration: 'none', backgroundColor: 'white', padding: '25px', 
                  borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  color: '#2c3e50', border: '1px solid #eee', display: 'block'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏆</div>
                <strong style={{ fontSize: '18px', display: 'block' }}>{liga.nombre_liga}</strong>
                <div style={{ fontSize: '13px', color: '#2ecc71', marginTop: '8px', fontWeight: 'bold' }}>
                  VER TORNEOS ➔
                </div>
              </Link>
            ))
          )}
        </div>

        <Link to="/" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
          ⬅ Volver al Inicio
        </Link>

      </div>
    </div>
  );
};

export default ModuloPublico;