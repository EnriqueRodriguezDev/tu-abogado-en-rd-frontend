import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import * as LucideIcons from 'lucide-react'
import {
    Calendar as CalendarIcon,
    Clock,
    DollarSign,
    User,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Upload, ArrowRight, Loader2, CreditCard,
    AlertCircle, Briefcase, Scale, Mail
} from 'lucide-react';
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
    { id: 'azul', name: 'Azul', img: '/images/payments/azul.png' },
    { id: 'paypal', name: 'PayPal / Tarjeta', img: '/images/payments/paypal.png' }
];

const COUNTRIES = [
    { code: 'DO', label: 'Rep. Dom.', dial: '+1', flag: '🇩🇴', mask: '(###) ###-####', digits: 10 },
    { code: 'US', label: 'EE.UU.', dial: '+1', flag: '🇺🇸', mask: '(###) ###-####', digits: 10 },
    { code: 'ES', label: 'España', dial: '+34', flag: '🇪🇸', mask: '### ### ###', digits: 9 },
    { code: 'MX', label: 'México', dial: '+52', flag: '🇲🇽', mask: '## #### ####', digits: 10 },
    { code: 'CO', label: 'Colombia', dial: '+57', flag: '🇨🇴', mask: '### ### ####', digits: 10 },
    { code: 'VE', label: 'Venezuela', dial: '+58', flag: '🇻🇪', mask: '(####) ###-####', digits: 11 },
    { code: 'PR', label: 'Puerto Rico', dial: '+1', flag: '🇵🇷', mask: '(###) ###-####', digits: 10 },
    { code: 'PA', label: 'Panamá', dial: '+507', flag: '🇵🇦', mask: '####-####', digits: 8 },
    { code: 'CR', label: 'Costa Rica', dial: '+506', flag: '🇨🇷', mask: '####-####', digits: 8 },
    { code: 'CL', label: 'Chile', dial: '+56', flag: '🇨🇱', mask: '# #### ####', digits: 9 },
    { code: 'PE', label: 'Perú', dial: '+51', flag: '🇵🇪', mask: '### ### ###', digits: 9 },
    { code: 'EC', label: 'Ecuador', dial: '+593', flag: '🇪🇨', mask: '## ### ####', digits: 9 },
    { code: 'AR', label: 'Argentina', dial: '+54', flag: '🇦🇷', mask: '## ####-####', digits: 10 },
    { code: 'CA', label: 'Canadá', dial: '+1', flag: '🇨🇦', mask: '(###) ###-####', digits: 10 },
    { code: 'IT', label: 'Italia', dial: '+39', flag: '🇮🇹', mask: '### ### ####', digits: 10 },
    { code: 'FR', label: 'Francia', dial: '+33', flag: '🇫🇷', mask: '# ## ## ## ##', digits: 9 },
    { code: 'DE', label: 'Alemania', dial: '+49', flag: '🇩🇪', mask: '### ########', digits: 11 },
    { code: 'GB', label: 'Reino Unido', dial: '+44', flag: '🇬🇧', mask: '#### ######', digits: 10 },
    { code: 'CH', label: 'Suiza', dial: '+41', flag: '🇨🇭', mask: '## ### ## ##', digits: 9 },
];

const getServiceIcon = (iconName: string | null) => {
    if (!iconName) return <LucideIcons.Briefcase size={32} />;

    // Capitalize first letter just in case (e.g. 'briefcase' -> 'Briefcase')
    const formattedName = iconName.charAt(0).toUpperCase() + iconName.slice(1);

    // @ts-expect-error - Dynamic access to Lucide library
    const IconComponent = LucideIcons[formattedName] || LucideIcons.Briefcase;
    return <IconComponent size={32} />;
};

