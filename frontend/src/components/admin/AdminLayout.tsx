import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    ShoppingBag,
    FileText,
    Link as LinkIcon,
    LogOut,
    Scale,
    Settings
} from 'lucide-react';

const AdminLayout = () => {
    const { session, signOut } = useAuth();
    const user = session?.user;
    const location = useLocation();
    const navigate = useNavigate();

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
        { name: 'Links de Pago', href: '/admin/payment-links', icon: LinkIcon },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="min-h-screen bg-slate-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-navy-900 text-white fixed h-full z-10 flex flex-col">
                <div className="p-6 flex items-center gap-3 border-b border-navy-800">
                    <Scale className="text-gold-500 w-8 h-8" />
                    <div>
                        <h1 className="font-serif font-bold text-lg">Panel Admin</h1>
                        <p className="text-xs text-gray-400">TuAbogadoEnRD</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
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

                <div className="p-4 border-t border-navy-800">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-navy-800 hover:text-red-300 w-full transition-colors"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                {/* Top Header */}
                <header className="bg-white h-16 shadow-sm flex items-center justify-end px-8 gap-4 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-navy-900 font-bold text-xs">
                            {getInitials()}
                        </span>
                        <span>{user?.email}</span>
                    </div>
                    <Link to="/admin/settings" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                        <Settings size={20} />
                    </Link>
                </header>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
