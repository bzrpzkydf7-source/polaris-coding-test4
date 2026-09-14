import { APIRequestContext, APIResponse } from '@playwright/test';
import { API_BASE_URL } from './apiConfig';

export class UsersApi {
    constructor(private readonly request: APIRequestContext) {}

    async getMe(token?: string): Promise<APIResponse> {
        return this.request.get(`${API_BASE_URL}/users/me`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
    }

    async patch(userId: string, token: string, data: Record<string, unknown>): Promise<APIResponse> {
        return this.request.patch(`${API_BASE_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
            data,
        });
    }
}
