import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Save, Building2, Upload, Loader2 } from 'lucide-react';

const CompanySettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        razon_social: '',
        rnc: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        logo_url: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        // Assumes single row or limit 1
        const { data, error } = await supabase.from('company_settings').select('*').limit(1).single();
        if (data) {
            setFormData(data);
        } else if (error && error.code !== 'PGRST116') {
            console.error("Error fetching settings", error);
        }
        setLoading(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        // RNC: Only numbers, 9 or 11 digits
        const rncClean = formData.rnc.replace(/\D/g, '');
        if (!rncClean) newErrors.rnc = 'El RNC es requerido';
        else if (rncClean.length !== 9 && rncClean.length !== 11) newErrors.rnc = 'El RNC debe tener 9 u 11 dígitos';

        // Phone: Only numbers, 10 digits (validate raw)
        const phoneClean = formData.phone.replace(/\D/g, '');
        if (!phoneClean) newErrors.phone = 'El teléfono es requerido';
        else if (phoneClean.length !== 10) newErrors.phone = 'El teléfono debe tener 10 dígitos';

        // Email: Standard regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) newErrors.email = 'El correo es requerido';
        else if (!emailRegex.test(formData.email)) newErrors.email = 'Correo inválido';

        if (!formData.razon_social) newErrors.razon_social = 'La Razón Social es requerida';
        if (!formData.address) newErrors.address = 'La dirección es requerida';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);
        try {
            let logoUrl = formData.logo_url;

            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `company_logo_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('images').upload(fileName, logoFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('images').getPublicUrl(fileName);
                logoUrl = data.publicUrl;
            }

            const payload = {
                ...formData,
                logo_url: logoUrl,
                updated_at: new Date().toISOString()
            };

            // Upsert based on a fixed ID or create new if empty
            // Ideally company_settings has a single row with id=1
            const { error } = await supabase.from('company_settings').upsert({ id: 1, ...payload });

            if (error) throw error;
            alert("Configuración guardada correctamente");
        } catch (error: any) {
            alert("Error: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-gold-500" /></div>;

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <h1 className="text-3xl font-serif font-bold text-navy-900 mb-8 flex items-center gap-3">
                <Building2 className="text-gold-500" /> Configuración Fiscal
            </h1>

            <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Logo Section */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-white transition-all">
                    {formData.logo_url || logoFile ? (
                        <div className="relative group">
                            <img
                                src={logoFile ? URL.createObjectURL(logoFile) : formData.logo_url}
                                className="h-32 object-contain mb-4"
                                alt="Logo"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-opacity text-white text-xs cursor-pointer" onClick={() => setLogoFile(null)}>Cambiar</div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <Upload size={48} className="mx-auto mb-2" />
                            <p>Subir Logo de la Empresa</p>
                        </div>
                    )}
                    <input type="file" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="mt-4 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100" />
                </div>

                <div className="space-y-4">
                    <label className="block">
                        <span className="text-gray-700 font-bold text-sm">Razón Social</span>
                        <input name="razon_social" value={formData.razon_social} onChange={handleChange} className={`mt-1 block w-full rounded-lg border bg-gray-50 p-3 focus:ring-gold-500 focus:border-gold-500 ${errors.razon_social ? 'border-red-500' : 'border-gray-300'}`} placeholder="Tu Abogado en RD S.R.L." />
                        {errors.razon_social && <span className="text-red-500 text-xs">{errors.razon_social}</span>}
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-bold text-sm">RNC (Identificación Fiscal)</span>
                        <input name="rnc" value={formData.rnc} onChange={handleChange} className={`mt-1 block w-full rounded-lg border bg-gray-50 p-3 font-mono ${errors.rnc ? 'border-red-500' : 'border-gray-300'}`} placeholder="13XXXXXXX" maxLength={11} />
                        {errors.rnc && <span className="text-red-500 text-xs">{errors.rnc}</span>}
                    </label>
                </div>

                <div className="space-y-4">
                    <label className="block">
                        <span className="text-gray-700 font-bold text-sm">Dirección Física</span>
                        <textarea name="address" value={formData.address} onChange={handleChange} className={`mt-1 block w-full rounded-lg border bg-gray-50 p-3 h-[80px] ${errors.address ? 'border-red-500' : 'border-gray-300'}`} placeholder="Calle Principal #123..." />
                        {errors.address && <span className="text-red-500 text-xs">{errors.address}</span>}
                    </label>
                </div>

                <div className="space-y-4">
                    <label className="block">
                        <span className="text-gray-700 font-bold text-sm">Teléfono</span>
                        <input name="phone" value={formData.phone} onChange={handleChange} className={`mt-1 block w-full rounded-lg border bg-gray-50 p-3 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="(809) 555-0123" />
                        {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
                    </label>
                    <label className="block">
                        <span className="text-gray-700 font-bold text-sm">Correo Electrónico</span>
                        <input name="email" value={formData.email} onChange={handleChange} className={`mt-1 block w-full rounded-lg border bg-gray-50 p-3 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="contacto@tuabogado.do" />
                        {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                    </label>
                </div>

                <div className="md:col-span-2 pt-6 border-t border-gray-100 flex justify-end">
                    <button type="submit" disabled={saving} className="bg-navy-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-navy-800 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                        {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Guardar Cambios</>}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default CompanySettings;
