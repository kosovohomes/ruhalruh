import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";

const ORIGIN = "http://127.0.0.1:3000";
const PASSWORD = "a-long-passphrase-for-tests";

function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

function clientHeaders(): Record<string, string> {
  return { "x-forwarded-for": `test-client-${randomUUID()}` };
}

async function postJson(
  request: APIRequestContext,
  path: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<APIResponse> {
  return request.post(path, {
    data: body,
    headers: { Origin: ORIGIN, ...extraHeaders },
  });
}

async function deleteJson(
  request: APIRequestContext,
  path: string,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<APIResponse> {
  return request.delete(path, {
    data: body,
    headers: { Origin: ORIGIN, ...extraHeaders },
  });
}

function cookieValue(response: APIResponse, name: string): string | undefined {
  const values = response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === "set-cookie")
    .map((header) => header.value);

  for (const value of values) {
    const match = value.match(new RegExp(`(?:^|[,\\s])${name}=([^;,]+)`));
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return undefined;
}

async function registerMember(request: APIRequestContext, email: string, headers: Record<string, string>) {
  const response = await postJson(
    request,
    "/api/auth/register",
    { email, password: PASSWORD, name: "Test Member", preferredLanguage: "en" },
    headers,
  );
  expect(response.status()).toBe(201);
  return response;
}

test("registration creates a session that logout ends", async ({ request }) => {
  const headers = clientHeaders();
  const email = uniqueEmail("register");
  const response = await registerMember(request, email, headers);

  const body = await response.json();
  expect(body.user.email).toBe(email);
  expect(response.headers()["set-cookie"]).toContain("HttpOnly");

  const me = await request.get("/api/auth/me");
  expect(me.ok()).toBeTruthy();
  expect((await me.json()).user.email).toBe(email);

  const logout = await postJson(request, "/api/auth/logout", {}, headers);
  expect(logout.ok()).toBeTruthy();

  const afterLogout = await request.get("/api/auth/me");
  expect(afterLogout.status()).toBe(401);
});

test("refresh rotates the session and rejects reuse of the old token", async ({ playwright }) => {
  const headers = clientHeaders();
  const email = uniqueEmail("refresh");
  const isolated = await playwright.request.newContext({
    baseURL: ORIGIN,
    extraHTTPHeaders: { Origin: ORIGIN, ...headers },
  });
  const registered = await registerMember(isolated, email, headers);

  const refreshCookie = cookieValue(registered, "rrah_refresh");
  expect(refreshCookie).toBeTruthy();

  const firstRefresh = await isolated.post("/api/auth/refresh", {
    headers: { Cookie: `rrah_refresh=${refreshCookie}` },
  });
  expect(firstRefresh.ok()).toBeTruthy();
  expect((await firstRefresh.json()).user.email).toBe(email);

  const reusedRefresh = await isolated.post("/api/auth/refresh", {
    headers: { Cookie: `rrah_refresh=${refreshCookie}` },
  });
  expect(reusedRefresh.status()).toBe(401);
  await isolated.dispose();
});

test("password reset works locally and invalidates existing sessions", async ({ request }) => {
  const headers = clientHeaders();
  const email = uniqueEmail("reset");
  await registerMember(request, email, headers);

  const requestReset = await postJson(request, "/api/auth/password-reset/request", { email }, headers);
  expect(requestReset.ok()).toBeTruthy();
  const { devResetToken } = await requestReset.json();
  expect(typeof devResetToken).toBe("string");

  const newPassword = "a-different-long-passphrase";
  const confirm = await postJson(
    request,
    "/api/auth/password-reset/confirm",
    { token: devResetToken, password: newPassword },
    headers,
  );
  expect(confirm.ok()).toBeTruthy();

  const oldLogin = await postJson(
    request,
    "/api/auth/login",
    { email, password: PASSWORD },
    headers,
  );
  expect(oldLogin.status()).toBe(401);

  const newLogin = await postJson(
    request,
    "/api/auth/login",
    { email, password: newPassword },
    headers,
  );
  expect(newLogin.ok()).toBeTruthy();
});

test("a deleted account cannot sign in again", async ({ request }) => {
  const headers = clientHeaders();
  const email = uniqueEmail("delete");
  await registerMember(request, email, headers);

  const deleted = await deleteJson(request, "/api/auth/account", { password: PASSWORD }, headers);
  expect(deleted.ok()).toBeTruthy();

  const afterDelete = await request.get("/api/auth/me");
  expect(afterDelete.status()).toBe(401);

  const login = await postJson(
    request,
    "/api/auth/login",
    { email, password: PASSWORD },
    headers,
  );
  expect(login.status()).toBe(401);
});

test("repeated failed logins are rate limited", async ({ request }) => {
  const headers = clientHeaders();
  const body = { email: uniqueEmail("missing"), password: "wrong-password-value" };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await postJson(request, "/api/auth/login", body, headers);
    expect(response.status()).toBe(401);
  }

  const limited = await postJson(request, "/api/auth/login", body, headers);
  expect(limited.status()).toBe(429);
  expect(limited.headers()["retry-after"]).toBeTruthy();
});

test("state-changing requests from another site are rejected", async ({ request }) => {
  const response = await request.post("/api/auth/register", {
    data: {
      email: uniqueEmail("csrf"),
      password: PASSWORD,
      name: "Test Member",
      preferredLanguage: "en",
    },
    headers: { Origin: "https://elsewhere.example", ...clientHeaders() },
  });

  expect(response.status()).toBe(403);
});
