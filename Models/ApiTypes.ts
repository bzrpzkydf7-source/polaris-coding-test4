export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface ApiUserAddress {
    street: string | null;
    house_number: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
}

export interface ApiUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    dob: string;
    address: ApiUserAddress;
}

export interface ApiProductCategory {
    id: string;
    name: string;
}

export interface ApiProductBrand {
    id: string;
    name: string;
}

export interface ApiProductSpec {
    id: string;
    spec_name: string;
    spec_value: string;
    spec_unit: string | null;
}

export interface ApiProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    in_stock: boolean;
    is_eco_friendly: boolean;
    category: ApiProductCategory;
    brand: ApiProductBrand;
    specs: ApiProductSpec[];
}

export interface ApiCategoryNode {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    sub_categories: ApiCategoryNode[];
}

export interface ApiInvoiceLineProduct {
    id: string;
    name: string;
    price: number;
}

export interface ApiInvoiceLine {
    id: string;
    product_id: string;
    unit_price: number;
    quantity: number;
    product: ApiInvoiceLineProduct;
}

export interface ApiInvoicePayment {
    payment_method: string;
}

export interface ApiInvoice {
    id: string;
    invoice_number: string;
    invoice_date: string;
    status: string;
    total: number;
    subtotal: number | null;
    billing_street: string;
    billing_city: string;
    billing_state: string;
    billing_country: string;
    billing_postal_code: string;
    invoicelines: ApiInvoiceLine[];
    payment: ApiInvoicePayment;
}

export interface ApiInvoiceListResponse {
    current_page: number;
    data: ApiInvoice[];
    last_page: number;
    per_page: number;
    total: number;
}
