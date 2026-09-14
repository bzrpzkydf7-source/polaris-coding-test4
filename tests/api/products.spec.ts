import { test, expect } from '@playwright/test';
import { ProductsApi } from '../../Api/ProductsApi';
import { HttpStatus } from '../../Models/HttpStatus';

test.describe('API: Products', () => {

    test('SearchProducts_withPage1_returnsAPageOfProducts', { tag: ['@api', '@story-3-filter-products-and-pagination'] }, async ({ request }) => {
        const productsApi = new ProductsApi(request);

        const response = await productsApi.search({ page: '1' });

        expect(response.status()).toBe(HttpStatus.OK);
        const body = await response.json();
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
        expect(body.current_page).toBe(1);
    });

    test('GetProductById_forAKnownProduct_returnsItsFullDetails', { tag: ['@api', '@story-1-view-product-details'] }, async ({ request }) => {
        const productsApi = new ProductsApi(request);
        // Product IDs regenerate when this demo site's catalog data is
        // rebuilt, so the ID is fetched live rather than hardcoded.
        const searchResponse = await productsApi.search({ page: '1' });
        const { data } = await searchResponse.json();
        const knownProduct = data[0];

        const response = await productsApi.getById(knownProduct.id);

        expect(response.status()).toBe(HttpStatus.OK);
        const body = await response.json();
        expect(body.id).toBe(knownProduct.id);
        expect(body.name).toBe(knownProduct.name);
        expect(body.price).toBe(knownProduct.price);
        expect(typeof body.description).toBe('string');
        expect(body.description.length).toBeGreaterThan(0);
        expect(body.category).toHaveProperty('name');
        expect(body.brand).toHaveProperty('name');
        expect(Array.isArray(body.specs)).toBe(true);
    });

    test('GetProductById_forAnUnknownId_returns404', { tag: ['@api', '@story-1-view-product-details'] }, async ({ request }) => {
        const productsApi = new ProductsApi(request);

        const response = await productsApi.getById('not-a-real-product-id');

        expect(response.status()).toBe(HttpStatus.NOT_FOUND);
    });

});
