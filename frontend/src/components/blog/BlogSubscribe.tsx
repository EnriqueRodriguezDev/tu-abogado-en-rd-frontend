import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Send, Loader2 } from 'lucide-react';

const BlogSubscribe = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'existing'>('idle');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');

        try {
            const { data, error } = await supabase.functions.invoke('subscriptions', {
                body: { email }
            });

            if (error) {
                console.error('Error subscribing:', error);
                // If the function is not found (404), it means it's not deployed
                if (error.message?.includes('not found') || error.code === '404') {
                    alert('Error: La función de suscripción no está desplegada. Por favor, contacta al administrador.');
                }
                setStatus('idle');
                return;
            }

            if (data?.message === 'Already subscribed') {
                setStatus('existing');
                setTimeout(() => setStatus('idle'), 5000);
                return;
            }

            setStatus('success');
            setEmail('');
            setTimeout(() => setStatus('idle'), 5000);
        } catch (err) {
            console.error('Unexpected error:', err);
            setStatus('idle');
        }
    };

    return (
        <div className="bg-navy-900 rounded-2xl p-8 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent"></div>

            <div className="relative z-10 max-w-lg mx-auto">

                <h3 className="text-2xl font-serif font-bold mb-4 text-white">Suscríbete al Boletín Legal</h3>
                <p className="text-gray-300 mb-8">
                    Recibe análisis jurídicos exclusivos, noticias relevantes y consejos prácticos directamente en tu bandeja de entrada.
                </p>

                <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-3">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full md:flex-1 bg-navy-800 border border-navy-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-gold-500 outline-none transition-all text-white placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success' || status === 'existing'}
                        className="w-full md:w-auto btn-primary px-8 py-3 rounded-xl flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed bg-gold-500 text-navy-900 hover:bg-gold-400 transition-colors"
                    >
                        {status === 'loading' ? <Loader2 className="animate-spin" /> : <>Suscribirse <Send size={18} /></>}
                    </button>
                </form>

                {status === 'success' && (
                    <div className="mt-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in-up">
                        ¡Gracias por suscribirte! Te hemos enviado un correo de bienvenida.
                    </div>
                )}
                {status === 'existing' && (
                    <div className="mt-4 bg-gold-500/10 border border-gold-500 text-gold-500 px-4 py-2 rounded-lg text-sm font-medium animate-fade-in-up flex items-center justify-center gap-2">
                        <span>⚠️</span> Este correo ya forma parte de nuestra comunidad.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogSubscribe;
