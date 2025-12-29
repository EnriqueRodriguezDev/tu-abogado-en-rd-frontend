import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Edit, X, Briefcase, Image as ImageIcon, Loader2, DollarSign, FileText, Type, Sparkles, Scale, Gavel, Shield, Users, Landmark } from 'lucide-react';

const ServicesManager = () => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [content, setContent] = useState('');
    const [priceDop, setPriceDop] = useState('');
    const [priceUsd, setPriceUsd] = useState('');
    const [category, setCategory] = useState('Legal');
    const [formImage, setFormImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (formImage) {
            const objectUrl = URL.createObjectURL(formImage);
            setImagePreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [formImage]);

    const fetchServices = async () => {
        const { data } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setServices(data);
        setLoading(false);
    };

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

    const ICON_MAP: any = {
        Briefcase, 
        Scale, 
        Gavel, 
        FileText, 
        Shield, 
        Users, 
        Landmark, 
        DollarSign
    };

    const [selectedIcon, setSelectedIcon] = useState('Briefcase');
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
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert('Error IA: ' + errorMessage);
            return null;
        } finally {
            setAiLoading(null);
        }
    };

    const handleAIIcon = async () => {
        if (!name) return alert('Escribe el nombre del servicio primero.');
        const iconName = await generateWithAI('pick-icon', name);
        if (iconName && ICON_MAP[iconName]) {
            setSelectedIcon(iconName);
        }
    };

    const handleAIText = async () => {
        if (!name) return alert('Escribe el nombre del servicio primero.'); // Changed to check name for better context
        // Use new mode for detailed description
        const improved = await generateWithAI('generate-service-description', name);
        if (improved) setContent(improved); // Set to content (long info), not description (short)
    };

    const handleSave = async () => {
        setUploading(true);
        let imageUrl = '';

        if (formImage) {
            const url = await handleImageUpload(formImage);
            if (url) imageUrl = url;
            else {
                setUploading(false);
                return;
            }
        } else if (imagePreview && imagePreview.startsWith('http')) {
            // AI Generated or existing URL
             imageUrl = imagePreview;
        } else if (editingId) {
            const existingService = services.find(s => s.id === editingId);
            if (existingService) imageUrl = existingService.image_url;
        }

        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        const serviceData: any = {
            name,
            description,
            content: content || description, // Fallback to description if no content
            slug,
            category,
            price_dop: parseFloat(priceDop) || 0,
            price_usd: parseFloat(priceUsd) || 0,
            is_active: true,
            icon_name: selectedIcon // Ensure using icon_name to match DB
        };

        if (imageUrl) serviceData.image_url = imageUrl;

        let error;
        if (editingId) {
            const { error: updateError } = await supabase.from('services').update(serviceData).eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('services').insert([serviceData]);
            error = insertError;
        }

        setUploading(false);

        if (error) {
            alert('Error al guardar servicio: ' + error.message);
        } else {
            handleClose();
            fetchServices();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
        await supabase.from('services').delete().eq('id', id);
        fetchServices();
    };

    const startEdit = (service: any) => {
        setEditingId(service.id);
        setName(service.name);
        setDescription(service.description || '');
        setContent(service.content || '');
        setPriceDop(service.price_dop?.toString() || '');
        setPriceUsd(service.price_usd?.toString() || '');
        setCategory(service.category || 'Legal');
        // If the service has an icon field, we would use it here. 
        // For now, we'll try to guess or default if not present, assuming 'icon' might exist in future or using default.
        // If we strictly follow current schema, we might not have it, but I will add it to the state.
        if (service.icon_name && ICON_MAP[service.icon_name]) {
            setSelectedIcon(service.icon_name);
        } else if (service.icon && ICON_MAP[service.icon]) { // Fallback for old data
             setSelectedIcon(service.icon);
        } else {
            setSelectedIcon('Briefcase');
        }

        if (service.image_url) {
            setImagePreview(service.image_url);
        } else {
            setImagePreview(null);
        }
        setFormImage(null);
        setIsCreating(true);
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setName('');
        setDescription('');
        setContent('');
        setPriceDop('');
        setPriceUsd('');
        setCategory('Legal');
        setFormImage(null);
        setImagePreview(null);
        setSelectedIcon('Briefcase');
        setUploading(false);
    };

    const handleClose = () => {
        resetForm();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-gold-500">Gestión de Servicios</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Administre la cartera de servicios legales visible para sus clientes.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                >
                    <Plus size={20} />
                    Nuevo Servicio
                </button>
            </div>

            {/* Services Grid (Active) */}
            <div>
                <h3 className="text-xl font-bold text-navy-900 dark:text-gold-500 mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 bg-gold-500 rounded-sm"></span>
                    Servicios Activos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" /></div>
                    ) : services.map((service) => (
                        <div key={service.id} className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-navy-700 hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
                            {/* Decorative Background Element */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 dark:bg-navy-700/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="flex justify-between items-start relative z-10 mb-4">
                                <div className="p-3 bg-navy-50 dark:bg-navy-900 rounded-xl text-navy-900 dark:text-gold-500 shadow-sm border border-gray-100 dark:border-navy-700">
                                    {(() => {
                                        const IconComp = ICON_MAP[service.icon_name] || ICON_MAP[service.icon] || Briefcase;
                                        return <IconComp size={28} />;
                                    })()}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => startEdit(service)} className="p-2 text-gray-400 hover:text-gold-500 hover:bg-gold-50 dark:hover:bg-navy-700 rounded-lg transition-colors">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-navy-700 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h4 className="text-xl font-bold text-navy-900 dark:text-white mb-2 relative z-10">{service.name}</h4>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 relative z-10 leading-relaxed mb-4 flex-1">
                                {service.description}
                            </p>

                            <div className="relative z-10 flex gap-3 text-sm font-bold mt-auto">
                                <span className="bg-navy-100 dark:bg-navy-900 text-navy-800 dark:text-gold-500 px-3 py-1 rounded-lg">
                                    RD$ {service.price_dop}
                                </span>
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg">
                                    USD$ {service.price_usd}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal / Slide-over Form */}
            {(isCreating || editingId) && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={handleBackdropClick}
                >
                    <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-navy-700" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-navy-800 flex justify-between items-center bg-gray-50 dark:bg-navy-900">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-gold-500">
                                    {isCreating && !editingId ? 'Agregar Nuevo Servicio' : 'Editar Servicio'}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Complete la información del servicio legal.</p>
                            </div>
                            <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-navy-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Basic Info & Image */}
                                <div className="space-y-6">
                                    {/* Icon Selection with AI */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900 dark:text-gold-500 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon size={16} /> Icono
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAIIcon}
                                                disabled={!!aiLoading}
                                                className="text-xs font-bold text-navy-900 bg-gold-500/20 hover:bg-gold-500/40 dark:text-gold-500 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                {aiLoading === 'pick-icon' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                Sugerir Icono
                                            </button>
                                        </label>

                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            {Object.keys(ICON_MAP).map((iconKey) => {
                                                const IconComponent = ICON_MAP[iconKey];
                                                return (
                                                    <button
                                                        key={iconKey}
                                                        type="button"
                                                        onClick={() => setSelectedIcon(iconKey)}
                                                        className={`p-3 rounded-xl flex items-center justify-center transition-all ${selectedIcon === iconKey ? 'bg-gold-500 text-navy-900 shadow-lg scale-105' : 'bg-gray-100 dark:bg-navy-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-700'}`}
                                                    >
                                                        <IconComponent size={24} />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Image Upload Area */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900 dark:text-gold-500 flex items-center gap-2">
                                            <ImageIcon size={16} /> Imagen de Fondo (Opcional)
                                        </label>

                                        <div className="border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-2xl h-32 flex flex-col items-center justify-center text-gray-400 dark:text-navy-600 bg-gray-50 dark:bg-navy-800 hover:border-gold-500 dark:hover:border-gold-500 transition-colors cursor-pointer relative group overflow-hidden">
                                            {imagePreview ? (
                                                <div className="w-full h-full relative">
                                                    <img src={imagePreview} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Cambiar Imagen</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon size={24} className="mb-2 group-hover:text-gold-500 transition-colors" />
                                                    <span className="text-xs font-semibold">Click para subir</span>
                                                </>
                                            )}
                                            <input type="file" onChange={(e) => setFormImage(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                        </div>
                                    </div>
                                    
                                    {/* Name Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900 dark:text-gold-500 flex items-center gap-2">
                                            <Type size={16} /> Nombre del Servicio
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ej: Derecho Penal"
                                            className="w-full bg-gray-50 dark:bg-navy-800 border-none text-navy-900 dark:text-white placeholder-gray-400 dark:placeholder-navy-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-navy-900 dark:text-gold-500 flex items-center gap-2">
                                                <DollarSign size={16} /> Precio (DOP)
                                            </label>
                                            <input
                                                type="number"
                                                value={priceDop}
                                                onChange={(e) => setPriceDop(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 dark:bg-navy-800 border-none text-navy-900 dark:text-white placeholder-gray-400 dark:placeholder-navy-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-navy-900 dark:text-gold-500 flex items-center gap-2">
                                                <DollarSign size={16} /> Precio (USD)
                                            </label>
                                            <input
                                                type="number"
                                                value={priceUsd}
                                                onChange={(e) => setPriceUsd(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 dark:bg-navy-800 border-none text-navy-900 dark:text-white placeholder-gray-400 dark:placeholder-navy-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Description & Content */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-navy-900 dark:text-gold-500 flex items-center justify-between">
                                            <span>Resumen Corto (Description)</span>
                                            <button
                                                type="button"
                                                onClick={handleAIText}
                                                disabled={!!aiLoading}
                                                className="text-xs font-bold text-navy-900 bg-gold-500/20 hover:bg-gold-500/40 dark:text-gold-500 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                {aiLoading === 'correct-text' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                Mejorar Texto
                                            </button>
                                        </label>
                                        {/* Short description input - keeping it separate */}
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Breve resumen (1-2 frases)..."
                                            rows={2}
                                            className="w-full bg-gray-50 dark:bg-navy-800 border-none text-navy-900 dark:text-white placeholder-gray-400 dark:placeholder-navy-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2 h-full flex flex-col">
                                        <label className="text-sm font-bold text-navy-900 dark:text-gold-500 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} /> Contenido Completo (Detalle)
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAIText}
                                                disabled={!!aiLoading}
                                                className="text-xs font-bold text-navy-900 bg-gold-500/20 hover:bg-gold-500/40 dark:text-gold-500 dark:bg-navy-700 dark:hover:bg-navy-600 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all disabled:opacity-50"
                                            >
                                                {aiLoading === 'generate-service-description' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                                Generar Detalle
                                            </button>
                                        </label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Descripción detallada del servicio, requisitos, beneficios..."
                                            rows={8}
                                            className="w-full flex-1 bg-gray-50 dark:bg-navy-800 border-none text-navy-900 dark:text-white placeholder-gray-400 dark:placeholder-navy-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-navy-800 bg-gray-50 dark:bg-navy-900 flex flex-col gap-3">
                            <button onClick={handleSave} disabled={uploading} className="w-full py-3.5 bg-gold-500 text-navy-900 font-bold rounded-xl hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                {uploading ? <Loader2 className="animate-spin" /> : (editingId ? 'Guardar Cambios' : 'Guardar Servicio')}
                            </button>
                            <button onClick={handleClose} disabled={uploading} className="w-full py-3.5 bg-transparent border border-gray-200 dark:border-navy-700 text-gray-500 dark:text-gray-400 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServicesManager;
