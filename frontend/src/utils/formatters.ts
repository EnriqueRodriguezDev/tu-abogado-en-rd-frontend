/**
 * Formatea una fecha evitando el error de zona horaria (día anterior).
 * Convierte "YYYY-MM-DD" directamente a fecha local.
 * @param dateInput String "YYYY-MM-DD" o Objeto Date
 * @param longFormat Si es true, devuelve "Viernes, 2 de Enero..."
 * @returns String formateado (Ej: "02/01/2026")
 */
export const formatDate = (dateInput: string | Date, longFormat: boolean = false): string => {
    if (!dateInput) return '';

    let date: Date;

    if (typeof dateInput === 'string') {
        // Corrección de Zona Horaria: Crear fecha localmente
        if (dateInput.includes('-') && !dateInput.includes(':')) {
            const [year, month, day] = dateInput.split('-').map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateInput);
        }
    } else {
        date = dateInput;
    }

    if (isNaN(date.getTime())) return '';

    // CAMBIO AQUÍ: Usamos 'numeric' en lugar de '2-digit'
    // 'numeric' -> 1/1/2026
    // '2-digit' -> 01/01/2026
    const options: Intl.DateTimeFormatOptions = longFormat 
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { day: 'numeric', month: 'numeric', year: 'numeric' };

    return date.toLocaleDateString('es-DO', options);
};

/**
 * Formats a time string or date into "hh:mm a" format (e.g., "04:30 PM").
 * @param dateOrString Date object or time string (HH:mm:ss or ISO)
 * @returns Formatted time string
 */
export const formatTime = (dateOrString: string | Date): string => {
    let date: Date;

    if (typeof dateOrString === 'string') {
        // If it's a simple time string like "14:30:00" or "14:30", attach it to a dummy date
        if (dateOrString.includes(':')) {
            const [hours, minutes] = dateOrString.split(':').map(Number);
            date = new Date();
            date.setHours(hours, minutes, 0, 0);
        } else {
            // Try parsing as standard date string
            date = new Date(dateOrString);
        }
    } else {
        date = dateOrString;
    }

    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Formats a time string explicitly to 12-hour format with AM/PM
 * @param timeStr Time string in HH:mm or HH:mm:ss format
 * @returns Time string like "02:30 PM"
 */
export const formatTime12Hour = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Generates a WhatsApp link with a pre-filled, formal message.
 * @param phone Client's phone number
 * @param clientName Client's name
 * @param dateStr Appointment date string
 * @param timeStr Appointment time string
 * @param companyName Optional company name
 * @returns WhatsApp URL
 */
export const generateWhatsAppLink = (
    phone: string,
    clientName: string,
    dateStr: string,
    timeStr: string,
    companyName: string = "Tu Abogado en RD"
): string => {
    const cleanPhone = phone.replace(/\D/g, '');

    // Usamos la nueva función para asegurar que el día sea correcto en el mensaje también
    const formattedDate = formatDate(dateStr, true); // true para formato largo
    const formattedTime = formatTime12Hour(timeStr);

    const message = `Saludos ${clientName}, le escribimos de ${companyName} con relación a su cita agendada para el ${formattedDate} a las ${formattedTime}. ¿Tiene alguna consulta previa?`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};