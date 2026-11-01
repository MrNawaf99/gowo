import { test, expect } from "@playwright/test";

test.describe("GoWord Academy Authentication & Access Control", () => {
  test.beforeEach(async ({ context }) => {
    // Clear storage and cookies before each test
    await context.clearCookies();
  });

  test("Root page offers Student and Teacher portals without any public registration links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    
    // Check role selection links exist
    const studentLink = page.locator('a[href="/login/student"]');
    const teacherLink = page.locator('a[href="/login/teacher"]');
    await expect(studentLink).toBeVisible();
    await expect(teacherLink).toBeVisible();

    // Verify NO public registration links exist on the page
    const registerLinks = page.locator('a[href*="register"], a[href*="signup"]');
    await expect(registerLinks).toHaveCount(0);
  });

  test("Student login with invalid credentials displays error", async ({ page }) => {
    await page.goto("/login/student");
    await page.fill('input[type="text"]', "nonexistent_student");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');

    // Expect error alert to appear
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 20000 });
    // URL stays on /login/student
    expect(page.url()).toContain("/login/student");
  });

  test("Student login with valid credentials succeeds and navigates to teachers", async ({ page }) => {
    await page.goto("/login/student");
    await page.fill('input[type="text"]', "student1");
    await page.fill('input[type="password"]', "student123");
    await page.click('button[type="submit"]');

    // Navigates to teachers
    await expect(page).toHaveURL(/\/teachers/, { timeout: 20000 });

    // Navigate to student profile and verify assigned credentials
    await page.goto("/profile");
    await expect(page.locator("text=Sarah Al-Harbi")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=STD-001")).toBeVisible();
  });

  test("Teacher login with valid credentials succeeds", async ({ page }) => {
    await page.goto("/login/teacher");
    await page.fill('input[type="text"]', "abeer");
    await page.fill('input[type="password"]', "9999");
    await page.click('button[type="submit"]');

    // Navigates to teacher dashboard
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 20000 });
  });

  test("Unauthenticated access to protected teacher routes redirects to login", async ({ page, context }) => {
    await context.clearCookies();
    // Clear localStorage on fresh page
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/teacher/dashboard");
    await expect(page).toHaveURL(/\/login\/teacher/, { timeout: 15000 });
  });

  test("Unauthenticated access to protected student routes redirects to login", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());

    await page.goto("/teachers");
    await expect(page).toHaveURL(/\/login\/student/, { timeout: 15000 });
  });
});
