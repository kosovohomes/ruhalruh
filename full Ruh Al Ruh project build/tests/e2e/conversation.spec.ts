import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext, type PlaywrightWorkerArgs } from "@playwright/test";

const ORIGIN = "http://127.0.0.1:3000";
const PASSWORD = "a-long-passphrase-for-conversation-tests";

interface Member {
  api: APIRequestContext;
  email: string;
}

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

async function newMember(playwright: PlaywrightWorkerArgs["playwright"], prefix: string): Promise<Member> {
  const email = uniqueEmail(prefix);
  const api = await playwright.request.newContext({
    baseURL: ORIGIN,
    extraHTTPHeaders: {
      Origin: ORIGIN,
      "x-forwarded-for": `conversation-${randomUUID()}`,
    },
  });

  const response = await api.post("/api/auth/register", {
    data: {
      email,
      password: PASSWORD,
      name: "Conversation Member",
      preferredLanguage: "en",
    },
  });
  expect(response.status()).toBe(201);

  return { api, email };
}

async function createSession(api: APIRequestContext, language = "en"): Promise<string> {
  const response = await api.post("/api/conversations", {
    data: { language, culturalContext: "new to therapy" },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.session.language).toBe(language);
  return body.session.id as string;
}

test("a message streams and both messages are persisted", async ({ playwright }) => {
  const member = await newMember(playwright, "stream");
  try {
    const sessionId = await createSession(member.api);

    const reply = await member.api.post(`/api/conversations/${sessionId}/messages`, {
      data: { content: "I felt anxious this morning." },
      headers: { Accept: "text/event-stream" },
    });
    expect(reply.ok()).toBeTruthy();
    expect(reply.headers()["content-type"]).toContain("text/event-stream");

    const body = await reply.text();
    expect(body).toContain('"type":"delta"');
    expect(body).toContain('"type":"done"');
    expect(body).toContain("I felt anxious this morning.");

    const history = await member.api.get(`/api/conversations/${sessionId}/messages`);
    const data = await history.json();
    expect(data.messages.map((message: { role: string }) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(data.messages[0].content).toBe("I felt anxious this morning.");
  } finally {
    await member.api.dispose();
  }
});

test("another member cannot read or write a conversation", async ({ playwright }) => {
  const alice = await newMember(playwright, "owner");
  const bob = await newMember(playwright, "other");

  try {
    const sessionId = await createSession(alice.api, "ar");

    const bobSessions = await bob.api.get("/api/conversations");
    expect((await bobSessions.json()).sessions).toEqual([]);

    const read = await bob.api.get(`/api/conversations/${sessionId}`);
    expect(read.status()).toBe(404);

    const history = await bob.api.get(`/api/conversations/${sessionId}/messages`);
    expect(history.status()).toBe(404);

    const write = await bob.api.post(`/api/conversations/${sessionId}/messages`, {
      data: { content: "intruder" },
    });
    expect(write.status()).toBe(404);
  } finally {
    await alice.api.dispose();
    await bob.api.dispose();
  }
});

test("state-changing conversation requests require a same-origin request", async ({ playwright }) => {
  const member = await newMember(playwright, "csrf");
  try {
    const response = await member.api.post("/api/conversations", {
      data: { language: "en" },
      headers: { Origin: "https://elsewhere.example" },
    });
    expect(response.status()).toBe(403);
  } finally {
    await member.api.dispose();
  }
});

test("landing page opens the conversation room", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: ORIGIN });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("link", { name: "Begin a conversation" }).click();

    await expect(page).toHaveURL(/\/conversation/, { timeout: 15_000 });
    await expect(page.getByText("Your room is waiting")).toBeVisible();
  } finally {
    await context.close();
  }
});

test("a member can register and stream a reply in Arabic", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: ORIGIN,
    extraHTTPHeaders: { "x-forwarded-for": `arabic-${randomUUID()}` },
  });
  try {
    const page = await context.newPage();
    await page.goto("/sign-in");

    await page.getByRole("button", { name: "Create account" }).first().click();
    await page.getByLabel("Name").fill("Arabic Member");
    await page.getByLabel("Email").fill(uniqueEmail("ui"));
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByLabel("Language").selectOption("ar");
    await page.getByRole("button", { name: "Create account" }).last().click();

    await expect(page).toHaveURL(/\/conversation/, { timeout: 15_000 });
    const composer = page.getByLabel("Your message");
    await expect(composer).toBeVisible();

    await composer.fill("أنا متعب اليوم");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText(/أسمعك/).first()).toBeVisible();
  } finally {
    await context.close();
  }
});
