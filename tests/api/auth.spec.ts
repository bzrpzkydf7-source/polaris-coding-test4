import { test, expect } from '@playwright/test';
import { AuthApi } from '../../Api/AuthApi';
import { HttpStatus } from '../../Models/HttpStatus';
import { Users } from '../../Models/UserInterfaces';
import { invalidCredentials } from '../../TestData/InvalidCredentials';
import usersData from '../../TestData/Users.json';

const users: Users = usersData;

test.describe('API: POST /users/login', () => {

    test('Login_withValidCredentials_returnsBearerAccessToken', { tag: ['@api', '@story-4-update-account-profile'] }, async ({ request }) => {
        const authApi = new AuthApi(request);

        const response = await authApi.login(users.admin.email, users.admin.password);

        expect(response.status()).toBe(HttpStatus.OK);
        const body = await response.json();
        expect(body.token_type).toBe('bearer');
        expect(typeof body.access_token).toBe('string');
        expect(body.access_token.length).toBeGreaterThan(0);
    });

    test('Login_withInvalidCredentials_returns401Unauthorized', { tag: ['@api', '@story-4-update-account-profile'] }, async ({ request }) => {
        const authApi = new AuthApi(request);

        const response = await authApi.login(invalidCredentials.email, invalidCredentials.password);

        expect(response.status()).toBe(HttpStatus.UNAUTHORIZED);
    });

});
