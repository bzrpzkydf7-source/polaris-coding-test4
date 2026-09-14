import { APIRequestContext, APIResponse } from '@playwright/test';
import { API_BASE_URL } from './apiConfig';

export class InvoicesApi {
    constructor(private readonly request: APIRequestContext) {}

    async list(token?: string): Promise<APIResponse> {
        return this.request.get(`${API_BASE_URL}/invoices`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
    }

    async getById(invoiceId: string, token: string): Promise<APIResponse> {
        return this.request.get(`${API_BASE_URL}/invoices/${invoiceId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    }
}
