import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AdminLayout from './AdminLayout.jsx';
import RequireAdmin from './RequireAdmin.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import OffersPage from './pages/OffersPage.jsx';
import GalleryPage from './pages/GalleryPage.jsx';
import TestimonialsPage from './pages/TestimonialsPage.jsx';
import EnquiriesPage from './pages/EnquiriesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="offers" element={<OffersPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="testimonials" element={<TestimonialsPage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AuthProvider>
  );
}
