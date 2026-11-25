import { expect, test } from "@playwright/test";

test("health endpoint returns a trace id and a known status", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.ok()).toBeTruthy();
  expect(response.headers()["x-trace-id"]).toBeTruthy();

  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.services.database).toBeTruthy();
  expect(typeof body.uptimeMs).toBe("number");
});

test("landing page shows the hero and language preview", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /A place to be heard/i })).toBeVisible();
  await expect(page.getByRole("group", { name: "Preview a language" })).toBeVisible();
});
