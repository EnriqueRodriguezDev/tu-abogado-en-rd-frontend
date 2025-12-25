import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            nav: {
                home: 'Home',
                about: 'About Us',
                services: 'Services',
                blog: 'Blog',
                contact: 'Contact',
                videoCons: 'Video Consultation'
            },
            hero: {
                title: 'Legal Solutions for Your Peace of Mind',
                subtitle: 'We provide specialized legal advice with a commitment to excellence and results.',
                cta: 'Schedule Consultation'
            },
            booking: {
                title: 'Book your video consultation',
                subtitle: 'Schedule a video call with one of our expert lawyers for personalized legal advice.',
                specialist: 'Civil & Commercial Law',
                experience: 'Specialist in civil litigation, evictions and potential compensation with over 10 years of experience.',
                duration: 'Duration',
                minutes: 'minutes',
                price: 'DOP',
                date: 'Date',
                time: 'Time',
                service: 'Service',
                continue: 'Continue',
                confirm: 'Confirm Booking',
                availableHours: 'Available Hours',
                reason: 'Reason for consultation',
                reasonPlaceholder: 'Briefly describe your case (max 500 characters)...',
                switchCountry: 'Select your location',
                cancel: 'Cancel',
                paymentInfo: 'Payment Information'
            },
            modal: {
                title: 'Complete Booking',
                summary: 'Booking Summary',
                clientInfo: 'Client Information',
                name: 'Full Name',
                phone: 'Phone Number',
                country: 'Country',
                email: 'Email',
                paymentMethod: 'Payment Method',
                orCard: 'OR PAY WITH CARD'
            }
        }
    },
    es: {
        translation: {
            nav: {
                home: 'Inicio',
                services: 'Servicios',
                blog: 'Blog',
                contact: 'Contacto',
                videoCons: 'Videoconsulta'
            },
            hero: {
                title: 'Soluciones Legales Expertas para tu Tranquilidad',
                subtitle: 'Brindamos asesoría legal especializada con un compromiso de excelencia y resultados.',
                cta: 'Agendar Consulta'
            },
            booking: {
                title: 'Reserva tu videoconsulta',
                subtitle: 'Agenda una videollamada con uno de nuestros abogados expertos para recibir asesoría legal personalizada.',
                specialist: 'Derecho Civil & Comercial',
                experience: 'Especialista en litigios civiles, desalojos e indemnizaciones con más de 10 años de experiencia.',
                duration: 'Duración',
                minutes: 'minutos',
                price: 'DOP',
                date: 'Fecha',
                time: 'Hora',
                service: 'Servicio',
                continue: 'Continuar',
                confirm: 'Confirmar Reserva',
                availableHours: 'Horarios disponibles',
                reason: 'Motivo de consulta',
                reasonPlaceholder: 'Describe brevemente tu caso (máx. 500 caracteres)...',
                switchCountry: 'Selecciona tu ubicación',
                cancel: 'Cancelar',
                paymentInfo: 'Información de Pago'
            },
            modal: {
                title: 'Finalizar Reserva',
                summary: 'Resumen de Cita',
                clientInfo: 'Información del Cliente',
                name: 'Nombre Completo',
                phone: 'Teléfono',
                country: 'País',
                email: 'Correo Electrónico',
                paymentMethod: 'Método de Pago',
                orCard: 'O PAGA CON TARJETA'
            }
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'es', // default language
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
