import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const savedRemember = localStorage.getItem('rememberEmail') === 'true';
    const savedEmail = localStorage.getItem('savedEmail');

    if (savedRemember && savedEmail) {
      setRememberMe(true);
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const { detail } = await response.json();
        throw new Error(detail || 'Error al iniciar sesión');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      if (data.user_info) {
        localStorage.setItem('user_info', JSON.stringify(data.user_info));
      }

      if (rememberMe) {
        localStorage.setItem('savedEmail', email);
        localStorage.setItem('rememberEmail', 'true');
      } else {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('rememberEmail');
      }

      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRememberToggle = () => {
    setRememberMe((prev) => {
      const nextValue = !prev;
      if (!nextValue) {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('rememberEmail');
      } else if (email) {
        localStorage.setItem('savedEmail', email);
        localStorage.setItem('rememberEmail', 'true');
      }
      return nextValue;
    });
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (rememberMe) {
      localStorage.setItem('savedEmail', value);
    }
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="auth-wrapper">
      <div className="auth-hero" aria-hidden="true">
        <span className="auth-badge">Plataforma Comercial</span>
        <h1>Centraliza tus operaciones sin complicaciones</h1>
        <p>
          Analiza ventas, inventarios y ganancias en tiempo real con una
          experiencia visual coherente en todas tus herramientas.
        </p>
        <div className="auth-stats">
          <div className="auth-stat-card">
            <span className="auth-stat-label">Última sesión</span>
            <strong>Hace menos de 24 h</strong>
          </div>
          <div className="auth-stat-card">
            <span className="auth-stat-label">Equipos conectados</span>
            <strong>+12 colaboradores</strong>
          </div>
        </div>
        <ul className="auth-benefits">
          <li>
            <span role="img" aria-label="escudo">
              🛡️
            </span>
            Seguridad empresarial con control de accesos.
          </li>
          <li>
            <span role="img" aria-label="reloj">
              ⚡
            </span>
            Reanuda justo donde te quedaste en tus flujos diarios.
          </li>
          <li>
            <span role="img" aria-label="gráfico">
              📊
            </span>
            Métricas personalizadas para cada área del negocio.
          </li>
        </ul>
      </div>

      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-card-header">
          <img
            src="/Logo COMERCIALIZADORA Orza FONDO AZUL.png"
            alt="Logotipo Comercializadora"
            className="auth-logo"
          />
          <div>
            <span className="auth-card-badge">Bienvenido de nuevo</span>
            <h2 id="login-title">Inicia sesión para continuar</h2>
            <p>
              Ingresa tus credenciales para acceder al panel y gestionar tu
              operación comercial.
            </p>
          </div>
        </div>

        {error && (
          <div className="auth-alert" role="alert">
            <strong>Algo salió mal:</strong> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Correo electrónico</label>
            <div className={`auth-input ${error ? 'has-error' : ''}`}>
              <span aria-hidden="true" className="auth-input-icon">
                📧
              </span>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="tucorreo@empresa.com"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-field-label">
              <label htmlFor="password">Contraseña</label>
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <div className={`auth-input ${error ? 'has-error' : ''}`}>
              <span aria-hidden="true" className="auth-input-icon">
                🔒
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="auth-options">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberToggle}
              />
              <span>Recordar mi correo</span>
            </label>
            <button
              type="button"
              className="auth-link"
              onClick={() => navigate('/help?seccion=credenciales')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Ingresando…' : 'Ingresar a la plataforma'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Necesitas ayuda? Escríbenos a soporte@orza.com</p>
          <button
            type="button"
            className="auth-secondary"
            onClick={() => navigate('/help')}
          >
            Explorar centro de ayuda
          </button>
        </div>
      </section>
    </div>
  );
};

export default Login;
