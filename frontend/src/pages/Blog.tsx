import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, ChevronRight, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BlogSubscribe from '../components/blog/BlogSubscribe';

const Blog = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const { data } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false });

        if (data) setPosts(data);
        setLoading(false);
    };

    // Calculate Dynamic Counts
    const categories = [
        { name: 'Legal', count: posts.filter(p => p.category === 'Legal').length },
        { name: 'Noticias', count: posts.filter(p => p.category === 'Noticias').length },
        { name: 'Consejos', count: posts.filter(p => p.category === 'Consejos').length },
        { name: 'Corporativo', count: posts.filter(p => p.category === 'Corporativo').length }
    ].filter(c => c.count > 0); // Optional: Hide empty categories if desired, or keep them showing 0

    const filteredPosts = posts.filter(post => {
        const matchesCategory = selectedCategory === 'Todos' || post.category === selectedCategory;
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Mock Data for "Most Read"
    const mostRead = [
        "Requisitos para solicitar el divorcio en República Dominicana",
        "Despido en República Dominicana: derechos del trabajador",
        "Visa de Inversor para República Dominicana"
    ];

    return (
        <div className="bg-slate-50 dark:bg-navy-900 min-h-screen font-sans transition-colors duration-300">
            {/* Header / Navbar Placeholder (Assuming Layout handles it, but verify alignment) */}

            {/* Hero Section */}
            <div className="bg-navy-900 text-white pt-24 pb-16 px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Blog Jurídico</h1>
                <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-light text-lg">
                    Información legal clara y actualizada para dominicanos, latinos y extranjeros.
                </p>

                {/* Search Bar */}
                <div className="max-w-xl mx-auto relative bg-white rounded-full overflow-hidden flex items-center shadow-lg p-1">
                    <Search className="text-gray-400 ml-4 w-5 h-5 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Busca un tema legal..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 outline-none text-navy-900 placeholder:text-gray-400"
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-10">

                    <div className="flex justify-between items-end border-b border-gray-200 dark:border-navy-700 pb-4">
                        <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-white">Artículos Recientes</h2>
                        <button className="text-gold-600 font-bold text-xs tracking-widest uppercase hover:underline">Ver Todos</button>
                    </div>

                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-navy-800 h-64 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Feature First Post if needed, or simple list */}
                            {filteredPosts.map((post) => (
                                <article key={post.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row group">
                                    <div className="md:w-2/5 h-64 md:h-auto overflow-hidden relative">
                                        <img
                                            src={post.image_url || 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80'}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 bg-gold-500 text-navy-900 text-xs font-bold rounded uppercase tracking-wider shadow-sm">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 md:w-3/5 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 text-gold-600 text-sm font-medium mb-3">
                                            <Calendar size={14} />
                                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-3 leading-tight group-hover:text-gold-500 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                                            {post.content}
                                        </p>
                                        <Link to={`/blog/${post.slug || post.id}`} className="text-gold-600 font-bold text-sm tracking-wide uppercase flex items-center gap-2 hover:gap-3 transition-all self-start">
                                            Leer más <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-8">

                    {/* Most Read (Mock) */}
                    <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
                            <span className="text-gold-500">~</span> Artículos Más Leídos
                        </h3>
                        <ul className="space-y-4 relative z-10">
                            {mostRead.map((item, idx) => (
                                <li key={idx} className="group cursor-pointer">
                                    <div className="flex gap-3">
                                        <ChevronRight size={16} className="text-gold-500 mt-1 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                                        <span className="text-gray-300 font-medium text-sm group-hover:text-white transition-colors">{item}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Categories */}
                    <div className="bg-white dark:bg-navy-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-navy-700">
                        <div className="border-l-4 border-gold-500 pl-4 mb-6">
                            <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-white">Categorías</h3>
                        </div>
                        <ul className="space-y-3">
                            {categories.map((cat, idx) => (
                                <li key={idx} className="flex justify-between items-center group cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-navy-700 rounded-lg transition-colors"
                                    onClick={() => setSelectedCategory(cat.name)}
                                >
                                    <span className={`text-gray-600 dark:text-gray-300 font-medium group-hover:text-navy-900 dark:group-hover:text-white transition-colors ${selectedCategory === cat.name ? 'text-gold-600 font-bold' : ''}`}>
                                        {cat.name}
                                    </span>
                                    <span className="bg-gray-100 dark:bg-navy-900 text-gray-500 text-xs py-1 px-2 rounded-full font-bold">
                                        {cat.count}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter Widget Reuse */}
                    <div className="bg-slate-100 dark:bg-navy-800 rounded-2xl p-6 border border-gray-200 dark:border-navy-700">
                        <BlogSubscribe />
                    </div>

                </aside>
            </div>
        </div>
    );
};

export default Blog;
