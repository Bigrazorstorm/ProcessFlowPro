import { test, expect } from '@playwright/test';

test.describe('Navigation & Auth Protection', () => {
  test('should redirect "/" to login (not authenticated)', async ({ page }) => {
    await page.goto('/');
    // Since not authenticated, dashboard redirect should bring user to login
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect "/dashboard" to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect "/users" to login when not authenticated', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect "/clients" to login when not authenticated', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect "/templates" to login when not authenticated', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect "/workflows" to login when not authenticated', async ({ page }) => {
    await page.goto('/workflows');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect "/calendar" to login when not authenticated', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect "/reports" to login when not authenticated', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('should redirect unknown routes to login when not authenticated', async ({ page }) => {
    await page.goto('/some-unknown-route');
    await expect(page.getByText(/Anmeldung/i)).toBeVisible();
  });

  test('login page shows all required elements', async ({ page }) => {
    await page.goto('/login');
    // Heading
    await expect(page.getByRole('heading', { name: /ProcessFlow Pro/i })).toBeVisible();
    // Form title
    await expect(page.getByText('Anmeldung')).toBeVisible();
    // Email field
    await expect(page.getByLabel(/E-Mail-Adresse/i)).toBeVisible();
    // Password field
    await expect(page.getByLabel(/Passwort/i)).toBeVisible();
    // Submit button
    await expect(page.getByRole('button', { name: /Anmelden/i })).toBeVisible();
    // Remember me checkbox
    await expect(page.getByText(/Angemeldet bleiben/i)).toBeVisible();
    // Demo credentials
    await expect(page.getByText(/Demo-Zugang/i)).toBeVisible();
  });
});
