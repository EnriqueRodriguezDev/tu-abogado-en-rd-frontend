
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Booking from './pages/Booking';

// Admin Imports
import Login from './pages/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import { RequireAuth } from './components/auth/RequireAuth';

// Placeholder Pages
import Dashboard from './pages/admin/Dashboard';
import ServicesManager from './pages/admin/ServicesManager';
import BlogManager from './pages/admin/BlogManager';
import CompanySettings from './pages/admin/CompanySettings';
import InvoicesManager from './pages/admin/InvoicesManager';
import NCFManager from './pages/admin/NCFManager';
import LawyersManager from './pages/admin/LawyersManager';
//const ProductManager = () => <div><h1 className="text-2xl font-bold mb-4">Productos</h1><p>Próximamente: Gestión de productos</p></div>;
//const BlogManager = () => <div><h1 className="text-2xl font-bold mb-4">Blog CMS</h1><p>Próximamente: Editor de artículos</p></div>;
const PaymentLinks = () => <div><h1 className="text-2xl font-bold mb-4">Links de Pago</h1><p>Próximamente: Generador de links</p></div>;
// const Settings = () => <div><h1 className="text-2xl font-bold mb-4">Configuración</h1><p>Próximamente: Ajustes del admin</p></div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="servicios" element={<Services />} />
          <Route path="servicios/:slug" element={<ServiceDetail />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<BlogPost />} />
          <Route path="contacto" element={<Contact />} />
          <Route path="booking" element={<Booking />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />

        <Route path="/admin" element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="blog" element={<BlogManager />} />
          <Route path="payment-links" element={<PaymentLinks />} />
          <Route path="company-settings" element={<CompanySettings />} />
          <Route path="invoices" element={<InvoicesManager />} />
          <Route path="ncf" element={<NCFManager />} />
          <Route path="lawyers" element={<LawyersManager />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
