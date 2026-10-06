import { expect, test, type Page } from '@playwright/test';

async function noHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test('home shows real popular courses', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Formations populaires/ })).toBeVisible();
  await expect(page.locator('a[href^="/courses/"]').first()).toBeVisible();
  await expect(page.getByText('(320)')).toHaveCount(0); // no invented ratings
  await noHorizontalScroll(page);
});

test('catalog search, filter and hostile input', async ({ page }) => {
  await page.goto('/courses?q=credoc');
  await expect(page.getByRole('heading', { name: /Sécurisation des Paiements/ })).toBeVisible();
  await page.goto('/courses?q=%22%26%7C!&page=abc&sort=drop');
  await expect(page.getByText(/formation/).first()).toBeVisible();
  await page.goto('/courses');
  await page.getByLabel('Catégorie').selectOption('finance');
  await expect(page).toHaveURL(/category=finance/);
  await expect(page.getByRole('heading', { name: /Sécurisation des Paiements/ })).toBeVisible();
  await noHorizontalScroll(page);
});

test('course page shows curriculum and asks anonymous users to log in', async ({ page }) => {
  await page.goto('/courses/fondements-negoce-international');
  await expect(page.getByRole('heading', { level: 1, name: /Fondements du Négoce/ })).toBeVisible();
  await expect(page.getByText('Bienvenue et objectifs de la formation')).toBeVisible();
  await page.getByText('Construire et négocier une offre').click();
  await expect(page.getByText('Négocier avec un acheteur étranger')).toBeVisible();
  await page.getByRole('link', { name: /Se connecter pour s’inscrire/ }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fcourses%2Ffondements-negoce-international/);
  await noHorizontalScroll(page);
});

test('unknown course is a 404', async ({ page }) => {
  const res = await page.goto('/courses/n-existe-pas');
  expect([200, 404]).toContain(res?.status()); // streamed notFound may keep 200
  await expect(page.getByText(/introuvable|404/i).first()).toBeVisible();
});

test('protected areas redirect anonymous visitors', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/);
});

test('login rejects open redirects', async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'set E2E_EMAIL / E2E_PASSWORD to run');
  await page.goto('/login?next=//evil.com');
  // Field ids from components/auth/forms.tsx (the magic-link field is also labelled "Email").
  await page.locator('#email').fill(process.env.E2E_EMAIL!);
  await page.locator('#password').fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/localhost:3000\/learn/);
  await expect(page.getByRole('heading', { name: /Bonjour/ })).toBeVisible();
});
