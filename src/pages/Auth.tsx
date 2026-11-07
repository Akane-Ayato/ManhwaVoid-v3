import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toApiError } from '../lib/http';

function useRedirectTarget() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from.startsWith('/') && !from.startsWith('//') ? from : '/';
}

function AuthFrame({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-side">
      <div className="auth-card">
        <Link to="/" className="auth-logo"><Logo size={48} /></Link>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth-switch">{footer}</p>
      </div>
      </div>
      <div className="auth-art" aria-hidden="true" />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete, minLength }: { value: string; onChange: (v: string) => void; placeholder: string; autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <Lock size={16} />
      <input required type={show ? 'text' : 'password'} value={value} minLength={minLength} maxLength={128} autoComplete={autoComplete} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="input-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
    </div>
  );
}

export function Login() {
  useDocumentTitle('Sign in');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={target} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(identity.trim(), password); navigate(target, { replace: true }); }
    catch (err) { setError(toApiError(err).message); }
    finally { setBusy(false); }
  };

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to sync your bookmarks and reading history." footer={<>New here? <Link to="/register" state={{ from: target }}>Create an account</Link></>}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Email or username</span>
          <div className="input-wrap"><User size={16} /><input required autoFocus autoComplete="username" value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="you@example.com" /></div>
        </label>
        <label className="field">
          <span>Password</span>
          <PasswordInput value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthFrame>
  );
}

export function Register() {
  useDocumentTitle('Create account');
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const target = useRedirectTarget();
  const [form, setForm] = useState({ display_name: '', username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={target} replace />;

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await register({ ...form, display_name: form.display_name.trim(), username: form.username.trim().toLowerCase(), email: form.email.trim() });
      navigate(target, { replace: true });
    } catch (err) { setError(toApiError(err).message); }
    finally { setBusy(false); }
  };

  return (
    <AuthFrame title="Create your account" subtitle="Bookmark titles and pick up where you left off on any device." footer={<>Already registered? <Link to="/login" state={{ from: target }}>Sign in</Link></>}>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>Display name</span>
          <div className="input-wrap"><User size={16} /><input required maxLength={40} value={form.display_name} onChange={(e) => set('display_name')(e.target.value)} placeholder="How should we call you?" /></div>
        </label>
        <label className="field">
          <span>Username</span>
          <div className="input-wrap"><User size={16} /><input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" title="3–24 letters, numbers or underscores" autoComplete="username" value={form.username} onChange={(e) => set('username')(e.target.value)} placeholder="letters, numbers, underscores" /></div>
        </label>
        <label className="field">
          <span>Email</span>
          <div className="input-wrap"><Mail size={16} /><input required type="email" autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="you@example.com" /></div>
        </label>
        <label className="field">
          <span>Password</span>
          <PasswordInput value={form.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthFrame>
  );
}
