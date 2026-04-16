import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import Modal from './Modal';

export default function LoginModal({ isOpen, onClose }) {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const result = await signup(email, password);
        if (result?.user?.identities?.length === 0) {
          setError('Este email já está cadastrado. Faça login.');
        } else {
          setSignupSuccess(true);
        }
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err) {
      if (err.message.includes('Invalid login')) {
        setError('Email ou senha incorretos.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Confirme seu email antes de fazer login.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function resetAndClose() {
    setEmail('');
    setPassword('');
    setError('');
    setMode('login');
    setSignupSuccess(false);
    onClose();
  }

  if (signupSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={resetAndClose} title="✅ Conta Criada">
        <div className="login-success">
          <p>Conta criada com sucesso!</p>
          <p className="login-success-sub">
            Verifique seu email <strong>{email}</strong> para confirmar a conta. 
            Depois é só fazer login.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={() => {
            setSignupSuccess(false);
            setMode('login');
          }}>
            <LogIn size={16} />
            Fazer Login
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={mode === 'login' ? '🔐 Login Admin' : '📝 Criar Conta Admin'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={resetAndClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            form="loginForm"
            disabled={loading}
          >
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </>
      }
    >
      {error && (
        <div className="login-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form id="loginForm" onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="admin@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="label">Senha</label>
          <input
            className="form-input"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>
      </form>

      <div className="login-toggle">
        {mode === 'login' ? (
          <p>
            Não tem conta?{' '}
            <button className="btn-link" onClick={() => { setMode('signup'); setError(''); }}>
              Criar conta admin
            </button>
          </p>
        ) : (
          <p>
            Já tem conta?{' '}
            <button className="btn-link" onClick={() => { setMode('login'); setError(''); }}>
              Fazer login
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
}
