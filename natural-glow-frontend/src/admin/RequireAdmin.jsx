import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageSpinner } from '../components/ui/Feedback.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Route guard: only renders admin pages with a verified session; everyone else goes to the login page.
export default function RequireAdmin() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking') return <FullPageSpinner />;
  if (status !== 'authenticated') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
