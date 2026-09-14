import { APIRequestContext, APIResponse } from '@playwright/test';
import { LoginResponse } from '../Models/ApiTypes';
import { API_BASE_URL } from './apiConfig';

export class AuthApi {
    constructor(private readonly request: APIRequestContext) {}

    async login(email: string, password: string): Promise<APIResponse> {
        return this.request.post(`${API_BASE_URL}/users/login`, { data: { email, password } });
    }

    async loginAndGetToken(email: string, password: string): Promise<string> {
        const response = await this.login(email, password);
        const body: LoginResponse = await response.json();
        return body.access_token;
    }
}
