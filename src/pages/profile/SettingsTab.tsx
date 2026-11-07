import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link2, Upload } from 'lucide-react';
import Avatar from '../../components/Avatar';
import { Spinner } from '../../components/States';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAsync } from '../../hooks/useAsync';
import * as api from '../../lib/api';
import { toApiError } from '../../lib/http';
import { imageUrl } from '../../lib/images';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Runs an API action, then toasts the result. Returns true on success. */
function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try { await action(); toast.success(success); return true; }
    catch (err) { toast.error(toApiError(err).message); return false; }
    finally { setBusy(false); }
  };
  return { busy, run };
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="settings-card"><h3>{title}</h3>{children}</section>;
}

export default function SettingsTab() {
  return (
    <div className="settings-grid">
      <AvatarCard />
      <div className="settings-forms">
        <ProfileCard />
        <UsernameCard />
        <EmailCard />
        <PasswordCard />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- avatar */

function AvatarCard() {
  const { user, refreshUser } = useAuth();
  const presets = useAsync(api.getAvatarPresets, []);
  const { busy, run } = useAction();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_AVATAR_BYTES) { toast.error('Avatar must be 2 MB or smaller.'); return; }
    setFile(f);
  };
  const upload = async () => {
    if (file && await run(() => api.uploadAvatar(file), 'Avatar uploaded')) { setFile(null); if (fileInput.current) fileInput.current.value = ''; await refreshUser(); }
  };
  const saveLink = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.setAvatarUrl(link.trim()), 'Avatar updated')) { setLink(''); setLinkOpen(false); await refreshUser(); }
  };
  const choose = async (id: string) => { if (await run(() => api.setAvatarPreset(id), 'Avatar updated')) await refreshUser(); };

  return (
    <div className="settings-side">
      <Card title="Profile avatar">
        <div className="avatar-preview">
          {preview ? <img className="avatar" style={{ width: 128, height: 128 }} src={preview} alt="New avatar preview" /> : <Avatar user={user} size={128} />}
        </div>
        <div className="avatar-actions">
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <button className="btn btn-primary btn-sm" onClick={() => fileInput.current?.click()}>Choose file</button>
          <button className="btn btn-danger btn-sm" onClick={upload} disabled={!file || busy}><Upload size={14} /> Upload</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setLinkOpen(!linkOpen)}><Link2 size={14} /> Choose link</button>
        </div>
        {linkOpen && (
          <form className="inline-form" onSubmit={saveLink}>
            <input type="url" required pattern="https://.*" placeholder="https://example.com/avatar.png" value={link} onChange={(e) => setLink(e.target.value)} />
            <button className="btn btn-primary btn-sm" disabled={busy}>Use</button>
          </form>
        )}
        <p className="muted small">Max size: 2 MB. PNG, JPG, GIF or WebP (converted to WebP). Links must be HTTPS.</p>
      </Card>

      <Card title="Default icons">
        {presets.loading ? <Spinner /> : (
          <div className="preset-grid">
            {presets.data?.map((p) => (
              <button key={p.id} className={user?.avatar?.value === p.id ? 'selected' : ''} onClick={() => choose(p.id)} disabled={busy} aria-label={`Use avatar ${p.id}`}>
                <img src={imageUrl(p.url)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------- forms */

function ProfileCard() {
  const { user, refreshUser } = useAuth();
  const { busy, run } = useAction();
  const [name, setName] = useState(user?.display_name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [isPublic, setIsPublic] = useState(user?.is_public ?? true);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.updateProfile({ display_name: name.trim(), bio: bio.trim() || null, is_public: isPublic }), 'Profile updated')) await refreshUser();
  };

  return (
    <Card title="Profile">
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Display name</span><input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>Bio <small>{bio.length}/300</small></span><textarea maxLength={300} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community about yourself" /></label>
        <label className="check"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Public profile <small>(your name, avatar and bio are visible to others)</small></label>
        <button className="btn btn-danger" disabled={busy}>Save changes</button>
      </form>
    </Card>
  );
}

function UsernameCard() {
  const { user, refreshUser } = useAuth();
  const { busy, run } = useAction();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.changeUsername(username.trim().toLowerCase(), password), 'Username changed')) { setUsername(''); setPassword(''); await refreshUser(); }
  };

  return (
    <Card title="Change your username">
      <form className="form two-col" onSubmit={submit}>
        <label className="field"><span>Current username</span><input disabled value={user?.username ?? ''} /></label>
        <label className="field"><span>New username</span><input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" title="3–24 letters, numbers or underscores" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="new_username" /></label>
        <label className="field span-2"><span>Current password</span><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn btn-danger" disabled={busy}>Update username</button>
      </form>
    </Card>
  );
}

function EmailCard() {
  const { user, refreshUser } = useAuth();
  const { busy, run } = useAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await run(() => api.changeEmail(email.trim(), password), 'Email changed')) { setEmail(''); setPassword(''); await refreshUser(); }
  };

  return (
    <Card title="Change your email address">
      <form className="form two-col" onSubmit={submit}>
        <label className="field"><span>Your email</span><input disabled value={user?.email ?? ''} /></label>
        <label className="field"><span>New email address</span><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter new email address" /></label>
        <label className="field span-2"><span>Current password</span><input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn btn-danger" disabled={busy}>Update email</button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const { logout } = useAuth();
  const toast = useToast();
  const { busy, run } = useAction();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && next !== confirm;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { toast.error('New passwords do not match.'); return; }
    // The API revokes every session on password change, so sign in again afterwards.
    if (await run(() => api.changePassword(current, next), 'Password changed — please sign in again')) await logout();
  };

  return (
    <Card title="Change your password">
      <form className="form two-col" onSubmit={submit}>
        <label className="field"><span>Current password</span><input required type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Enter current password" /></label>
        <label className="field"><span>New password</span><input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" /></label>
        <label className="field"><span>Confirm password</span><input required type="password" autoComplete="new-password" aria-invalid={mismatch} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" />{mismatch && <small className="form-error">Passwords don’t match</small>}</label>
        <div className="span-2"><button className="btn btn-danger" disabled={busy || mismatch}>Save changes</button></div>
      </form>
    </Card>
  );
}
