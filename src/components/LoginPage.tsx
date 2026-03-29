import { useState, type FormEvent } from 'react';
import { useAuthContext } from '../context/AuthContext';
import logo from '../assets/imgs/logo.gif';

export function LoginPage() {
  const { login, signup } = useAuthContext();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title"><img src={logo} alt="Logo" /></h1>
        <p className="login-subtitle">
          {isSignup ? 'Crie sua conta' : 'Entre na sua conta'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="form-label">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="******"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Carregando...' : isSignup ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <p className="login-toggle">
          {isSignup ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
            }}
            className="login-toggle-btn"
          >
            {isSignup ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  );
}
