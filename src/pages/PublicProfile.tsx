import { useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { ErrorState, Spinner } from '../components/States';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getPublicProfile } from '../lib/api';
import { formatMonthYear } from '../lib/format';

export default function PublicProfile() {
  const { username = '' } = useParams();
  const profile = useAsync(() => getPublicProfile(username), [username]);
  useDocumentTitle(profile.data?.display_name);

  if (profile.loading) return <Spinner />;
  if (profile.error || !profile.data) return <div className="container"><ErrorState error={profile.error ?? 'Profile not found.'} /></div>;
  const u = profile.data;
  return (
    <div className="container profile">
      <div className="profile-head">
        <Avatar user={u} size={112} className="profile-avatar" />
        <div>
          <h1>{u.display_name}</h1>
          <p className="muted">@{u.username}</p>
          <p className="muted">Member since {formatMonthYear(u.joined_at)}</p>
          {u.bio && <p className="bio">{u.bio}</p>}
        </div>
      </div>
    </div>
  );
}
