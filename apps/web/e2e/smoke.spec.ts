import { test, expect } from '@playwright/test';

// ponytail: smoke test — page renders, no client-side crash.
// Content assertions are loose: the UI is heavy and changes a lot; an empty body catches a broken bundle.
test('home page renders without client crash', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  // Body must have non-trivial content
  const body = await page.locator('body').innerText();
  expect(body.length).toBeGreaterThan(50);
  // No uncaught client exceptions
  expect(errors, errors.join('\n')).toEqual([]);
});
