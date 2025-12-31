import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Clock, DollarSign, User, CheckCircle, ChevronLeft, MessageCircle, Video, Upload, ArrowRight, Loader2 } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Wizard Steps
const STEPS = [
    { id: 1, title: 'Servicio & Duración', icon: Clock },
    { id: 2, title: 'Fecha & Hora', icon: Calendar },
    { id: 3, title: 'Tus Datos', icon: User },
    { id: 4, title: 'Pago & Confirmación', icon: DollarSign }
];

// Price Configuration
const PRICING = {
    15: 15,
    30: 30, // Base
    45: 45,
    60: 60,
    120: 120
};

const Booking = () => {
    const [currentStep, setCurrentStep] = useState(1);
    
    // Booking Data
    const [duration, setDuration] = useState<number | null>(30);
    const [meetingType, setMeetingType] = useState<'whatsapp' | 'meet'>('whatsapp');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [clientData, setClientData] = useState({ name: '', email: '', phone: '', reason: '' });
    
    // Payment Data
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'transfer'>('paypal');
    const [transferFile, setTransferFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter Logic for Time Slots
    const [timeFilter, setTimeFilter] = useState<'morning' | 'afternoon' | 'evening'>('morning');

    const handleNext = () => {
        if (currentStep === 1 && !duration) return;
        if (currentStep === 2 && (!selectedDate || !selectedTimeSlot)) return;
        if (currentStep === 3 && (!clientData.name || !clientData.email || !clientData.phone)) return;
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const totalPrice = duration ? PRICING[duration as keyof typeof PRICING] : 0;

    const generateTimeSlots = () => {
        // Simplified logic for demo purposes. In a real app this would check DB availability.
        const slots = [];
        const config = {
            morning: { start: 8, end: 12 },
            afternoon: { start: 12, end: 18 },
            evening: { start: 18, end: 21 }
        };

        const { start, end } = config[timeFilter];
        
        for (let i = start; i < end; i++) {
            slots.push(`${i}:00`);
            slots.push(`${i}:30`);
        }
        return slots;
    };

    // --- PAYPAL HANDLERS ---
    const handlePayPalApprove = async (_data: unknown, actions: any) => {
        setIsProcessing(true);
        try {
            const order = await actions.order.capture();
            await saveBooking('paypal', order.id, 'verified');
        } catch (err: unknown) {
            setError('Error procesando pago con PayPal: ' + (err as Error).message);
            setIsProcessing(false);
        }
    };

    // --- TRANSFER HANDLER ---
    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferFile) return alert('Por favor sube el comprobante.');
        
        setIsProcessing(true);
        try {
             const fileExt = transferFile.name.split('.').pop();
             const fileName = `transfer_${Date.now()}.${fileExt}`;
             const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, transferFile);
             
             if (uploadError) throw uploadError;

             const { data: publicUrlData } = supabase.storage.from('receipts').getPublicUrl(fileName);
             await saveBooking('transfer', undefined, 'pending_verification', publicUrlData.publicUrl);

        } catch (err: unknown) {
             setError('Error subiendo comprobante: ' + (err as Error).message);
             setIsProcessing(false);
        }
    };

    const saveBooking = async (method: 'paypal' | 'transfer', transactionId?: string, paymentStatus: string = 'pending', proofUrl?: string) => {
        try {
            // 1. Create Appointment
            const { data: appointment, error: appError } = await supabase.from('appointments').insert([{
                date: selectedDate?.toISOString().split('T')[0],
                time: selectedTimeSlot,
                duration_minutes: duration,
                meeting_type: meetingType,
                status: method === 'paypal' ? 'confirmed' : 'pending_payment',
                client_name: clientData.name,
                client_email: clientData.email,
                client_phone: clientData.phone,
                reason: clientData.reason,
                total_price: totalPrice
            }]).select().single();

            if (appError) throw appError;

            // 2. Create Payment Record
            const { error: payError } = await supabase.from('payments').insert([{
                appointment_id: appointment.id,
                amount: totalPrice,
                currency: 'USD',
                method,
                status: paymentStatus,
                transaction_id: transactionId,
                proof_url: proofUrl
            }]);

            if (payError) throw payError;

            // 3. Send Email Confirmation via Edge Function
             await supabase.functions.invoke('send-booking-confirmation', {
                body: { appointment, payment: { method, amount: totalPrice, currency: 'USD' } }
            });

            setBookingComplete(true);
        } catch (err: unknown) {
            setError((err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for(let i=1; i<=7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    // ---- RENDER STEPS ----

    const renderStep1 = () => (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
            <div>
                <h3 className="text-xl font-bold text-navy-900 mb-4">¿Cuánto tiempo necesitas?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(PRICING).map(([mins, price]) => (
                        <button
                            key={mins}
                            onClick={() => setDuration(Number(mins))}
                            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${duration === Number(mins) ? 'border-gold-500 bg-gold-50 text-navy-900 shadow-md' : 'border-gray-200 hover:border-gold-300 text-gray-500'}`}
                        >
                            <span className="text-2xl font-bold">{mins} min</span>
                            <span className="text-sm font-semibold text-gold-600">${price} USD</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-navy-900 mb-4">¿Cómo prefieres la consulta?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => setMeetingType('whatsapp')}
                        className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${meetingType === 'whatsapp' ? 'border-green-500 bg-green-50 text-navy-900 shadow-md' : 'border-gray-200 hover:border-green-300'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-full text-green-600 group-hover:scale-110 transition-transform">
                                <MessageCircle size={32} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg">Vía WhatsApp</div>
                                <div className="text-sm text-gray-500">Llamada de voz o chat</div>
                            </div>
                        </div>
                        {meetingType === 'whatsapp' && <CheckCircle className="text-green-500" />}
                    </button>

                    <button
                        onClick={() => setMeetingType('meet')}
                        className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${meetingType === 'meet' ? 'border-blue-500 bg-blue-50 text-navy-900 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                         <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:scale-110 transition-transform">
                                <Video size={32} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg">Google Meet</div>
                                <div className="text-sm text-gray-500">Videollamada profesional</div>
                            </div>
                        </div>
                        {meetingType === 'meet' && <CheckCircle className="text-blue-500" />}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-xl font-bold text-navy-900">Selecciona una fecha</h3>
            
            {/* Horizontal Date Scroller */}
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {generateDates().map((date) => (
                    <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={`flex-none w-24 h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedDate?.toDateString() === date.toDateString() ? 'bg-navy-900 border-navy-900 text-gold-500 shadow-lg scale-105' : 'bg-white border-gray-200 text-gray-400 hover:border-gold-300'}`}
                    >
                        <span className="text-xs font-bold uppercase">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                        <span className="text-3xl font-bold">{date.getDate()}</span>
                        <span className="text-xs">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                    </button>
                ))}
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-navy-900">Horarios Disponibles</h3>
                    <div className="flex bg-gray-100 rounded-lg p-1 text-xs font-bold">
                        <button onClick={() => setTimeFilter('morning')} className={`px-3 py-1.5 rounded-md transition-all ${timeFilter === 'morning' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}>Mañana</button>
                        <button onClick={() => setTimeFilter('afternoon')} className={`px-3 py-1.5 rounded-md transition-all ${timeFilter === 'afternoon' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}>Tarde</button>
                        <button onClick={() => setTimeFilter('evening')} className={`px-3 py-1.5 rounded-md transition-all ${timeFilter === 'evening' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}>Noche</button>
                    </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {generateTimeSlots().map(time => (
                        <button
                            key={time}
                            onClick={() => setSelectedTimeSlot(time)}
                            className={`py-3 rounded-xl font-bold text-sm transition-all ${selectedTimeSlot === time ? 'bg-gold-500 text-navy-900 shadow-lg scale-105' : 'bg-gray-50 text-gray-600 hover:bg-gold-50'}`}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
         <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-xl font-bold text-navy-900">Tus Datos de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo</label>
                     <input type="text" value={clientData.name} onChange={e => setClientData({...clientData, name: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gold-500 rounded-xl px-4 py-3 outline-none transition-all" placeholder="Tu Nombre" />
                </div>
                <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
                     <input type="email" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gold-500 rounded-xl px-4 py-3 outline-none transition-all" placeholder="tu@email.com" />
                </div>
                <div>
                     <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono / WhatsApp</label>
                     <input type="tel" value={clientData.phone} onChange={e => setClientData({...clientData, phone: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gold-500 rounded-xl px-4 py-3 outline-none transition-all" placeholder="+1 (809) 000-0000" />
                </div>
                <div className="col-span-full">
                     <label className="block text-sm font-bold text-gray-700 mb-2">Motivo de la consulta</label>
                     <textarea value={clientData.reason} onChange={e => setClientData({...clientData, reason: e.target.value})} className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gold-500 rounded-xl px-4 py-3 outline-none transition-all" rows={3} placeholder="Describa brevemente su caso..." />
                </div>
            </div>
         </div>
    );

    const renderStep4 = () => (
         <div className="space-y-8 animate-in slide-in-from-right duration-300">
            
            <div className="bg-navy-900 text-white rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-gold-500 mb-1">Resumen de la Orden</h3>
                    <p className="opacity-80">Consulta {meetingType === 'whatsapp' ? 'WhatsApp' : 'Meet'} • {duration} Min</p>
                    <p className="opacity-80">{selectedDate?.toLocaleDateString()} • {selectedTimeSlot}</p>
                </div>
                <div className="text-4xl font-bold text-white">
                    ${totalPrice}<span className="text-lg text-gold-500 font-medium">USD</span>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-navy-900 mb-4">Método de Pago</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setPaymentMethod('paypal')} className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>
                        <span>PayPal / Tarjeta</span>
                    </button>
                    <button onClick={() => setPaymentMethod('transfer')} className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${paymentMethod === 'transfer' ? 'border-gold-500 bg-gold-50 text-navy-900' : 'border-gray-200'}`}>
                        <span>Transferencia / Depósito</span>
                    </button>
                </div>

                <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
                    {paymentMethod === 'paypal' ? (
                        <div className="w-full max-w-md mx-auto">
                            <PayPalScriptProvider options={{ "clientId": "AcjJL2McL4ut29ozmP7MPZWAUaiI2oQBL-b27ftDKNgKz31PcjbLvNLPnSJ1-xqSAhEX0ByCEYiuIDLA" }}>
                                <PayPalButtons
                                    style={{ layout: "vertical" }}
                                    createOrder={(_data, actions) => {
                                        return actions.order.create({
                                            purchase_units: [{
                                                amount: { 
                                                    currency_code: "USD",
                                                    value: totalPrice.toString() 
                                                }
                                            }]
                                        });
                                    }}
                                    onApprove={handlePayPalApprove}
                                />
                            </PayPalScriptProvider>
                        </div>
                    ) : (
                        <form onSubmit={handleTransferSubmit} className="space-y-4">
                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm">
                                <p className="font-bold mb-2">Instrucciones de Transferencia:</p>
                                <p>Banco Popular Dominicano</p>
                                <p>Cuenta Corriente: <strong>789456123</strong></p>
                                <p>Titular: <strong>Centro Jurídico Integral</strong></p>
                                <p className="mt-2 text-xs opacity-80">*TuAbogadoEnRD es una extensión del Centro Jurídico Integral.</p>
                            </div>
                            
                            <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gold-500 transition-colors bg-gray-50">
                                {transferFile ? (
                                    <div className="text-green-600 font-bold flex flex-col items-center">
                                        <CheckCircle size={32} className="mb-2"/>
                                        Archivo seleccionado: {transferFile.name}
                                    </div>
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center">
                                        <Upload size={32} className="mb-2"/>
                                        <span className="font-bold">Subir Comprobante de Pago</span>
                                        <span className="text-xs mt-1">Foto o PDF del voucher</span>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setTransferFile(e.target.files?.[0] || null)} />
                            </label>

                            <button type="submit" disabled={isProcessing} className="w-full bg-navy-900 text-white py-4 rounded-xl font-bold hover:bg-navy-800 transition-all flex items-center justify-center gap-2">
                                {isProcessing ? <Loader2 className="animate-spin"/> : 'Confirmar Reserva'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
         </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-12 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                 <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-bold text-navy-900 mb-2">¡Solicitud Recibida!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {paymentMethod === 'paypal' 
                    ? 'Tu cita ha sido confirmada. Hemos enviado los detalles a tu correo electrónico.' 
                    : 'Hemos recibido tu comprobante. Tu cita será confirmada en breve vía correo electrónico tras validar el pago.'}
            </p>
            <button onClick={() => window.location.reload()} className="bg-gold-500 text-navy-900 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                Volver al Inicio
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-navy-900 py-12 px-4 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 dark:text-gold-500 mb-4">Agenda tu Asesoría</h1>
                    <p className="text-gray-500 dark:text-gray-300 text-lg">Reserva una consulta profesional en pasos sencillos.</p>
                </div>

                {!bookingComplete ? (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        {/* Steps Indicator */}
                        <div className="bg-navy-900 p-4 overflow-x-auto">
                             <div className="flex items-center justify-between min-w-[320px] max-w-2xl mx-auto relative px-4">
                                {/* Line */}
                                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-navy-700 -z-0 mx-10"></div>
                                
                                {STEPS.map((step) => {
                                    const isActive = currentStep === step.id;
                                    const isCompleted = currentStep > step.id;
                                    
                                    return (
                                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${isActive ? 'bg-gold-500 text-navy-900 scale-110 shadow-lg ring-4 ring-navy-900' : (isCompleted ? 'bg-green-500 text-white' : 'bg-navy-700 text-gray-400')}`}>
                                                {isCompleted ? <CheckCircle size={20}/> : step.id}
                                            </div>
                                            <span className={`text-xs font-bold hidden md:block ${isActive ? 'text-gold-500' : (isCompleted ? 'text-green-500' : 'text-gray-500')}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-12 min-h-[500px]">
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                            {currentStep === 4 && renderStep4()}
                        </div>

                        {/* Footer Controls */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                <ChevronLeft size={20} /> Atrás
                            </button>

                            {currentStep < 4 ? (
                                <button
                                    onClick={handleNext}
                                    className="bg-navy-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-navy-800 transition-all shadow-lg hover:px-10"
                                >
                                    Siguiente <ArrowRight size={20} />
                                </button>
                            ) : null}
                        </div>
                    </div>
                ) : renderSuccess()}
            </div>
        </div>
    );
};

export default Booking;
