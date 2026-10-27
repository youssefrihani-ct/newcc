import { expect, test } from "@playwright/test";
import { TOTP, Secret } from "otpauth";

// Phase 0 smoke test: sign in, and a staff role whose policy is `required` must enrol an
// authenticator app before reaching anything. Needs the local stack, `npm run seed` and DEMO_PASSWORD.
const password = process.env.DEMO_PASSWORD ?? "";

test.skip(!password, "DEMO_PASSWORD is not set");

test("login shows both logos; inside the app only the CareCompanion logo", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByAltText("CareCompanion")).toBeVisible();
  await expect(page.getByAltText("CreativeTechy")).toBeVisible();

  await page.getByLabel("Email").fill("crc@demo.test");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Demo mode")).toBeVisible();
  await expect(page.getByAltText("CareCompanion")).toBeVisible();
  await expect(page.getByAltText("CreativeTechy")).toHaveCount(0);
});

test("a role with a required policy is held at 2FA enrolment until the session is aal2", async ({ page, request }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54421";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  test.skip(!serviceKey, "SUPABASE_SERVICE_ROLE_KEY is not set");

  const setPolicy = (policy: string) =>
    request.patch(`${supabaseUrl}/rest/v1/role_mfa_policies?role=eq.finance`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      data: { policy },
    });
  expect((await setPolicy("required")).ok()).toBeTruthy();

  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill("finance@demo.test");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // held at enrolment: no home screen
    await expect(page).toHaveURL(/\/security/);
    await page.getByRole("button", { name: "Set up authenticator app" }).click();
    const secret = (await page.locator("p.font-mono").innerText()).trim();

    const totp = new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 });
    await page.getByLabel("Code from your authenticator app").fill(totp.generate());
    await page.getByRole("button", { name: "Verify" }).click();

    await expect(page).toHaveURL(/localhost:5273\/?$/);
    await expect(page.getByText("Two-factor authentication")).toBeVisible();
  } finally {
    await setPolicy("optional");
  }
});
