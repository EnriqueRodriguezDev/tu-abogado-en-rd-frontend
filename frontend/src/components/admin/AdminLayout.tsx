import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    FileText,
    Link as LinkIcon,
    LogOut,
    Scale,
    Settings,
    Menu,
    X,
    Building2,
    Receipt,
    Barcode,
    Users
} from 'lucide-react';

const AdminLayout = () => {
    const { session, signOut } = useAuth();
    const user = session?.user;
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const getInitials = () => {
        if (!user?.email) return 'AD';
        const namePart = user.email.split('@')[0];
        return namePart.substring(0, 2).toUpperCase();
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/admin/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Servicios', href: '/admin/services', icon: ShoppingBag },
        { name: 'Blog', href: '/admin/blog', icon: FileText },
        { name: 'Facturas', href: '/admin/invoices', icon: Receipt },
        { name: 'Gestión NCF', href: '/admin/ncf', icon: Barcode },
        { name: 'Empresa', href: '/admin/company-settings', icon: Building2 },
        { name: 'Equipo Legal', href: '/admin/lawyers', icon: Users },
        { name: 'Links de Pago', href: '/admin/payment-links', icon: LinkIcon },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-[100dvh] bg-slate-100 flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed md:static inset-y-0 left-0 z-50 w-64 bg-navy-900 text-white flex flex-col h-[100dvh] md:h-screen transition-transform duration-300 ease-out shadow-xl
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="p-6 flex items-center justify-between border-b border-navy-800 flex-none h-20">
                    <div className="flex items-center gap-3">
                        <Scale className="text-gold-500 w-8 h-8" />
                        <div>
                            <h1 className="font-serif font-bold text-lg leading-none">Panel Admin</h1>
                            <p className="text-[10px] text-gray-400 mt-0.5 tracking-wider">TuAbogadoEnRD</p>
                        </div>
                    </div>
                    {/* Close Button for Mobile */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                                ? 'bg-gold-500 text-navy-900 font-bold'
                                : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-navy-800 flex-none pb-[env(safe-area-inset-bottom)]">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-navy-800 hover:text-red-300 w-full transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden w-full">
                {/* Top Header */}
                <header className="bg-white h-16 shadow-sm flex items-center justify-between md:justify-end px-4 md:px-8 gap-4 flex-none z-10 relative">
                    {/* Hamburger Button */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-navy-900 font-bold text-xs">
                                {getInitials()}
                            </span>
                            <span className="hidden md:inline">{user?.email}</span>
                        </div>
                        <Link to="/admin/settings" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                            <Settings size={20} />
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-slate-50">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
