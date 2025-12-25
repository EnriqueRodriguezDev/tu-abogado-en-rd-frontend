import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Scale, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../ui/ThemeToggle';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { t } = useTranslation();

    const navigation = [
        { name: 'Inicio', href: '/', key: 'home' },
        { name: 'Servicios', href: '/servicios', key: 'services' },
        { name: 'Blog', href: '/blog', key: 'blog' },
        { name: 'Contacto', href: '/contacto', key: 'contact' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="bg-navy-900 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <Scale className="h-8 w-8 text-gold-500" />
                            <div className="flex flex-col">
                                <span className="font-serif text-xl font-bold tracking-wide">TuAbogadoEnRD</span>
                                <span className="text-[10px] text-gray-300 uppercase tracking-wider">Asesoría Legal Dominicana</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`${isActive(item.href) ? 'text-gold-500' : 'text-gray-300 hover:text-white'
                                    } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                            >
                                {t(`nav.${item.key}`)}
                            </Link>
                        ))}

                        <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                            <ThemeToggle />
                            <LanguageSwitcher />
                        </div>

                        {/* Video Consultation Button para PC: TODO: ajustar un mejor tamaño*/}
                        <Link
                            to="/booking"
                            onClick={() => setIsOpen(false)}
                            className="block w-full text-center mt-4 bg-gold-500 text-white px-4 py-3 rounded-md font-bold hover:bg-gold-600 flex items-center justify-center gap-2"
                        >
                            <Video size={18} />
                            {t('nav.videoCons')}
                        </Link>

                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center gap-4 md:hidden">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-navy-800 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-navy-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`${isActive(item.href) ? 'bg-navy-900 text-gold-500' : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                                    } block px-3 py-2 rounded-md text-base font-medium`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <Link
                            to="/booking"
                            onClick={() => setIsOpen(false)}
                            className="block w-full text-center mt-4 bg-gold-500 text-white px-4 py-3 rounded-md font-bold hover:bg-gold-600 flex items-center justify-center gap-2"
                        >
                            <Video size={18} />
                            {t('nav.videoCons')}
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
