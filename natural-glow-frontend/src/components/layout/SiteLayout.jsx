import { Outlet } from 'react-router-dom';
import { SettingsProvider } from '../../context/SettingsContext.jsx';
import { ServicesProvider } from '../../context/ServicesContext.jsx';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import WhatsAppFloat from './WhatsAppFloat.jsx';
import ScrollManager from './ScrollManager.jsx';
import JsonLd from './JsonLd.jsx';

// Wraps every public page. Settings and the services list are fetched once here and shared via context.
export default function SiteLayout() {
  return (
    <SettingsProvider>
      <ServicesProvider>
        <ScrollManager />
        <JsonLd />
        <Navbar />
        <main id="main">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppFloat />
      </ServicesProvider>
    </SettingsProvider>
  );
}
