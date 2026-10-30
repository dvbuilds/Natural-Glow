import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta.js';

export default function NotFound() {
  usePageMeta({ title: 'Page not found', noindex: true });
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-5 pt-28 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 font-serif text-5xl">Page not found</h1>
        <p className="mt-4 text-ink/70">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="btn btn-primary mt-8">Back to home</Link>
      </div>
    </section>
  );
}
