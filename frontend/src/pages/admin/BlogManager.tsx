import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Image as ImageIcon, Loader2, Edit, X, Calendar, Type, FileText, ChevronDown, Sparkles } from 'lucide-react';

const BlogManager = () => {
    interface BlogPost {
        id: string;
        created_at: string;
        title: string;
        content: string;
        category: string;
        image_url: string;
        slug: string;
        published: boolean;
    }

    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Legal');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        const { data } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setPosts(data);
        setLoading(false);
    }, []); // Removed empty dependencies to match useCallback usage

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const { data } = await supabase
                .from('blog_posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (mounted) {
                if (data) setPosts(data);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    // Clean up object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageUpload = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);

        if (uploadError) {
            alert('Error subiendo imagen: ' + uploadError.message);
            return null;
        }

        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setImageFile(file);

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        } else {
            if (editingId) {
                // Determine what the original image was
                const currentPost = posts.find(p => p.id === editingId);
                setImagePreview(currentPost?.image_url || null);
            } else {
                setImagePreview(null);
            }
        }
    };

    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const generateWithAI = async (mode: string, context: string, currentContent?: string) => {
        setAiLoading(mode);
        try {
            const { data, error } = await supabase.functions.invoke('ai-assistant', {
                body: { mode, context, currentContent }
            });

            if (error) throw error;
            return data.result;
        } catch (err: unknown) {
            alert('Error IA: ' + (err as Error).message);
            return null;
        } finally {
            setAiLoading(null);
        }
    };

    const handleAIContent = async () => {
        if (!title) return alert('Por favor escribe un título primero.');
        const generated = await generateWithAI('generate-blog-content', title);
        if (generated) setContent(generated);
    };

    const handleAIImage = async () => {
        if (!title) return alert('Por favor escribe un título primero.');
        const prompt = await generateWithAI('generate-image-prompt', title);
        
        if (prompt) {
            const encodedPrompt = encodeURIComponent(prompt);
            const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=800&height=600&seed=${Math.random()}&model=flux`;
            setImagePreview(imageUrl);
            setImageFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        let imageUrl = '';

        if (imageFile) {
            const url = await handleImageUpload(imageFile);
            if (url) imageUrl = url;
            else {
                setUploading(false); // Stop if upload failed
                return;
            }
        } else if (imagePreview && imagePreview.startsWith('http')) {
            // AI generated URL or existing URL - prioritizing AI which sets preview
             imageUrl = imagePreview;
        } else if (editingId) {
            // Keep existing image if no new file is selected and no AI url
            const existingPost = posts.find((p) => p.id === editingId);
            if (existingPost) imageUrl = existingPost.image_url;
        }

        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const postData: Partial<BlogPost> = {
            title,
            slug,
            content,
            category,
            published: true
        };

        if (imageUrl) postData.image_url = imageUrl;

        let error;
        let res;
        if (editingId) {
            res = await supabase.from('blog_posts').update(postData).eq('id', editingId);
            error = res.error;
        } else {
            res = await supabase.from('blog_posts').insert([postData]).select();
            error = res.error;
        }

        // Trigger Newsletter for both create and update
        const targetId = editingId || (res.data && res.data[0]?.id);

        if (!error && targetId) {
            supabase.functions.invoke('send-newsletter', {
                body: {
                    postId: targetId
                }
            });
        }

        if (error) {
            alert('Error al publicar: ' + error.message);
        } else {
            handleClose(); // Use common close handler
            fetchPosts();
        }
        setUploading(false);
    };

    const resetForm = () => {
        setTitle('');
        setContent('');
        setCategory('Legal');
        setImageFile(null);
        setImagePreview(null);
        setEditingId(null);
    };

    const handleClose = () => {
        setShowForm(false);
        resetForm();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const startEdit = (post: BlogPost) => {
        setEditingId(post.id);
        setTitle(post.title);
        setContent(post.content || '');
        setCategory(post.category);
        if (post.image_url) {
            setImagePreview(post.image_url);
        } else {
            setImagePreview(null);
        }
        setImageFile(null); // Clear any previous file selection
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;
        await supabase.from('blog_posts').delete().eq('id', id);
        fetchPosts();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-gold-500">Gestión de Blog</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Crea, edita o elimina noticias y artículos legales.</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                >
                    <Plus size={20} />
                    Crear Artículo
                </button>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="animate-spin text-gold-500" size={32} />
                    </div>
                ) : posts.map((post) => (
                    <article key={post.id} className="bg-white dark:bg-navy-800 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all overflow-hidden group flex flex-col h-full relative">
                        {/* Actions Overlay */}
                        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => startEdit(post)} className="p-2 bg-white/90 dark:bg-navy-900/90 text-navy-900 dark:text-gold-500 rounded-lg hover:scale-110 transition-transform shadow-sm backdrop-blur-sm">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(post.id)} className="p-2 bg-white/90 dark:bg-navy-900/90 text-red-500 rounded-lg hover:scale-110 transition-transform shadow-sm backdrop-blur-sm">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="h-48 overflow-hidden relative bg-gray-100 dark:bg-navy-900">
                            {post.image_url ? (
                                <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-navy-700">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3">
                                <span className="px-3 py-1 bg-navy-900/80 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wide border border-white/10">
                                    {post.category}
                                </span>
                            </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(post.created_at).toLocaleDateString()}
                            </div>
                            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2 line-clamp-2 leading-tight">{post.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3 flex-1">{post.content}</p>
                        </div>
                    </article>
                ))}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={handleBackdropClick} // Close on backdrop click
                >
                    <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-navy-700" onClick={e => e.stopPropagation()}>

                        <div className="p-6 border-b border-gray-100 dark:border-navy-800 flex justify-between items-center bg-gray-50 dark:bg-navy-900">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-gold-500">
                                    {editingId ? 'Editar Artículo' : 'Nuevo Artículo'}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Comparte conocimiento legal con tu audiencia.</p>
                            </div>
                            <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-navy-900">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center gap-2">
                                        <Type size={16} /> Título del Artículo
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Entendiendo la Ley de Propiedad en RD"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-navy-800 border border-transparent dark:border-navy-700 rounded-xl p-4 text-lg font-bold text-navy-900 dark:text-white focus:ring-2 focus:ring-gold-500 outline-none transition-all placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-navy-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon size={16} /> Imagen Destacada
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAIImage}
                                            disabled={!!aiLoading}
                                            className="text-xs font-bold text-navy-900 bg-gold-500/20 hover:bg-gold-500/40 dark:text-gold-500 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {aiLoading === 'generate-image-prompt' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            Generar con IA
                                        </button>
                                    </label>

                                    {/* Updated Image Upload with Preview */}
                                    <div className="border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-2xl h-56 relative overflow-hidden group hover:border-gold-500 dark:hover:border-gold-500 transition-colors bg-gray-50 dark:bg-navy-800">
                                        {imagePreview ? (
                                            <div className="w-full h-full relative">
                                                <img src={imagePreview} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Cambiar Imagen</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-navy-500">
                                                <div className="w-14 h-14 bg-white dark:bg-navy-700 rounded-full flex items-center justify-center shadow-lg mb-3 text-gold-500">
                                                    <ImageIcon size={28} />
                                                </div>
                                                <span className="text-sm font-bold text-navy-900 dark:text-white">Subir Imagen</span>
                                                <span className="text-xs mt-1">Soporta JPG, PNG (Max 5MB)</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            onChange={handleImageSelect}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 block">Categoría</label>
                                        <div className="relative">
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-navy-800 border border-transparent dark:border-navy-700 rounded-xl p-3 appearance-none focus:ring-2 focus:ring-gold-500 outline-none text-navy-900 dark:text-white"
                                            >
                                                <option>Legal</option>
                                                <option>Noticias</option>
                                                <option>Consejos</option>
                                                <option>Corporativo</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-navy-900 dark:text-gold-500 mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} /> Contenido
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAIContent}
                                            disabled={!!aiLoading}
                                            className="text-xs font-bold text-navy-900 bg-gold-500/20 hover:bg-gold-500/40 dark:text-gold-500 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {aiLoading === 'generate-blog-content' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            Redactar con IA
                                        </button>
                                    </label>
                                    <textarea
                                        placeholder="Escribe el contenido de tu artículo aquí..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={8}
                                        className="w-full bg-gray-50 dark:bg-navy-800 border border-transparent dark:border-navy-700 rounded-xl p-4 focus:ring-2 focus:ring-gold-500 outline-none transition-all resize-none text-navy-900 dark:text-white leading-relaxed placeholder:text-gray-400 dark:placeholder:text-navy-500"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-navy-800">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-6 py-3.5 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="bg-gold-500 text-navy-900 px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" /> : (editingId ? 'Guardar Cambios' : 'Publicar Artículo')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogManager;
