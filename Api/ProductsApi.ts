import { APIRequestContext, APIResponse } from '@playwright/test';
import { API_BASE_URL } from './apiConfig';

export class ProductsApi {
    constructor(private readonly request: APIRequestContext) {}

    async getById(productId: string): Promise<APIResponse> {
        return this.request.get(`${API_BASE_URL}/products/${productId}`);
    }

    // This site's product search uses the (uncommon) QUERY HTTP method with a
    // JSON body of filters, rather than a GET with query-string parameters.
    async search(filters: Record<string, string>): Promise<APIResponse> {
        return this.request.fetch(`${API_BASE_URL}/products`, { method: 'QUERY', data: filters });
    }
}
