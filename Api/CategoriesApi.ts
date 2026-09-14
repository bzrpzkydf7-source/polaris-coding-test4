import { APIRequestContext, APIResponse } from '@playwright/test';
import { API_BASE_URL } from './apiConfig';

export class CategoriesApi {
    constructor(private readonly request: APIRequestContext) {}

    async getTree(): Promise<APIResponse> {
        return this.request.get(`${API_BASE_URL}/categories/tree`);
    }
}
