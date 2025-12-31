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
    // i18n fields
    name_en?: string;
    description_en?: string;
    content_en?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    created_at?: string;
}
