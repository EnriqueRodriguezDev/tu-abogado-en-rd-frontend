import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Calendar, ArrowLeft, Clock, Share2, Tag, Loader2 } from 'lucide-react';
import BlogSubscribe from '../components/blog/BlogSubscribe';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) fetchPost();
    }, [slug]);

    const fetchPost = async () => {
        setLoading(true);
        // Try fetching by slug first
        let { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .single();

        // Fallback: try by ID if slug fails (in case we used ID in URL temporarily)
        if (!data) {
            const { data: byId } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', slug)
                .single();
            data = byId;
        }

        if (data) setPost(data);
        setLoading(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-900">
            <Loader2 className="animate-spin text-gold-500 w-12 h-12" />
        </div>
    );

    if (!post) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-navy-900 text-navy-900 dark:text-white">
            <h1 className="text-4xl font-serif font-bold mb-4">Artículo no encontrado</h1>
            <Link to="/blog" className="text-gold-500 hover:underline">Volver al Blog</Link>
        </div>
    );

    return (
        <div className="bg-slate-50 dark:bg-navy-900 min-h-screen font-sans transition-colors duration-300 pb-20">
            {/* Minimal Header for Navigation */}
            <div className="bg-navy-900 text-white py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <Link to="/blog" className="inline-flex items-center gap-2 text-gray-300 hover:text-gold-500 transition-colors">
                        <ArrowLeft size={20} /> Volver al Blog
                    </Link>
                </div>
            </div>

            {/* Hero Image */}
            <div className="w-full h-[400px] relative">
                <img
                    src={post.image_url || 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/40 to-transparent"></div>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                    <div className="max-w-4xl mx-auto">
                        <span className="inline-block px-4 py-1.5 bg-gold-500 text-navy-900 font-bold rounded-full text-sm mb-4 uppercase tracking-wider">
                            {post.category}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-gray-300 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gold-500" />
                                {new Date(post.created_at).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gold-500" />
                                5 min de lectura
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
                <div className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 md:p-12 text-lg text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-navy-700">

                    {/* Content */}
                    <article className="prose prose-lg dark:prose-invert max-w-none">
                        {/* We use simple whitespace-pre-wrap for now, assuming plain text content. 
                            If moving to rich text later, we'd use a parser here. */}
                        <div className="whitespace-pre-wrap font-serif">
                            {post.content}
                        </div>
                    </article>

                    {/* Tags & Share */}
                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-navy-700 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex gap-3">
                            {['Legal', 'RD', 'Actualidad'].map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-400 rounded-lg text-sm">
                                    <Tag size={14} /> {tag}
                                </span>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 text-gold-600 font-bold hover:text-gold-500 transition-colors">
                            <Share2 size={20} /> Compartir Artículo
                        </button>
                    </div>

                </div>

                {/* Newsletter Box */}
                <div className="mt-12">
                    <BlogSubscribe />
                </div>
            </main>
        </div>
    );
};

export default BlogPost;