const Booking = () => {
    // --- REFS ---
    const bookingCardRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);

    // --- STATE ---
    const [currentStep, setCurrentStep] = useState(1);
    const [stepError, setStepError] = useState<string | null>(null);

    // Data State
    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);

    // Router State
    const location = useLocation();
    const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);

    useEffect(() => {
        if (location.state && location.state.serviceId) {
            setPreselectedServiceId(location.state.serviceId);
        }
    }, [location]);

    // Step 1: Service Selection
    // selectedService removed (unused)


    // Step 2: Variant & Calendar
    const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | null>(null);
    const [meetingType, setMeetingType] = useState<'whatsapp' | 'meet'>('meet');

    // Step 2: Calendar Logic
    // State for dates and slots
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [currentDateBase, setCurrentDateBase] = useState(new Date());
    const [timeFilter, setTimeFilter] = useState<'morning' | 'afternoon' | 'evening'>('morning');
    // busySlots removed in favor of busyRanges defined later


    // --- INITIAL FETCH ---
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
    // Scroll to top on step change (Internal Content)
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStep]);

    // Scroll to top on booking success (Fix for mobile view)


    // Fetch availability when date is selected
    useEffect(() => {
        if (selectedDate && selectedVariant && selectedVariant.duration_minutes > 0) {
            fetchAvailability(selectedDate);
        } else {
            setBusyRanges([]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, selectedVariant]);

    // Fetch availability logic moved to helper section


    // Step 3: Client Data
    const [clientData, setClientData] = useState<ClientData & { rnc?: string }>({
        name: '', email: '', phone: '', reason: '', rnc: '',
        country_iso: 'DO', dial_code: '+1',
        notify_email: true, notify_whatsapp: true
    });
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Step 4: Payment
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | 'azul' | 'cardnet' | null>(null);
    const [transferFile, setTransferFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [confirmedCode, setConfirmedCode] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const totalPrice = selectedVariant ? selectedVariant.price_usd : 0;

    // Scroll to top on booking success (Fix for mobile view)
    useEffect(() => {
        if (bookingComplete) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [bookingComplete]);

    // --- PHONE MASKING (RD) ---


    /*
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const formatted = formatPhoneNumber(val);
        // limit to max length (10 digits + mask chars = 14)
        if (formatted.length <= 14) {
            setClientData({ ...clientData, phone: formatted });
            if (errors.phone) setErrors({ ...errors, phone: '' });
        }
    };
    */
    // Replace the current handlePhoneChange with this:
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const rawValue = value.replace(/\D/g, '');

        const selectedCountry = COUNTRIES.find(c => c.code === clientData.country_iso) || COUNTRIES[0];
        const maxDigits = selectedCountry.digits;

        if (rawValue.length > maxDigits) return;

        if (value === '') {
            setClientData({ ...clientData, phone: '' });
            return;
        }

        // Apply mask
        const mask = selectedCountry.mask;
        let formatted = '';
        let digitIndex = 0;
        for (let i = 0; i < mask.length && digitIndex < rawValue.length; i++) {
            if (mask[i] === '#') {
                formatted += rawValue[digitIndex];
                digitIndex++;
            } else {
                formatted += mask[i];
                // If the next raw digit exists but we added a separator, continue
            }
        }
        // If there are remaining digits (mask ran out), append them
        if (digitIndex < rawValue.length) {
            formatted += rawValue.slice(digitIndex);
        }

        setClientData({ ...clientData, phone: formatted });
        if (errors.phone) setErrors({ ...errors, phone: '' });
    };

    const handleCountryChange = (countryCode: string) => {
        const country = COUNTRIES.find(c => c.code === countryCode);
        if (country) {
            setClientData(prev => ({
                ...prev,
                country_iso: country.code,
                dial_code: country.dial,
                phone: '' // Reset phone when changing country
            }));
            setShowCountryPicker(false);
            if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
        }
    };

    // --- VALIDATION & NAVIGATION ---
    // --- VALIDATION & NAVIGATION ---
    // --- VALIDATION & NAVIGATION ---
    const validateStep3 = () => {
        const newErrors: { [key: string]: string } = {};

        // --- Channel Gate: At least one must be selected ---
        if (!clientData.notify_whatsapp && !clientData.notify_email) {
            newErrors.contact = 'Debe seleccionar al menos un medio de notificación.';
        }

        // --- Name: Always required ---
        const nameRegex = /^[a-zA-ZáéíóúñÁÉÍÓÚÑ]+(?:\s[a-zA-ZáéíóúñÁÉÍÓÚÑ]+)*$/;
        const trimmedName = clientData.name.trim();

        if (!trimmedName) newErrors.name = 'El nombre es requerido';
        else if (trimmedName.length < 3 || trimmedName.length > 30) newErrors.name = 'El nombre debe tener entre 3 y 30 caracteres';
        else if (!nameRegex.test(trimmedName)) newErrors.name = 'Solo letras y espacios simples permitidos';

        // --- WhatsApp Channel ---
        const selectedCountry = COUNTRIES.find(c => c.code === clientData.country_iso) || COUNTRIES[0];
        const phoneDigits = clientData.phone.replace(/\D/g, '');

        if (clientData.notify_whatsapp) {
            if (!clientData.dial_code) {
                newErrors.phone = 'Seleccione un código de país';
            } else if (!phoneDigits) {
                newErrors.phone = 'El teléfono es requerido para notificaciones por WhatsApp';
            } else if (phoneDigits.length !== selectedCountry.digits) {
                newErrors.phone = `El teléfono debe tener ${selectedCountry.digits} dígitos para ${selectedCountry.label}`;
            }
        } else if (phoneDigits && phoneDigits.length !== selectedCountry.digits) {
            // Not required, but if filled, still validate format
            newErrors.phone = `El teléfono debe tener ${selectedCountry.digits} dígitos para ${selectedCountry.label}`;
        }

        // --- Email Channel ---
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        const trimmedEmail = clientData.email.trim();

        if (clientData.notify_email) {
            if (!trimmedEmail) {
                newErrors.email = 'El email es requerido para notificaciones por correo';
            } else if (/\s/.test(trimmedEmail)) {
                newErrors.email = 'El email no puede contener espacios';
            } else if (trimmedEmail.length > 50) {
                newErrors.email = 'El email es muy largo';
            } else if (!emailRegex.test(trimmedEmail)) {
                newErrors.email = 'Email inválido';
            }
        } else if (trimmedEmail) {
            // Not required, but if filled, don't save garbage
            if (!emailRegex.test(trimmedEmail)) newErrors.email = 'Email inválido';
        }

        // --- Reason: Always required ---
        const reasonRegex = /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s,.]+$/;
        const trimmedReason = clientData.reason.trim();

        if (!trimmedReason) newErrors.reason = 'El motivo es requerido';
        else if (trimmedReason.length < 20) newErrors.reason = 'Mínimo 20 caracteres para entender su caso';
        else if (trimmedReason.length > 500) newErrors.reason = 'Máximo 500 caracteres';
        else if (!reasonRegex.test(trimmedReason)) newErrors.reason = 'No se permiten símbolos especiales';

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
        const [rawHours, minutes] = time.split(':').map(Number);
        let hours = rawHours;
        if (period === 'PM' && hours !== 12) hours += 12; // hours is modified
        if (period === 'AM' && hours === 12) hours = 0; // hours is modified
        // minutes is NOT modified
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
        // Fix: Use local date components to avoid UTC shifting
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const { data, error } = await supabase
            .from('appointments')
            .select('time, duration_minutes')
            .eq('date', dateStr)
            .neq('status', 'cancelled');

        if (data) {
            const ranges = data.map((appt: { time: string, duration_minutes: number }) => {
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

        const config = {
            morning: { start: 9 * 60, end: 12 * 60 },
            afternoon: { start: 13 * 60, end: 17 * 60 },
            evening: { start: 17 * 60, end: 20 * 60 }
        };

        const { start, end } = config[timeFilter];
        let current = start;

        // Obtenemos minutos actuales para comparar
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        while (current + duration <= end) {
            const slotStart = current;
            const slotEnd = current + duration;

            // Check collision con citas existentes
            const isBusy = busyRanges.some(range => {
                return (slotStart < range.end) && (slotEnd > range.start);
            });

            // Check si es hora pasada (Solo si es HOY)
            const isPast = isToday && (slotStart <= currentMinutes);

            slots.push({
                time: formatTime(slotStart),
                available: !isBusy && !isPast // <--- AQUÍ LA VALIDACIÓN
            });

            current += duration;
        }

        return slots;
    };

    const isToday = useMemo(() => {
        if (!selectedDate) return false;
        const today = new Date();
        return (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        );
    }, [selectedDate]);

    const isTabDisabled = (tab: 'morning' | 'afternoon' | 'evening') => {
        if (!isToday) return false; // Si no es hoy, todo está activo

        const now = new Date();
        const currentHour = now.getHours();

        // Mañana termina a las 12:00 PM
        if (tab === 'morning' && currentHour >= 12) return true;

        // Tarde termina a las 5:00 PM (17:00)
        if (tab === 'afternoon' && currentHour >= 17) return true;

        // Noche termina a las 9:00 PM (21:00) - Opcional, si quieres bloquear noche tarde
        if (tab === 'evening' && currentHour >= 21) return true;

        return false;
    };

    useEffect(() => {
        if (isToday && isTabDisabled(timeFilter)) {
            if (!isTabDisabled('afternoon')) setTimeFilter('afternoon');
            else if (!isTabDisabled('evening')) setTimeFilter('evening');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, isToday]); // Ejecutar cuando cambia el día

    // --- SAVE LOGIC ---
    const saveBooking = async (method: string, transactionId?: string, proofUrl?: string) => {
        try {
            const appointmentPayload = {
                date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
                time: selectedTimeSlot || 'N/A',
                duration_minutes: selectedVariant?.duration_minutes || 0,
                meeting_type: meetingType,
                client_name: clientData.name,
                client_email: clientData.email.trim() || null,
                client_phone: clientData.phone || null,
                client_country_iso: clientData.country_iso,
                client_dial_code: clientData.dial_code,
                notify_via_email: clientData.notify_email,
                notify_via_whatsapp: clientData.notify_whatsapp,
                reason: clientData.reason,
                total_price: totalPrice,
                service_id: preselectedServiceId
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

            if (data?.appointmentCode) {
                setConfirmedCode(data.appointmentCode);
            }

            setBookingComplete(true);
        } catch (err: unknown) {
            setApiError('Error al procesar la reserva. Por favor intenta de nuevo. ' + (err as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- PAYPAL HANDLERS ---
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const renderStep1 = () => {
        // 1. Identify the BASE Service (The mechanism: Video Consultation)
        const baseService = services.find((s: Service) => !s.is_visible || s.slug.includes('video') || s.slug.includes('consulta-judicial')) || services[0];

        // 2. Identify the TARGET Service (The topic: Divorce, Contracts, etc.)
        const targetService = preselectedServiceId
            ? services.find((s: Service) => s.id === preselectedServiceId) || baseService
            : baseService;

        // 3. Prepare Data
        const timeVariants = (baseService?.variants || [])
            .filter((v: ServiceVariant) => v.is_active)
            .sort((a: ServiceVariant, b: ServiceVariant) => a.order_index - b.order_index);

        const isSpecificTopic = targetService?.id !== baseService?.id;

        // Carousel active index
        const activeIndex = selectedVariant
            ? timeVariants.findIndex((v: ServiceVariant) => v.id === selectedVariant.id)
            : Math.floor(timeVariants.length / 2);

        // The "most popular" is typically the middle variant (order_index 1)
        const mostPopularIndex = Math.floor(timeVariants.length / 2);

        // --- Touch/Swipe handlers ---
        const handleTouchStart = (e: React.TouchEvent) => {
            touchStartX.current = e.touches[0].clientX;
            touchDeltaX.current = 0;
        };
        const handleTouchMove = (e: React.TouchEvent) => {
            touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
        };
        const handleTouchEnd = () => {
            const threshold = 50;
            if (touchDeltaX.current < -threshold) {
                // Swiped LEFT → go to next card
                const nextIndex = Math.min(activeIndex + 1, timeVariants.length - 1);
                handleVariantSelect(timeVariants[nextIndex]);
            } else if (touchDeltaX.current > threshold) {
                // Swiped RIGHT → go to previous card
                const prevIndex = Math.max(activeIndex - 1, 0);
                handleVariantSelect(timeVariants[prevIndex]);
            }
            touchStartX.current = 0;
            touchDeltaX.current = 0;
        };

        return (
            <div className="flex flex-col min-h-full gap-4 md:gap-6 animate-in slide-in-from-right duration-300">
                {stepError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shrink-0"><AlertCircle size={20} /> <span className="font-bold">{stepError}</span></div>}

                {loadingServices ? (
                    <div className="flex justify-center py-12 m-auto"><Loader2 className="animate-spin text-gold-500" size={40} /></div>
                ) : (
                    <div className="flex flex-col gap-4 md:gap-6 shrink-0">
                        {/* Header */}
                        <div className="text-center px-2">
                            <h4 className="font-bold text-xl md:text-2xl text-navy-900 mb-1">{baseService.name}</h4>
                            {!isSpecificTopic && baseService?.description && (
                                <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                                    {baseService?.description}
                                </p>
                            )}
                        </div>

                        {/* Elige tu plan label */}
                        <div className="flex items-center gap-4">
                            <div className="h-px bg-gray-200 flex-1"></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Elige tu plan
                            </span>
                            <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        {/* ─── SWIPEABLE CAROUSEL / PASARELA ─── */}
                        {timeVariants.length === 0 ? (
                            <div className="text-gray-400 italic text-center py-4">No hay planes disponibles</div>
                        ) : (
                            <div
                                className="relative w-full overflow-hidden pt-4 pb-2 select-none"
                                style={{ minHeight: '240px' }}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className="flex items-center justify-center relative" style={{ height: '210px' }}>
                                    {timeVariants.map((variant: ServiceVariant, index: number) => {
                                        const offset = index - activeIndex;
                                        const isActive = offset === 0;
                                        const isAdjacent = Math.abs(offset) === 1;
                                        const isHidden = Math.abs(offset) > 1;
                                        const isSelected = selectedVariant?.id === variant.id;
                                        const isMostPopular = index === mostPopularIndex;

                                        // Stacked card transforms
                                        const translateX = isActive ? 0 : offset * 75;
                                        const scale = isActive ? 1 : isAdjacent ? 0.88 : 0.75;
                                        const zIndex = isActive ? 30 : isAdjacent ? 20 : 10;
                                        const cardOpacity = isActive ? 1 : isAdjacent ? 0.65 : 0;

                                        return (
                                            <button
                                                key={variant.id}
                                                data-testid="variant-btn"
                                                onClick={() => handleVariantSelect(variant)}
                                                className={`
                                                    absolute rounded-2xl text-left flex flex-col
                                                    w-[190px] md:w-[230px]
                                                    transition-all duration-500 ease-out cursor-pointer
                                                    ${isHidden ? 'pointer-events-none' : ''}
                                                    ${isActive && isSelected
                                                        ? 'bg-white border-2 border-gold-400 shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-gold-200/60'
                                                        : isActive
                                                            ? 'bg-white border-2 border-gray-200 shadow-xl'
                                                            : 'bg-gray-50/90 border border-gray-200 shadow-md'}
                                                `}
                                                style={{
                                                    transform: `translateX(${translateX}%) scale(${scale})`,
                                                    zIndex,
                                                    opacity: cardOpacity,
                                                    height: '200px',
                                                }}
                                            >
                                                {/* "Más elegido" badge */}
                                                {isMostPopular && isActive && (
                                                    <div className="absolute -top-3 right-3 bg-gold-500 text-navy-900 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-lg z-10">
                                                        Más elegido
                                                    </div>
                                                )}

                                                {/* Selected check */}
                                                {isSelected && isActive && (
                                                    <div className="absolute top-3 right-3 z-10">
                                                        <CheckCircle size={20} className="text-gold-500 fill-gold-500" />
                                                    </div>
                                                )}

                                                {/* Card Content */}
                                                <div className="flex flex-col gap-1 h-full p-4 md:p-5">
                                                    {/* Top: Name + Duration */}
                                                    <div>
                                                        <div className={`font-bold text-lg md:text-xl leading-tight ${isActive ? 'text-navy-900' : 'text-gray-400'}`}>
                                                            {variant.name_es}
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 mt-0.5 text-xs font-medium ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            <Clock size={13} />
                                                            <span>{variant.duration_minutes > 0 ? `${variant.duration_minutes} min` : 'Fijo'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Middle: Price */}
                                                    <div className="py-1">
                                                        <span className={`text-3xl md:text-4xl font-bold tracking-tight ${isActive ? 'text-navy-900' : 'text-gray-300'}`}>
                                                            ${variant.price_usd}
                                                        </span>
                                                    </div>

                                                    {/* Bottom: Description */}
                                                    <div className={`text-xs leading-relaxed line-clamp-3 ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {variant.description || ''}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Carousel dots */}
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    {timeVariants.map((variant: ServiceVariant, index: number) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => handleVariantSelect(variant)}
                                            className={`rounded-full transition-all duration-300 ${
                                                index === activeIndex
                                                    ? 'w-6 h-2 bg-gold-500'
                                                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* SECCIÓN: MÉTODO DE CONSULTA */}
                <div className="bg-white rounded-2xl border border-gray-100 p-3 md:p-4 mt-auto shrink-0">
                    <h3 className="text-sm font-bold text-navy-900 mb-2 text-center tracking-wider">Elige tu App</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setMeetingType('meet')} 
                            className={`w-full p-2.5 rounded-xl border transition-all flex flex-row items-center justify-start gap-3 group relative overflow-hidden ${meetingType === 'meet' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-300 bg-gray-50/50'}`}
                        >
                            <div className="bg-white p-1.5 rounded-full border border-gray-100 group-hover:scale-110 transition-transform shadow-sm shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 87.5 72"><path fill="#00832d" d="M49.5 36l8.53 9.75 11.47 7.33 2-17.02-2-16.64-11.69 6.44z"/><path fill="#0066da" d="M0 51.5V66c0 3.315 2.685 6 6 6h14.5l3-10.96-3-10.54H0z"/><path fill="#e94235" d="M20.5 0L0 20.5l10.25 3 10.25-3 2.88-10.25z"/><path fill="#2684fc" d="M20.5 20.5H0v31h20.5z"/><path fill="#00ac47" d="M82.6 8.68L69.5 19.42v33.66l13.16 10.79c1.97 1.54 4.84.135 4.84-2.37V11c0-2.535-2.945-3.925-4.9-2.32z"/><path fill="#00832d" d="M49.5 36v15.5h-29V72h29c3.315 0 6-2.685 6-6V53.08z"/><path fill="#ffba00" d="M55.5 6c0-3.315-2.685-6-6-6h-29v20.5h29V36l14-10.73V6z"/><path fill="#188038" d="M20.5 20.5v31H6c-3.315 0-6-2.685-6-6v-25h20.5z" opacity="0"/></svg>
                            </div>
                            <span className="font-bold text-xs md:text-sm text-navy-900 text-left leading-tight">Google Meet</span>
                            {meetingType === 'meet' && <div className="absolute top-1.5 right-1.5"><CheckCircle className="text-blue-500 w-3.5 h-3.5" /></div>}
                        </button>
                        <button 
                            onClick={() => setMeetingType('whatsapp')} 
                            className={`w-full p-2.5 rounded-xl border transition-all flex flex-row items-center justify-start gap-3 group relative overflow-hidden ${meetingType === 'whatsapp' ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-100 hover:border-green-300 bg-gray-50/50'}`}
                        >
                            <div className="bg-green-100 p-1.5 rounded-full group-hover:scale-110 transition-transform shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </div>
                            <span className="font-bold text-xs md:text-sm text-navy-900 text-left leading-tight">WhatsApp</span>
                            {meetingType === 'whatsapp' && <div className="absolute top-1.5 right-1.5"><CheckCircle className="text-green-500 w-3.5 h-3.5" /></div>}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep2 = () => (
        <div className="space-y-4 md:space-y-8 animate-in slide-in-from-right duration-300 h-full flex flex-col">
            {stepError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 shrink-0"><AlertCircle size={20} /> <span className="font-bold">{stepError}</span></div>}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <h3 className="text-lg md:text-xl font-bold text-navy-900">Fecha y Hora</h3>
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit self-start md:self-auto shadow-inner">
                    <button onClick={() => setViewMode('week')} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500 hover:text-navy-700'}`}>Semanal</button>
                    <button onClick={() => setViewMode('month')} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-navy-900' : 'text-gray-500 hover:text-navy-700'}`}>Mensual</button>
                </div>
            </div>

            <div className="relative shrink-0">
                <button onClick={() => handleDateNav('prev')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 z-10 bg-white p-1.5 md:p-2 rounded-full shadow-lg border border-gray-100 text-navy-600 hover:bg-gray-50"><ChevronLeft size={20} className="md:w-6 md:h-6" /></button>
                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 md:px-8 custom-scrollbar scroll-smooth">
                    {generateDates.map((date) => (
                        <button key={date.toISOString()} data-testid="date-btn" onClick={() => { setSelectedDate(date); setStepError(null); }} className={`flex-none w-14 h-18 md:w-24 md:h-32 rounded-xl md:rounded-2xl border-2 flex flex-col items-center justify-center gap-1 md:gap-2 transition-all ${selectedDate?.toDateString() === date.toDateString() ? 'bg-navy-900 border-navy-900 text-gold-500 shadow-xl scale-105' : 'bg-white border-gray-200 text-gray-400 hover:border-gold-300'}`}>
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</span>
                            <span className="text-2xl md:text-4xl font-bold">{date.getDate()}</span>
                            <span className="text-[10px] md:text-xs font-medium">{date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
                        </button>
                    ))}
                </div>
                <button onClick={() => handleDateNav('next')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 z-10 bg-white p-1.5 md:p-2 rounded-full shadow-lg border border-gray-100 text-navy-600 hover:bg-gray-50"><ChevronRight size={20} className="md:w-6 md:h-6" /></button>
            </div>

            <div className="bg-gray-50 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-3 md:mb-6 shrink-0">
                    <span className="font-bold text-gray-500 uppercase text-xs md:text-sm tracking-wider">Horarios</span>
                    <div className="flex bg-white rounded-lg p-1 text-xs font-bold shadow-sm">
                        {(['morning', 'afternoon', 'evening'] as const).map(f => {
                            const disabled = isTabDisabled(f);
                            return (
                                <button
                                    key={f}
                                    onClick={() => !disabled && setTimeFilter(f)}
                                    disabled={disabled}
                                    className={`
                                            px-2 md:px-3 py-1.5 rounded-md transition-all 
                                            ${timeFilter === f ? 'bg-navy-50 text-navy-900 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}
                                            ${disabled ? 'opacity-30 cursor-not-allowed bg-transparent text-gray-300' : ''}
                                        `}
                                >
                                    {f === 'morning' ? 'Mañana' : f === 'afternoon' ? 'Tarde' : 'Noche'}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2 min-h-[150px]">
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-4 pb-2">
                        {generateTimeSlots().map(({ time, available }) => (
                            <button
                                key={time}
                                data-testid="time-slot-btn"
                                disabled={!available}
                                onClick={() => { setSelectedTimeSlot(time); setStepError(null); }}
                                className={`py-2 md:py-4 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all border-2 
                                    ${!available ? 'bg-gray-100 border-transparent text-gray-300 cursor-not-allowed hidden' :
                                        selectedTimeSlot === time ? 'bg-gold-500 border-gold-500 text-navy-900 shadow-lg scale-[1.02]' :
                                            'bg-white border-transparent hover:border-gold-300 text-navy-700 hover:shadow-md'}`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => {
        const selectedCountry = COUNTRIES.find(c => c.code === clientData.country_iso) || COUNTRIES[0];

        return (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-right duration-300">
            <h3 className="text-xl text-center font-bold text-navy-900">Tus Datos</h3>
            <p className="text-sm text-gray-400 text-center -mt-2">Completa la información para confirmar tu consulta.</p>

            {/* Channel gate error */}
            {errors.contact && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} /> <span className="font-bold text-sm">{errors.contact}</span>
                </div>
            )}

            {/* ─── FORM FIELDS ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                {/* Nombre (always required) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={clientData.name}
                        onChange={e => {
                            let val = e.target.value.toUpperCase();
                            val = val.replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '');
                            val = val.replace(/\s{2,}/g, ' ');
                            setClientData({ ...clientData, name: val });
                            if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        onBlur={() => setClientData(prev => ({ ...prev, name: prev.name.trim() }))}
                        className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 outline-none transition-all text-navy-900 ${errors.name ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`}
                        placeholder="TU NOMBRE"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.name}</p>}
                </div>

                {/* Email (conditional required) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        Correo Electrónico {clientData.notify_email
                            ? <span className="text-red-500">*</span>
                            : <span className="text-gray-400 font-normal">(Opcional)</span>
                        }
                    </label>
                    <input
                        type="email"
                        value={clientData.email}
                        onChange={e => {
                            let val = e.target.value;
                            val = val.toLowerCase();
                            val = val.replace(/[^a-z0-9@._\-+]/g, '');
                            setClientData({ ...clientData, email: val });
                            if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 outline-none transition-all text-navy-900 ${errors.email ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`}
                        placeholder="usuario@email.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.email}</p>}
                </div>

                {/* Phone with Country Selector (conditional required) */}
                <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        Teléfono / WhatsApp {clientData.notify_whatsapp
                            ? <span className="text-red-500">*</span>
                            : <span className="text-gray-400 font-normal">(Opcional)</span>
                        }
                    </label>
                    <div className="flex gap-2">
                        {/* Country Selector */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowCountryPicker(!showCountryPicker)}
                                className={`flex items-center gap-1.5 bg-gray-50 border rounded-xl px-3 py-2.5 text-sm font-bold text-navy-900 hover:bg-gray-100 transition-all min-w-[110px] justify-between ${errors.phone ? 'border-red-500' : 'border-transparent'}`}
                            >
                                <span className="text-lg">{selectedCountry.flag}</span>
                                <span className="text-gray-600">{selectedCountry.dial}</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showCountryPicker ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {showCountryPicker && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowCountryPicker(false)} />
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                        {COUNTRIES.map(country => (
                                            <button
                                                key={country.code}
                                                type="button"
                                                onClick={() => handleCountryChange(country.code)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${clientData.country_iso === country.code ? 'bg-gold-50 text-navy-900 font-bold' : 'text-gray-700'}`}
                                            >
                                                <span className="text-lg">{country.flag}</span>
                                                <span className="flex-1 text-left">{country.label}</span>
                                                <span className="text-gray-400 text-xs">{country.dial}</span>
                                                {clientData.country_iso === country.code && <CheckCircle size={14} className="text-gold-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Phone Input */}
                        <input
                            type="tel"
                            value={clientData.phone}
                            onChange={handlePhoneChange}
                            className={`flex-1 bg-gray-50 border rounded-xl px-4 py-2.5 outline-none transition-all text-navy-900 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`}
                            placeholder={selectedCountry.mask.replace(/#/g, '0')}
                        />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.phone}</p>}
                </div>

                {/* Motivo (always required) */}
                <div className="col-span-full">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Motivo de la consulta <span className="text-red-500">*</span></label>
                    <textarea
                        value={clientData.reason}
                        onChange={e => {
                            let val = e.target.value.toUpperCase();
                            val = val.replace(/[^A-Z0-9ÁÉÍÓÚÑ\s,.]/g, '')
                                .replace(/\s{2,}/g, ' ');
                            setClientData({ ...clientData, reason: val });
                            if (errors.reason) setErrors({ ...errors, reason: '' });
                        }}
                        className={`w-full bg-gray-50 border rounded-xl px-4 py-2.5 outline-none transition-all text-navy-900 ${errors.reason ? 'border-red-500 bg-red-50' : 'border-transparent focus:border-gold-500 focus:bg-white'}`}
                        rows={2}
                        placeholder="DESCRIBA BREVEMENTE SU CASO..."
                    />
                    {errors.reason && <p className="text-red-500 text-xs mt-0.5 flex items-center gap-1"><AlertCircle size={12} /> {errors.reason}</p>}
                </div>
            </div>

            {/* ─── NOTIFICATION TOGGLES (BOTTOM, Framed) ─── */}
            <div className="border border-gray-200 rounded-xl p-3 mt-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recibir Notificación por</p>
                <div className="flex md:flex-row gap-3 md:gap-6 justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={clientData.notify_whatsapp}
                            onChange={e => {
                                setClientData({ ...clientData, notify_whatsapp: e.target.checked });
                                if (errors.contact) setErrors({ ...errors, contact: '' });
                            }}
                            className="w-4 h-4 rounded border-gray-300 accent-green-500 cursor-pointer"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                        <span className="text-sm text-gray-600 group-hover:text-navy-900 transition-colors">WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={clientData.notify_email}
                            onChange={e => {
                                setClientData({ ...clientData, notify_email: e.target.checked });
                                if (errors.contact) setErrors({ ...errors, contact: '' });
                            }}
                            className="w-4 h-4 rounded border-gray-300 accent-amber-500 cursor-pointer"
                        />
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600 group-hover:text-navy-900 transition-colors">Correo Electrónico</span>
                    </label>
                </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1.5">
                <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
                Tu información es 100% confidencial.
            </p>
        </div>
    );
    };

    const renderStep4 = () => (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
            {/* Order Summary */}
            <div className="bg-navy-900 text-white rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl relative overflow-hidden">
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
                    <h3 className="text-lg font-bold text-navy-900 mb-3">Paga de forma de segura</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {PAYMENT_METHODS.filter(m => m.id !== 'cardnet').map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id as PaymentMethod | 'azul' | 'cardnet')}
                                className={`relative flex items-center justify-center p-3 rounded-xl border transition-all h-20 group ${paymentMethod === method.id ? 'border-gold-500 bg-gold-50/30 ring-1 ring-gold-200' : 'border-gray-100 hover:border-gold-300 hover:bg-gray-50'}`}
                            >
                                {paymentMethod === method.id && (
                                    <div className="absolute top-1 right-1 text-gold-500 animate-in zoom-in duration-300">
                                        <CheckCircle size={16} className="fill-current" />
                                    </div>
                                )}
                                <div className="w-full h-full flex items-center justify-center">
                                    <img
                                        src={method.img}
                                        alt={method.id}
                                        className="h-10 w-auto object-contain transition-transform group-hover:scale-110 duration-300"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x40?text=IMG'; }}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Form */}
                <div className="lg:col-span-2">
                    <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm h-full flex flex-col justify-center min-h-[300px]">
                        {!paymentMethod && (
                            <div className="text-center text-gray-400 animate-in fade-in zoom-in duration-300">
                                <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Selecciona un método de pago para continuar</p>
                            </div>
                        )}
                        {paymentMethod === 'paypal' && (
                            <div className="max-w-md mx-auto w-full text-center relative z-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                               
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
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onError={(err: any) => setApiError('Error de conexión con PayPal. Intenta de nuevo.' + (err?.message || ''))}
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

            {confirmedCode && (
                <div className="bg-navy-50 border border-navy-100 rounded-2xl p-6 max-w-sm mx-auto mb-8 shadow-sm">
                    <p className="text-sm font-bold text-navy-600 uppercase tracking-wider mb-2">Tu Código de Cita</p>
                    <div className="text-4xl font-mono font-bold text-navy-900 tracking-widest">{confirmedCode}</div>
                    <p className="text-xs text-gray-500 mt-2">Guarda este código para consultas futuras</p>
                </div>
            )}

            <p className="text-gray-500 mb-8 max-w-md mx-auto">Hemos enviado un correo a <strong>{clientData.email}</strong> con los detalles.</p>
            <button onClick={() => window.location.reload()} className="bg-navy-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-navy-800">Nueva Cita</button>
        </div>
    );

    return (
        // 1. Fixed "Shell" that locks the viewport (No window scroll)
        <div className="fixed inset-x-0 top-16 md:top-20 bottom-0 bg-gray-50 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 overflow-hidden font-sans">

            {/* 2. The Card (Flex Column) - Grows/Shrinks but never overflows shell */}
            <div ref={bookingCardRef} className="w-full max-w-5xl bg-white h-full md:h-auto md:max-h-[85vh] flex flex-col shadow-2xl md:rounded-[2rem] rounded-t-[2rem] overflow-hidden z-10 border border-gray-100/50">

                {/* A. Header (Shrinks) */}
                {!bookingComplete && (
                    <div className="bg-navy-900 p-3 md:p-4 shrink-0 text-white shadow-md z-30 relative">
                        {/* Desktop Steps */}
                        <div className="hidden md:flex justify-around max-w-2xl mx-auto px-4 relative">
                            {/* Progress Line */}
                            <div className="absolute top-[18px] left-8 right-8 h-0.5 bg-navy-700 -z-0"></div>
                            {/* Steps Loop */}
                            {STEPS.map((step) => (
                                <div key={step.id} className="relative z-10 flex flex-col items-center min-w-[60px]">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg ring-4 ${currentStep === step.id ? 'bg-gold-500 text-navy-900 ring-navy-800 scale-110' : (currentStep > step.id ? 'bg-green-500 text-white ring-navy-800' : 'bg-navy-700 text-gray-400 ring-navy-800')}`}>
                                        {currentStep > step.id ? <CheckCircle size={18} /> : step.id}
                                    </div>
                                    <span className={`text-xs font-bold uppercase mt-2 tracking-wide ${currentStep === step.id ? 'text-gold-500' : 'text-gray-500'}`}>{step.title}</span>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Compact Header */}
                        <div className="md:hidden flex flex-col gap-1.5">
                            <div className="flex justify-between items-center px-1">
                                <span className="font-bold text-xs text-gold-500">Paso {currentStep}/4</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{STEPS[currentStep - 1]?.title}</span>
                            </div>
                            {/* Thin Progress Bar */}
                            <div className="h-1 bg-navy-700 rounded-full overflow-hidden w-full">
                                <div className="h-full bg-gold-500 transition-all duration-300" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* B. Content (Grows & Scrolls Internally) */}
                <div ref={contentRef} className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-8 custom-scrollbar relative bg-white">
                    {!bookingComplete ? (
                        <>
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                            {currentStep === 4 && renderStep4()}
                        </>
                    ) : renderSuccess()}
                </div>

                {/* C. Footer (Fixed at Bottom) */}
                {!bookingComplete && (
                    <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${currentStep === 1 ? 'invisible' : 'text-gray-500 hover:bg-gray-100 hover:text-navy-900'}`}
                        >
                            <ChevronLeft size={20} /> <span className="hidden md:inline">Atrás</span>
                        </button>

                        {currentStep < 4 && (
                            <button
                                onClick={handleNext}
                                data-testid="next-btn"
                                className="bg-gold-500 text-navy-900 px-6 py-3 md:px-8 md:py-3.5 rounded-xl font-bold hover:bg-gold-400 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm md:text-base w-full md:w-auto justify-center"
                            >
                                Siguiente <ArrowRight size={20} />
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Booking;
