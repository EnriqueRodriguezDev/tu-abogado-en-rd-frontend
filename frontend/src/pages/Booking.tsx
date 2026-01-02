import { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar as CalendarIcon, Clock, DollarSign, User, CheckCircle, ChevronLeft, ChevronRight, Upload, ArrowRight, Loader2, CreditCard, AlertCircle, Briefcase } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { BookingStep, TimeSlot, ClientData, PaymentMethod, Service, ServiceVariant } from '../types';

// Constants & Configuration
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';

const STEPS: BookingStep[] = [
    { id: 1, title: 'Servicio', icon: Briefcase },
    { id: 2, title: 'Agenda', icon: CalendarIcon },
    { id: 3, title: 'Datos', icon: User },
    { id: 4, title: 'Pago', icon: DollarSign }
];

const PAYMENT_METHODS = [
    { id: 'paypal', name: 'PayPal / Tarjeta', img: '/images/payments/paypal.png' },
    { id: 'azul', name: 'Azul', img: '/images/payments/azul.png' },
    { id: 'transfer', name: 'Transferencia Bancaria', img: '/images/payments/transfer.png' },
];

const Booking = () => {
    // --- REFS ---
    const bookingCardRef = useRef<HTMLDivElement>(null);

    // --- STATE ---
    const [currentStep, setCurrentStep] = useState(1);
    const [stepError, setStepError] = useState<string | null>(null);

    // Data State
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);

    // Step 1: Service Selection
    // selectedService removed (unused)


    // Step 2: Variant & Calendar
    const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);
    const [meetingType, setMeetingType] = useState<'whatsapp' | 'meet'>('whatsapp');

    // Step 2: Calendar Logic
    // State for dates and slots
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [currentDateBase, setCurrentDateBase] = useState(new Date());
    const [timeFilter, setTimeFilter] = useState<'morning' | 'afternoon' | 'evening'>('morning');
    // busySlots removed in favor of busyRanges defined later


    // --- INITIAL FETCH ---
    useEffect(() => {
        const fetchServices = async () => {
            const { data } = await supabase
                .from('services')
                .select('*, variants:service_variants(*)')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            if (data) {
                setServices(data as Service[]);
            }
            setLoadingServices(false);
        };
        fetchServices();
    }, []);

    // --- AUTO SKIP LOGIC (Modified for Inline) ---


    const handleVariantSelect = (variant: ServiceVariant) => {
        setSelectedVariant(variant);
        setStepError(null);
    };

    // Scroll to top on step change
    useEffect(() => {
        if (bookingCardRef.current) {
            bookingCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [currentStep]);

    // Fetch availability when date is selected
    useEffect(() => {
        if (selectedDate && selectedVariant && selectedVariant.duration_minutes > 0) {
            fetchAvailability(selectedDate);
        } else {
            setBusyRanges([]);
        }
    }, [selectedDate, selectedVariant]);

    // Fetch availability logic moved to helper section


    // Step 3: Client Data
    const [clientData, setClientData] = useState<ClientData & { rnc?: string }>({ name: '', email: '', phone: '', reason: '', rnc: '' });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Step 4: Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'azul' | 'cardnet'>('paypal');
    const [transferFile, setTransferFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const totalPrice = selectedVariant ? selectedVariant.price_usd : 0;

    // --- PHONE MASKING (RD) ---
    const formatPhoneNumber = (value: string) => {
        // Strip non-numeric characters
        const numbers = value.replace(/\D/g, '');

        // Enforce valid RD prefixes (809, 829, 849) if at least 3 chars exist
        if (numbers.length >= 3) {
            const prefix = numbers.substring(0, 3);
            if (!['809', '829', '849'].includes(prefix)) {
                // Determine slightly better UX if typing wrong prefix? 
                // For now, let's just allow typing but validation will catch it.
                // Or aggressively replace? Let's just create the mask first.
            }
        }

        let formatted = '';
        if (numbers.length > 0) formatted += `(${numbers.substring(0, 3)}`;
        if (numbers.length > 3) formatted += `) ${numbers.substring(3, 6)}`;
        if (numbers.length > 6) formatted += `-${numbers.substring(6, 10)}`;

        return formatted;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const formatted = formatPhoneNumber(val);
        // limit to max length (10 digits + mask chars = 14)
        if (formatted.length <= 14) {
            setClientData({ ...clientData, phone: formatted });
            if (errors.phone) setErrors({ ...errors, phone: '' });
        }
    };

    // --- VALIDATION & NAVIGATION ---
    // --- VALIDATION & NAVIGATION ---
    const validateStep3 = () => {
        const newErrors: { [key: string]: string } = {};

        // Name: Letters/Accents only, 3-30 chars, no double spaces
        const nameRegex = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ]+(?:\s[a-zA-ZáéíóúñÁÉÍÓÚÑ]+)*$/;
        if (!clientData.name.trim()) newErrors.name = 'El nombre es requerido';
        else if (clientData.name.length < 3 || clientData.name.length > 30) newErrors.name = 'El nombre debe tener entre 3 y 30 caracteres';
        else if (!nameRegex.test(clientData.name)) newErrors.name = 'Solo letras y espacios simples permitidos';

        // Email: Strict Regex
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!clientData.email.trim()) newErrors.email = 'El email es requerido';
        else if (clientData.email.length > 50) newErrors.email = 'El email es muy largo';
        else if (!emailRegex.test(clientData.email)) newErrors.email = 'Email inválido';

        // Strict Phone Validation
        const phoneDigits = clientData.phone.replace(/\D/g, '');
        if (!clientData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
        else if (phoneDigits.length !== 10) newErrors.phone = 'El teléfono debe tener 10 dígitos';
        else {
            const prefix = phoneDigits.substring(0, 3);
            if (!['809', '829', '849'].includes(prefix)) {
                newErrors.phone = 'Debe ser un número válido de RD (809, 829, 849)';
            }
        }

        // Reason: Alphanumeric, max 500
        // Allows letters, numbers, punctuation, spaces
        if (!clientData.reason.trim()) newErrors.reason = 'El motivo es requerido';
        else if (clientData.reason.length > 500) newErrors.reason = 'Máximo 500 caracteres';
        else if (/\s{2,}/.test(clientData.reason)) newErrors.reason = 'No se permiten espacios dobles';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        setStepError(null);
        if (currentStep === 1) {
            if (!selectedVariant) {
                setStepError('Por favor selecciona un servicio y una modalidad.');
                return;
            }
        }
        if (currentStep === 2) {
            if (!selectedDate || !selectedTimeSlot) {
                setStepError('Por favor selecciona una fecha y hora para tu cita.');
                return;
            }
        }
        if (currentStep === 3) {
            if (!validateStep3()) return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => setCurrentStep(prev => prev - 1);

    // --- CALENDAR LOGIC ---
    // Helper to separate logic
    const parseTime = (timeStr: string): number => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    const formatTime = (minutes: number): string => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    };

    const generateDates = useMemo(() => {
        const dates: Date[] = [];
        const start = new Date(currentDateBase);
        const days = viewMode === 'week' ? 7 : 30;
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [currentDateBase, viewMode]);

    const handleDateNav = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDateBase);
        if (viewMode === 'week') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        else newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));

        if (newDate < new Date()) setCurrentDateBase(new Date());
        else setCurrentDateBase(newDate);
    };

    // Modified to store ranges
    const [busyRanges, setBusyRanges] = useState<{ start: number, end: number }[]>([]);

    const fetchAvailability = async (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('appointments')
            .select('time, duration_minutes')
            .eq('date', dateStr)
            .neq('status', 'cancelled');

        if (data) {
            const ranges = data.map((appt: any) => {
                const start = parseTime(appt.time);
                // Fallback to 30 min if duration missing (legacy protection)
                const duration = appt.duration_minutes || 30;
                return { start, end: start + duration };
            });
            setBusyRanges(ranges);
        }
        if (error) console.error("Error fetching availability:", error);
    };

    const generateTimeSlots = (): TimeSlot[] => {
        if (!selectedVariant) return [];

        const slots: TimeSlot[] = [];
        const duration = selectedVariant.duration_minutes || 30;

        // Configuration for time filters
        const config = {
            morning: { start: 9 * 60, end: 12 * 60 },     // 09:00 - 12:00
            afternoon: { start: 13 * 60, end: 17 * 60 },  // 13:00 - 17:00
            evening: { start: 17 * 60, end: 20 * 60 }     // 17:00 - 20:00
        };

        const { start, end } = config[timeFilter];
        let current = start;

        while (current + duration <= end) {
            const slotStart = current;
            const slotEnd = current + duration;

            // Check collision
            const isBusy = busyRanges.some(range => {
                // Overlap logic: (StartA < EndB) and (EndA > StartB)
                return (slotStart < range.end) && (slotEnd > range.start);
            });

            slots.push({
                time: formatTime(slotStart),
                available: !isBusy
            });

            current += duration;
        }

        return slots;
    };

    // --- SAVE LOGIC ---
    const saveBooking = async (method: string, transactionId?: string, proofUrl?: string) => {
        try {
            const appointmentPayload = {
                date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
                time: selectedTimeSlot || 'N/A',
                duration_minutes: selectedVariant?.duration_minutes || 0,
                meeting_type: meetingType,
                client_name: clientData.name,
                client_email: clientData.email,
                client_phone: clientData.phone,
                reason: clientData.reason,
                total_price: totalPrice
            };

            const { data, error } = await supabase.functions.invoke('process-payment', {
                body: {
                    orderID: transactionId,
                    paymentMethod: method,
                    appointmentData: appointmentPayload,
                    paymentData: { proof_url: proofUrl },
                    client_rnc: clientData.rnc || null  // <-- Sending RNC
                }
            });

            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.error);

            setBookingComplete(true);
        } catch (err: unknown) {
            setApiError('Error al procesar la reserva. Por favor intenta de nuevo. ' + (err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- PAYPAL HANDLERS ---
    const handlePayPalApprove = async (_data: unknown, actions: any) => {
        setIsProcessing(true);
        try {
            const order = await actions.order.capture();
            await saveBooking('paypal', order.id);
        } catch (err: unknown) {
            setApiError('Error PayPal: ' + (err as Error).message);
            setIsProcessing(false);
        }
    };

    const handleReceiptUpload = async (file: File) => {
        // 1. Obtener extensión
        const fileExt = file.name.split('.').pop();

        // 2. Crear nombre único (transfer_TIMESTAMP.ext)
        const fileName = `transfer_${Date.now()}.${fileExt}`;

        // 3. Subir al bucket 'receipts'
        const { error: uploadError } = await supabase.storage
            .from('receipts') // <--- Cambio importante: bucket 'receipts'
            .upload(fileName, file, {
                contentType: file.type, // Buena práctica: asegura que el navegador sepa qué tipo de archivo es
                upsert: false
            });

        if (uploadError) {
            // Puedes usar un alert o manejar el error según tu UI
            console.error('Error subiendo comprobante:', uploadError.message);
            throw uploadError;
        }

        // 4. Obtener URL Pública (Esto agrega automáticamente el /public/ que faltaba antes)
        const { data } = supabase.storage
            .from('receipts') // <--- Cambio importante: bucket 'receipts'
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    // --- TRANSFER HANDLER ---
    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferFile) return alert('Por favor sube el comprobante.');

        setIsProcessing(true);
        setApiError(null);

        try {
            // Usamos la nueva función extraída
            const publicUrl = await handleReceiptUpload(transferFile);

            // Guardamos en la base de datos usando esa URL
            await saveBooking('transfer', undefined, publicUrl);

        } catch (err: unknown) {
            setApiError('Error al procesar: ' + (err as Error).message);
            setIsProcessing(false);
        }
    };

    // --- SAVE LOGIC ---


    // --- RENDERERS ---
    const renderStep1 = () => (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
            {stepError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2"><AlertCircle size={20} /> <span className="font-bold">{stepError}</span></div>}

            <div>
                {loadingServices ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold-500" size={40} /></div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {services.map((service) => {
                            const serviceVariants = (service.variants || [])
                                .filter(v => v.is_active)
                                .sort((a: any, b: any) => a.order_index - b.order_index);

                            return (
                                <div
                                    key={service.id}
                                    className="w-full bg-white rounded-[2rem] border border-gray-100 hover:border-gold-300 transition-all overflow-hidden flex flex-col group"
                                >
                                    {/* 1. ARRIBA: Información del Servicio (Más grande y espaciosa) */}
                                    <div className="p-8 bg-white relative z-10">
                                        <div className="flex flex-col md:flex-row md:items-start gap-6">
                                            <div className="p-4 bg-navy-50 rounded-2xl text-navy-900 group-hover:bg-gold-500 group-hover:text-white transition-all duration-300 shadow-sm flex-shrink-0">
                                                {/* Icono más grande */}
                                                <Briefcase size={32} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-2xl text-navy-900 mb-3">{service.name}</h4>
                                                <p className="text-gray-500 text-base leading-relaxed max-w-4xl">
                                                    {service.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. ABAJO: Grid de Variantes (Fondo suave para separar) */}
                                    <div className="p-8 bg-gray-50/80 border-t border-gray-100 flex-1">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="h-px bg-gray-200 flex-1"></div>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                Selecciona tu plan
                                            </span>
                                            <div className="h-px bg-gray-200 flex-1"></div>
                                        </div>

                                        {/* Grid de 3 columnas para las variantes */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {serviceVariants.length === 0 && (
                                                <div className="text-gray-400 italic col-span-full text-center py-4">No hay opciones disponibles</div>
                                            )}
                                            {serviceVariants.map((variant) => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => handleVariantSelect(variant)}
                                                    className={`
                                                        relative p-6 rounded-2xl border-2 text-left transition-all flex flex-col gap-4 group/btn
                                                        ${selectedVariant?.id === variant.id
                                                            ? 'bg-navy-900 border-navy-900 text-white shadow-xl scale-[1.02] ring-4 ring-gold-100'
                                                            : 'bg-white border-transparent hover:border-gold-400 text-gray-600 shadow-sm hover:shadow-lg'}
                                                    `}
                                                >
                                                    {selectedVariant?.id === variant.id && (
                                                        <div className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-md z-10">
                                                            <CheckCircle size={24} className="text-gold-500 fill-navy-900" />
                                                        </div>
                                                    )}

                                                    {/* Nombre de la Variante */}
                                                    <div className="font-bold text-lg leading-tight group-hover/btn:text-gold-500 transition-colors">
                                                        {variant.name_es}
                                                    </div>

                                                    {/* Precio y Duración */}
                                                    <div className="mt-auto flex justify-between items-end border-t border-dashed border-current/20 pt-4 w-full">
                                                        <div className="flex items-center gap-1.5 opacity-80 font-medium">
                                                            <Clock size={16} />
                                                            <span className="text-xl">
                                                                {variant.duration_minutes > 0 ? `${variant.duration_minutes} min` : 'Fijo'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-baseline">
                                                            <span className="text-2xl font-bold tracking-tight">
                                                                ${variant.price_usd}
                                                            </span>
                                                            <span className="text-xs ml-1 font-semibold opacity-70">USD</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECCIÓN: MÉTODO DE CONSULTA (Sin cambios en lógica, solo asegurando cierre correcto) */}
            <div>
                <h3 className="text-xl font-bold text-navy-900 mb-6 font-serif">Método de Consulta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={() => setMeetingType('whatsapp')} className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between h-32 group ${meetingType === 'whatsapp' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-300 bg-white hover:shadow-md'}`}>
                        <div className="flex items-center gap-5">
                            <div className="bg-green-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-xl text-navy-900">Videochat WhatsApp</div>
                                <div className="text-sm text-gray-500">Llamada segura y directa</div>
                            </div>
                        </div>
                        {meetingType === 'whatsapp' && <CheckCircle className="text-green-500" size={28} />}
                    </button>

                    <button onClick={() => setMeetingType('meet')} className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center justify-between h-32 group ${meetingType === 'meet' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-md'}`}>
                        <div className="flex items-center gap-5">
                            <div className="bg-white p-3 rounded-full border border-gray-100 group-hover:scale-110 transition-transform shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0z" opacity="0" /><path fill="#00832D" d="M17.5 14.5L21 18V6l-3.5 3.5v5z" /><path fill="#0055AA" d="M5 8.5v7c0 .825.675 1.5 1.5 1.5h7c.825 0 1.5-.675 1.5-1.5v-7c0-.825-.675-1.5-1.5-1.5h-7C5.675 7 5 7.675 5 8.5z" /><path fill="#EA4335" d="M5 8.5l9 6.5v-7L5 14.5v-6z" /><path fill="#FBC02D" d="M5 8.5L14 15V8.5L5 15v-6.5z" opacity="0" /></svg>
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-xl text-navy-900">Google Meet</div>
                                <div className="text-sm text-gray-500">Enlace único generado</div>
                            </div>
                        </div>
                        {meetingType === 'meet' && <CheckCircle className="text-blue-500" size={28} />}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
            {stepError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2"><AlertCircle size={20} /> <span className="font-bold">{stepError}</span></div>}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-navy-900">Fecha y Hora</h3>
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button onClick={() => setViewMode('week')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}>Semanal</button>
                    <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500'}`}>Mensual</button>
                </div>
            </div>
            <div className="relative">
                <button onClick={() => handleDateNav('prev')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 z-10 bg-white p-2 rounded-full shadow-lg border border-gray-100"><ChevronLeft size={24} /></button>
                <div className="flex gap-4 overflow-x-auto pb-4 px-8 custom-scrollbar scroll-smooth">
                    {generateDates.map((date) => (
                        <button key={date.toISOString()} onClick={() => { setSelectedDate(date); setStepError(null); }} className={`flex-none w-24 h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedDate?.toDateString() === date.toDateString() ? 'bg-navy-900 border-navy-900 text-gold-500 shadow-xl' : 'bg-white border-gray-200 text-gray-400'}`}>
                            <span className="text-xs font-bold uppercase tracking-wider">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                            <span className="text-4xl font-bold">{date.getDate()}</span>
                            <span className="text-xs font-medium">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => handleDateNav('next')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 z-10 bg-white p-2 rounded-full shadow-lg border border-gray-100"><ChevronRight size={24} /></button>
            </div>
            <div className="bg-gray-50 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <span className="font-bold text-gray-500 uppercase text-sm tracking-wider">Horarios</span>
                    <div className="flex bg-white rounded-lg p-1 text-xs font-bold shadow-sm">
                        {(['morning', 'afternoon', 'evening'] as const).map(f => (
                            <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1.5 rounded-md transition-all ${timeFilter === f ? 'bg-gray-100 text-navy-900' : 'text-gray-400'}`}>
                                {f === 'morning' ? 'Mañana' : f === 'afternoon' ? 'Tarde' : 'Noche'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {generateTimeSlots().map(({ time, available }) => (
                        <button
                            key={time}
                            disabled={!available}
                            onClick={() => { setSelectedTimeSlot(time); setStepError(null); }}
                            className={`py-4 rounded-xl font-bold text-sm transition-all border-2 
                                ${!available ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed line-through' :
                                    selectedTimeSlot === time ? 'bg-gold-500 border-gold-500 text-navy-900 shadow-lg scale-105' :
                                        'bg-white border-transparent hover:border-gold-300 text-navy-700 hover:shadow-md'}`}
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
            <h3 className="text-xl font-bold text-navy-900">Tus Datos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre Completo <span className="text-red-500">*</span></label>
                    <input type="text" value={clientData.name} onChange={e => { setClientData({ ...clientData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }} className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none transition-all ${errors.name ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`} placeholder="Tu Nombre" />
                    {errors.name && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.name}</p>}
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico <span className="text-red-500">*</span></label>
                    <input type="email" value={clientData.email} onChange={e => { setClientData({ ...clientData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }} className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`} placeholder="usuario@email.com" />
                    {errors.email && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.email}</p>}
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono (RD) <span className="text-red-500">*</span></label>
                    <input type="tel" value={clientData.phone} onChange={handlePhoneChange} className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`} placeholder="(8XX) XXX-XXXX" />
                    {errors.phone && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.phone}</p>}
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">RNC / Cédula <span className="text-gray-400 font-normal">(Opcional)</span></label>
                    <input type="text" value={clientData.rnc} onChange={e => setClientData({ ...clientData, rnc: e.target.value })} className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 outline-none focus:border-gold-500 focus:bg-white transition-all" placeholder="Para factura con valor fiscal" />
                </div>
                <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Motivo de la consulta <span className="text-red-500">*</span></label>
                    <textarea value={clientData.reason} onChange={e => { setClientData({ ...clientData, reason: e.target.value }); if (errors.reason) setErrors({ ...errors, reason: '' }); }} className={`w-full bg-gray-50 border rounded-xl px-4 py-3 outline-none transition-all ${errors.reason ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`} rows={3} placeholder="Describa brevemente su caso..." />
                    {errors.reason && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} /> {errors.reason}</p>}
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
            {/* Order Summary */}
            <div className="bg-navy-900 text-white rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="text-center md:text-left relative z-10">
                    <h3 className="text-xl font-bold text-gold-500 mb-2">Resumen</h3>
                    <p className="flex items-center gap-2 justify-center md:justify-start">
                        <Clock size={16} /> {selectedVariant?.duration_minutes} Minutos • {meetingType === 'whatsapp' ? 'WhatsApp' : 'Google Meet'}
                    </p>
                    <p className="flex items-center gap-2 justify-center md:justify-start">
                        <CalendarIcon size={16} /> {selectedDate?.toLocaleDateString()} • {selectedTimeSlot}
                    </p>
                </div>
                <div className="text-center relative z-10">
                    <div className="text-5xl font-bold text-white mb-1">${totalPrice}<span className="text-xl text-gold-500 font-medium ml-1">USD</span></div>
                </div>
            </div>

            {apiError && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3"><AlertCircle size={20} /> {apiError}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Method Selection */}
                <div className="lg:col-span-1">
                    <h3 className="text-xl font-bold text-navy-900 mb-4">Método de Pago</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {PAYMENT_METHODS.filter(m => m.id !== 'cardnet').map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id as any)}
                                className={`relative flex items-center justify-center p-4 rounded-2xl border-2 transition-all h-24 group ${paymentMethod === method.id ? 'border-gold-500 bg-gold-50/30 ring-1 ring-gold-200' : 'border-gray-100 hover:border-gold-300 hover:bg-gray-50'}`}
                            >
                                {paymentMethod === method.id && (
                                    <div className="absolute top-2 right-2 text-gold-500 animate-in zoom-in duration-300">
                                        <CheckCircle size={22} className="fill-current" />
                                    </div>
                                )}
                                <div className="w-full h-full flex items-center justify-center">
                                    <img
                                        src={method.img}
                                        alt={method.id}
                                        className="h-14 w-auto object-contain transition-transform group-hover:scale-110 duration-300"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x40?text=IMG'; }}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Form */}
                <div className="lg:col-span-2">
                    <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm h-full flex flex-col justify-center min-h-[400px]">
                        {paymentMethod === 'paypal' && (
                            <div className="max-w-md mx-auto w-full text-center relative z-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h4 className="font-bold text-gray-700 mb-6 text-lg">Pagar de forma segura</h4>
                                <div className="relative z-0">
                                    <PayPalScriptProvider options={{
                                        "clientId": PAYPAL_CLIENT_ID,
                                        currency: "USD",
                                        intent: "capture"
                                    }}>
                                        <PayPalButtons
                                            style={{ layout: "vertical", shape: "rect", borderRadius: 12, height: 48 }}
                                            createOrder={(_data, actions) => {
                                                return actions.order.create({
                                                    intent: "CAPTURE",
                                                    application_context: {
                                                        shipping_preference: "NO_SHIPPING",
                                                        brand_name: "TuAbogadoEnRD",
                                                        user_action: "PAY_NOW"
                                                    },
                                                    payer: {
                                                        email_address: clientData.email, // Best effort prefill
                                                        name: {
                                                            given_name: clientData.name.split(" ")[0] || "Cliente",
                                                            surname: clientData.name.split(" ").slice(1).join(" ") || "."
                                                        }
                                                    },
                                                    purchase_units: [{
                                                        amount: {
                                                            currency_code: "USD",
                                                            value: totalPrice.toFixed(2)
                                                        },
                                                        description: `Consulta Legal - ${selectedVariant?.duration_minutes} Min`
                                                    }]
                                                });
                                            }}
                                            onApprove={handlePayPalApprove}
                                            onError={() => setApiError('Error de conexión con PayPal. Intenta de nuevo.')}
                                        />
                                    </PayPalScriptProvider>
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                                    Pagos encriptados y seguros
                                </p>
                            </div>
                        )}

                        {paymentMethod === 'transfer' && (
                            <form onSubmit={handleTransferSubmit} className="max-w-lg mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-navy-50 p-6 rounded-2xl border border-navy-100">
                                    <h4 className="font-bold mb-4 flex items-center gap-2 text-navy-900"><div className="w-2 h-2 bg-gold-500 rounded-full"></div>Datos Bancarios</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-navy-100 pb-2"><span>Banco:</span> <span className="font-bold">Banco Popular Dominicano</span></div>
                                        <div className="flex justify-between border-b border-navy-100 pb-2"><span>Cuenta:</span> <span className="font-bold font-mono text-base">789456123</span></div>
                                        <div className="flex justify-between"><span>Titular:</span> <span className="font-bold">TuAbogadoEnRD</span></div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs text-gray-500 text-center font-medium uppercase tracking-wide">Comprobante de Pago</div>
                                    <label className={`block w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${transferFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gold-500 hover:bg-gold-50/10'}`}>
                                        {transferFile ? (
                                            <div className="text-green-700 font-bold flex flex-col items-center animate-in zoom-in">
                                                <CheckCircle size={32} className="mb-2" />
                                                <span className="text-sm truncate max-w-[200px]">{transferFile.name}</span>
                                                <span className="text-xs font-normal mt-1 text-green-600">Click para cambiar</span>
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 flex flex-col items-center hover:text-gold-600 transition-colors">
                                                <Upload size={32} className="mb-2" />
                                                <span className="font-medium">Subir foto o PDF</span>
                                                <span className="text-xs mt-1">Máx. 5MB</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setTransferFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>

                                <button type="submit" disabled={isProcessing} className="w-full bg-navy-900 text-white py-4 rounded-xl font-bold hover:bg-navy-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-1">
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <>Confirmar Transferencia <ArrowRight size={20} /></>}
                                </button>
                            </form>
                        )}

                        {(paymentMethod === 'azul' || paymentMethod === 'cardnet') && (
                            <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <CreditCard size={64} className="mx-auto text-gray-200 mb-6" />
                                <h4 className="text-2xl font-bold text-gray-700 mb-2">Pasarela {paymentMethod === 'azul' ? 'Azul' : 'Cardnet'}</h4>
                                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Estamos finalizando la integración técnica de esta pasarela.</p>
                                <button onClick={() => setPaymentMethod('paypal')} className="text-blue-600 font-bold hover:text-blue-800 hover:underline transition-all flex items-center justify-center gap-2 mx-auto">
                                    Usar PayPal por ahora <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-16 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><CheckCircle size={48} /></div>
            <h2 className="text-3xl font-serif font-bold text-navy-900 mb-4">¡Reserva Exitosa!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Hemos enviado un correo a <strong>{clientData.email}</strong> con los detalles.</p>
            <button onClick={() => window.location.reload()} className="bg-navy-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-800">Nueva Cita</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold text-navy-900 mb-2">Agenda tu Asesoría</h1>
                    <p className="text-gray-500">Reserva tu cita en pocos pasos</p>
                </div>

                {!bookingComplete ? (
                    <div ref={bookingCardRef} className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 relative">
                        {/* Header Steps */}
                        <div className="bg-navy-900 p-4 sticky top-0 z-30">
                            <div className="flex justify-between max-w-2xl mx-auto px-4 relative">
                                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-navy-700 -z-0 -translate-y-1/2"></div>
                                {STEPS.map((step) => (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center bg-navy-900 px-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${currentStep === step.id ? 'bg-gold-500 text-navy-900 ring-4 ring-navy-800' : (currentStep > step.id ? 'bg-green-500 text-white' : 'bg-navy-700 text-gray-400')}`}>
                                            {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase mt-1 ${currentStep === step.id ? 'text-gold-500' : 'text-gray-500'}`}>{step.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 md:p-12 min-h-[500px] flex flex-col">
                            <div className="flex-1">
                                {currentStep === 1 && renderStep1()}
                                {currentStep === 2 && renderStep2()}
                                {currentStep === 3 && renderStep3()}
                                {currentStep === 4 && renderStep4()}
                            </div>
                            <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between">
                                <button onClick={handleBack} disabled={currentStep === 1} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${currentStep === 1 ? 'opacity-0' : 'text-gray-500 hover:bg-gray-100'}`}><ChevronLeft size={18} /> Atrás</button>
                                {currentStep < 4 && <button onClick={handleNext} className="bg-navy-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-800 flex items-center gap-2 shadow-lg">Siguiente <ArrowRight size={18} /></button>}
                            </div>
                        </div>
                    </div>
                ) : renderSuccess()}
            </div>
        </div>
    );
};

export default Booking;
