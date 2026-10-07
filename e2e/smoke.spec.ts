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
  await page.getByRole('navigation', { name: 'Domaines' }).getByRole('link', { name: 'Finance' }).click();
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

test('account pages render as static UI', async ({ page }) => {
  for (const path of ['/login', '/signup', '/learn', '/teach', '/account', '/admin']) {
    await page.goto(path);
    await expect(page.locator('h1').first()).toBeVisible();
    await noHorizontalScroll(page);
  }
});

test('login form validates and explains the demo', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('apprenant@example.com');
  await page.locator('#password').fill('motdepasse');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText(/Version de démonstration/)).toBeVisible();
});
