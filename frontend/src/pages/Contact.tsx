import { useState } from 'react';
import { Mail, Phone, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Contact = () => {


    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        // Basic Validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            setStatus('error');
            setErrorMessage('Por favor completa todos los campos.');
            return;
        }

        try {
            // Call Supabase Edge Function
            const { error } = await supabase.functions.invoke('send-contact', {
                body: formData,
            });

            if (error) throw error;

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
        } catch (err) {
            console.error('Error sending message:', err);
            setStatus('error');
            setErrorMessage('Hubo un error al enviar el mensaje. Intenta nuevamente.');
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-navy-900 min-h-screen py-20 px-4 transition-colors duration-300">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* Contact Info */}
                <div className="space-y-8 animate-in slide-in-from-left duration-700">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-navy-900 dark:text-white mb-4"> Contáctanos</h1>
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                            Estamos aquí para ayudarte. Escríbenos y te responderemos a la brevedad.
                        </p>
                    </div>

                    <div className="space-y-6">


                        <div className="flex items-start gap-4">
                            <div className="bg-gold-50 dark:bg-navy-800 p-3 rounded-lg">
                                <Phone className="text-gold-500 w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-navy-900 dark:text-white">Teléfono / WhatsApp</h3>
                                <p className="text-gray-600 dark:text-gray-400">+1 (809) 555-0123</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-gold-50 dark:bg-navy-800 p-3 rounded-lg">
                                <Mail className="text-gold-500 w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-navy-900 dark:text-white">Correo</h3>
                                <p className="text-gray-600 dark:text-gray-400">contacto@tuabogadoenrd.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white dark:bg-navy-800 p-8 rounded-2xl shadow-xl animate-in slide-in-from-right duration-700">
                    {/* {status === 'success' ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-navy-900 dark:text-white mb-2">¡Mensaje Enviado!</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                                Gracias por contactarnos. Nuestro equipo revisará tu mensaje y te responderá pronto.
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="text-gold-500 font-bold hover:underline"
                            >
                                Enviar otro mensaje
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-navy-900 dark:text-gray-300 mb-2">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition-all dark:bg-navy-900 dark:text-white"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-navy-900 dark:text-gray-300 mb-2">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition-all dark:bg-navy-900 dark:text-white"
                                    placeholder="juan@ejemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-navy-900 dark:text-gray-300 mb-2">Mensaje</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-gold-500 outline-none transition-all dark:bg-navy-900 dark:text-white resize-none"
                                    placeholder="Describe tu consulta legal..."
                                />
                            </div>

                            {status === 'error' && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm">
                                    <AlertCircle size={18} />
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-900 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' ? <Loader2 className="animate-spin" /> : <>Enviar Mensaje <Send size={18} /></>}
                            </button>
                        </form>
                    )} */}
                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                        <p>Por el momento, favor contactarnos vía telefónica o correo electrónico.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
