import { test, expect } from '@playwright/test';
import { AuthApi } from '../../Api/AuthApi';
import { UsersApi } from '../../Api/UsersApi';
import { HttpStatus } from '../../Models/HttpStatus';
import { Users } from '../../Models/UserInterfaces';
import usersData from '../../TestData/Users.json';

const users: Users = usersData;

test.describe('API: GET /users/me', () => {

    test('GetMe_withoutToken_returns401Unauthorized', { tag: ['@api', '@story-4-update-account-profile'] }, async ({ request }) => {
        const usersApi = new UsersApi(request);

        const response = await usersApi.getMe();

        expect(response.status()).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('GetMe_withValidToken_returnsTheAuthenticatedUsersProfile', { tag: ['@api', '@story-4-update-account-profile'] }, async ({ request }) => {
        const authApi = new AuthApi(request);
        const usersApi = new UsersApi(request);
        const token = await authApi.loginAndGetToken(users.admin.email, users.admin.password);

        const response = await usersApi.getMe(token);

        expect(response.status()).toBe(HttpStatus.OK);
        const body = await response.json();
        expect(body.email).toBe(users.admin.email);
        expect(body.first_name).toBe(users.admin.firstName);
        expect(body.last_name).toBe(users.admin.surname);
    });

});
