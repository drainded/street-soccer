import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPageUI.css';

const ImageSequence = ({ isFlipped }) => {
  const images = [
    '/assetsinterfaz/jugador1.png',
    '/assetsinterfaz/jugador2.png',
    '/assetsinterfaz/jugador3.png',
    '/assetsinterfaz/jugador4.png',
    '/assetsinterfaz/jugador5.png'
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Cambia de imagen cada 3 segundos
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className={`secuencia-container ${isFlipped ? 'jugador-flip' : ''}`}>
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt={`Jugador ${index + 1}`}
          className={`jugador-animacion secuencia-imagen ${index === currentIndex ? 'activa' : ''}`}
        />
      ))}
    </div>
  );
};

const AnimatedWelcomeText = () => {
  const text = "TE DAMOS LA BIENVENIDA!!";

  return (
    <div className="animated-welcome-container">
      <h1 className="animated-welcome-text" data-text={text}>
        {text}
      </h1>
    </div>
  );
};

const LandingPageUI = () => {
  const [showScrollArrow, setShowScrollArrow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Oculta la flecha si se scrollea más de 50px hacia abajo
      if (window.scrollY > 50) {
        setShowScrollArrow(false);
      } else {
        setShowScrollArrow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="landing-container">
        {/* Header Superior */}
        <header className="landing-header">
          <img
            src="/assetsinterfaz/logo_principal.png"
            alt="Street Soccer Logo Principal"
            className="header-logo"
          />
        </header>

        <AnimatedWelcomeText />

        {/* Contenido Principal */}
        <main className="landing-main">
          <div className="content-wrapper">
            {/* Jugador Izquierdo */}
            <div className="jugador-container">
              <ImageSequence isFlipped={false} />
            </div>

            {/* Caja Central Glassmorphism */}
            <div className="caja-central">
              <div className="caja-contenido">
                <p className="texto-descripcion">
                  StreetSoccer es una plataforma web diseñada para organizar y administrar ligas y torneos de fútbol de manera sencilla, eficiente y precisa.
                </p>
              </div>
            </div>

            {/* Jugador Derecho */}
            <div className="jugador-container">
              <ImageSequence isFlipped={true} />
            </div>
          </div>
        </main>

        {/* Flecha indicadora de Scroll */}
        <div className={`scroll-arrow-container ${!showScrollArrow ? 'hidden' : ''}`}>
          <div className="scroll-arrow"></div>
        </div>
      </div>

      {/* Sección inferior para botones fuera del recuadro principal (abajo del scroll) */}
      <div className="landing-seccion-inferior">
        <h3 className="texto-opciones">Selecciona una opción para comenzar tu experiencia: inicia sesión, regístrate o explora los torneos sin necesidad de iniciar sesión.</h3>
        <div className="landing-botones">
          <Link to="/login" className="btn-landing btn-login-inferior"><span>REGISTRARSE o INICIAR SESION</span></Link>
          <Link to="/publico" className="btn-landing btn-publico-inferior"><span>VER TORNEOS</span></Link>
        </div>
      </div>
    </>
  );
};

export default LandingPageUI;
