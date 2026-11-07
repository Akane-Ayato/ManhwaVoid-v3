import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container not-found">
      <h1>404</h1>
      <p>We couldn’t find that page.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
