import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

const ORIGIN = "http://127.0.0.1:3000";
const PASSWORD = "a-long-passphrase-for-support-tests";

interface PublicMessage {
  role: string;
  content: string;
  kind?: string;
}

test("a support offer never overrides the reply, notifies anyone, or records a score", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: ORIGIN,
    extraHTTPHeaders: { "x-forwarded-for": `support-${randomUUID()}` },
  });
  const externalRequests: string[] = [];
  const supportEvents: string[] = [];

  context.on("request", (request) => {
    const url = new URL(request.url());
    if (
      !["data:", "blob:", "about:"].includes(url.protocol) &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    ) {
      externalRequests.push(request.url());
    }
    if (url.pathname === "/api/support/events") supportEvents.push(request.method());
  });

  try {
    const page = await context.newPage();
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Create account" }).first().click();
    await page.getByLabel("Name").fill("Support Member");
    await page.getByLabel("Email").fill(`support-${randomUUID()}@example.com`);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).last().click();

    await expect(page).toHaveURL(/\/conversation/, { timeout: 15_000 });
    const composer = page.getByLabel("Your message");
    await composer.fill("I can't go on anymore");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText(/I hear you/).first()).toBeVisible();
    await expect(page.getByText(/I noticed something in your last message/)).toBeVisible();

    const offer = page.getByRole("group", { name: "Support offer" });
    await expect(offer).toBeVisible();
    expect(supportEvents).toEqual([]);
    expect(externalRequests).toEqual([]);

    await offer.getByRole("button", { name: "Not now" }).click();
    await expect(page.getByText("No, thank you.", { exact: true })).toBeVisible();
    await expect(page.getByText("Understood. We can continue here.")).toBeVisible();
    expect(supportEvents).toEqual(["POST"]);
    expect(externalRequests).toEqual([]);

    const sessionsResponse = await context.request.get("/api/conversations");
    const sessions = (await sessionsResponse.json()) as { sessions: Array<{ id: string }> };
    const historyResponse = await context.request.get(
      `/api/conversations/${sessions.sessions[0]?.id}/messages`,
    );
    const history = (await historyResponse.json()) as { messages: PublicMessage[] };

    expect(history.messages.map((message) => message.kind)).toEqual([
      undefined,
      undefined,
      "support_offer",
      "support_request",
      "support_response",
    ]);
    expect(JSON.stringify(history)).not.toContain("riskScore");
    expect(JSON.stringify(history)).not.toContain("hiddenFlag");
  } finally {
    await context.close();
  }
});

test("accepting a support offer shows reviewed US resources without contacting anyone", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: ORIGIN,
    extraHTTPHeaders: { "x-forwarded-for": `resources-${randomUUID()}` },
  });
  const externalRequests: string[] = [];

  context.on("request", (request) => {
    const url = new URL(request.url());
    if (
      !["data:", "blob:", "about:"].includes(url.protocol) &&
      !["127.0.0.1", "localhost"].includes(url.hostname)
    ) {
      externalRequests.push(request.url());
    }
  });

  try {
    const page = await context.newPage();
    await page.goto("/sign-in");
    await page.getByRole("button", { name: "Create account" }).first().click();
    await page.getByLabel("Name").fill("Resource Member");
    await page.getByLabel("Email").fill(`resources-${randomUUID()}@example.com`);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).last().click();

    await expect(page).toHaveURL(/\/conversation/, { timeout: 15_000 });
    await page.getByLabel(/Cultural context/).fill("usa");
    await page.getByLabel("Your message").fill("I can't go on anymore");
    await page.getByRole("button", { name: "Send" }).click();

    const offer = page.getByRole("group", { name: "Support offer" });
    await expect(offer).toBeVisible();
    await offer.getByRole("button", { name: "See support options" }).click();

    await expect(page.getByText("Yes, please show me support options.", { exact: true })).toBeVisible();
    await expect(page.getByText(/988 Suicide & Crisis Lifeline/)).toBeVisible();
    await expect(page.getByText(/Crisis Text Line/)).toBeVisible();
    await expect(page.getByText(/Veterans Crisis Line/)).toBeVisible();
    const resourceMessageText = await page
      .getByText(/988 Suicide & Crisis Lifeline/)
      .textContent();
    expect(resourceMessageText?.match(/reviewed 2026-11-25/g)).toHaveLength(3);

    const directoryResponse = await context.request.get(
      "/api/support/resources?language=en&jurisdiction=usa",
    );
    expect(directoryResponse.ok()).toBeTruthy();
    const directory = (await directoryResponse.json()) as {
      jurisdiction: string;
      count?: number;
      resources: Array<{ id: string; source: string; reviewedAt: string }>;
    };
    expect(directory.jurisdiction).toBe("United States");
    expect(directory.resources).toHaveLength(3);
    expect(JSON.stringify(directory)).not.toContain("riskScore");
    expect(JSON.stringify(directory)).not.toContain("hiddenFlag");

    expect(externalRequests).toEqual([]);
  } finally {
    await context.close();
  }
});
