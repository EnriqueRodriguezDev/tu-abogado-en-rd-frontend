export interface BlogPost {
    id: string;
    created_at: string;
    title: string;
    content: string;
    category: string;
    image_url: string | null;
    slug: string;
    published: boolean;
    // i18n fields
    title_en?: string;
    content_en?: string;
}

export interface Service {
    id: string;
    created_at: string;
    name: string;
    description: string;
    content: string;
    price_dop: number | string;
    price_usd: number | string;
    image_url: string | null;
    slug: string;
    icon_name?: string;
    icon?: string; // Legacy
    category: string;
    is_visible?: boolean;
    // i18n fields
    name_en?: string;
    description_en?: string;
    content_en?: string;
    variants?: ServiceVariant[];
}

export interface ServiceVariant {
    id: string;
    service_id: string;
    name_es: string;
    name_en: string;
    duration_minutes: number;
    price_usd: number;
    price_dop: number;
    is_active: boolean;
    order_index: number;
}


export interface UserProfile {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    created_at?: string;
}

// --- BOOKING TYPES ---

export interface BookingStep {
    id: number;
    title: string;
    icon: any; // Lucide icon type
}

export interface PricingTier {
    duration: number;
    priceUsd: number;
    priceDop: number;
    label?: string;
    isBestValue?: boolean;
}

export interface TimeSlot {
    time: string; // 12h format e.g. "09:00 AM"
    available: boolean;
}

export interface ClientData {
    name: string;
    email: string;
    phone: string;
    reason: string;
    rnc?: string;
}

export type PaymentMethod = 'paypal' | 'transfer' | 'azul' | 'cardnet';

// --- DATABASE TYPES ---

export interface Lawyer {
    id: string;
    created_at: string;
    name: string;
    email: string;
    phone: string;
    image_url?: string;
    specialties?: string;
    reminder_minutes_before: number;
    is_active: boolean;
}

export interface Appointment {
    id: string;
    created_at: string;
    date: string;
    time: string;
    duration_minutes: number;
    meeting_type: 'whatsapp' | 'meet';
    status: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    reason: string;
    total_price: number;
    appointment_code?: string;
    lawyer_id?: string;
    lawyer?: Lawyer;
    service_id?: string;
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at'>;

export interface Payment {
    id: string;
    created_at: string;
    appointment_id: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: string;
    transaction_id?: string;
    proof_url?: string;
    ncf_number?: string;
    rnc_client?: string;
    company_rnc_snapshot?: string;
}

export type PaymentInsert = Omit<Payment, 'id' | 'created_at'>;

export interface TaxSequence {
    id: string;
    created_at: string;
    prefix: string; // e.g. B02
    description: string;
    current_value: number;
    end_value: number;
    expiration_date: string;
    status: 'active' | 'expired' | 'depleted';
    company_id?: number; // Optional link to company_settings
}


export interface Utility {
    id: string;
    created_at?: string;
    title: string;
    description: string;
    image_url: string;
    is_active?: boolean;
    // i18n fields
    title_en?: string;
    description_en?: string;

    link_url?: string;
    link_text?: string;
}
