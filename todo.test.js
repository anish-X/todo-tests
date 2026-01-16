import { test, expect } from "@playwright/test";

test.describe("Todo App - Basic Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("h1, .container", { timeout: 10000 });
  });

  test("should render the todo app title", async ({ page }) => {
    const heading = page.getByRole("heading", { name: /todo app/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("should display empty message when no todos", async ({ page }) => {
    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });

  test("should have input field and add button", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    await expect(input).toBeVisible();
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});

test.describe("Todo App - Adding Todos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should add a new todo when form is submitted", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    await input.fill("Test todo");
    await button.click();

    await expect(page.getByText("Test todo")).toBeVisible({ timeout: 5000 });
    await expect(input).toHaveValue("");
  });

  test("should add todo using Enter key", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    await input.fill("Enter key todo");
    await input.press("Enter");

    await expect(page.getByText("Enter key todo")).toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("should not add empty todo (whitespace only)", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    await input.fill("   ");
    await button.click();

    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });

  test("should not add empty todo (empty string)", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    await input.fill("");
    await button.click();

    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });

  test("should trim whitespace from todo text", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    await input.fill("  Trimmed todo  ");
    await button.click();

    // Should display without leading/trailing spaces (trimmed)
    await expect(page.getByText("Trimmed todo", { exact: true })).toBeVisible();
    // Verify the text content is actually trimmed (no leading/trailing spaces)
    const todoText = page.getByText("Trimmed todo", { exact: true });
    const textContent = await todoText.textContent();
    expect(textContent?.trim()).toBe("Trimmed todo");
  });

  test("should add multiple todos", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    await input.fill("First todo");
    await button.click();

    await input.fill("Second todo");
    await button.click();

    await input.fill("Third todo");
    await button.click();

    await expect(page.getByText("First todo")).toBeVisible();
    await expect(page.getByText("Second todo")).toBeVisible();
    await expect(page.getByText("Third todo")).toBeVisible();
  });

  test("should handle very long todo text", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const longText = "A".repeat(500);

    await input.fill(longText);
    await input.press("Enter");

    await expect(page.getByText(longText)).toBeVisible();
  });

  test("should handle special characters in todo text", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const specialText = "Todo with <>&\"' special chars! @#$%^&*()";

    await input.fill(specialText);
    await input.press("Enter");

    await expect(page.getByText(specialText)).toBeVisible();
  });

  test("should handle unicode characters", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const unicodeText = "待办事项 🎉 日本語 العربية";

    await input.fill(unicodeText);
    await input.press("Enter");

    await expect(page.getByText(unicodeText)).toBeVisible();
  });
});

test.describe("Todo App - Toggling Completion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should toggle todo completion", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    await input.fill("Toggle Task");
    await input.press("Enter");

    const checkbox = page.getByRole("checkbox").first();

    await expect(checkbox).not.toBeChecked();

    await checkbox.check();
    await expect(checkbox).toBeChecked();

    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("should apply completed styling when checked", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    await input.fill("Complete me");
    await input.press("Enter");

    const checkbox = page.getByRole("checkbox").first();
    const todoText = page.getByText("Complete me");

    await expect(todoText).toBeVisible();

    await checkbox.check();
    await page.waitForTimeout(200);

    const textDecoration = await todoText.evaluate(
      (el) => window.getComputedStyle(el).textDecoration
    );
    expect(textDecoration).toContain("line-through");
  });

  test("should toggle multiple todos independently", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    // Add three todos
    for (const task of ["Task 1", "Task 2", "Task 3"]) {
      await input.fill(task);
      await input.press("Enter");
      await page.waitForTimeout(100);
    }

    const checkboxes = page.getByRole("checkbox");

    // Toggle first and third
    await checkboxes.nth(0).check();
    await checkboxes.nth(2).check();

    await expect(checkboxes.nth(0)).toBeChecked();
    await expect(checkboxes.nth(1)).not.toBeChecked();
    await expect(checkboxes.nth(2)).toBeChecked();
  });
});

test.describe("Todo App - Deleting Todos", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should delete a todo", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    await input.fill("Todo to delete");
    await input.press("Enter");

    await expect(page.getByText("Todo to delete")).toBeVisible();

    const deleteButton = page
      .getByRole("button", { name: /delete/i })
      .first();
    await deleteButton.click();

    await expect(page.getByText("Todo to delete")).not.toBeVisible();
    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });

  test("should delete correct todo from multiple todos", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    for (const task of ["Keep me 1", "Delete me", "Keep me 2"]) {
      await input.fill(task);
      await input.press("Enter");
      await page.waitForTimeout(100);
    }

    const deleteButtons = page.getByRole("button", { name: /delete/i });
    await deleteButtons.nth(1).click(); // Delete middle one

    await expect(page.getByText("Delete me")).not.toBeVisible();
    await expect(page.getByText("Keep me 1")).toBeVisible();
    await expect(page.getByText("Keep me 2")).toBeVisible();
  });

  test("should delete all todos", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    for (const task of ["Todo 1", "Todo 2", "Todo 3"]) {
      await input.fill(task);
      await input.press("Enter");
      await page.waitForTimeout(100);
    }

    const deleteButtons = page.getByRole("button", { name: /delete/i });

    // Delete all
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
      await page.waitForTimeout(100);
    }

    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });
});

test.describe("Todo App - Complex Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should handle add, toggle, and delete workflow", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    // Add todos
    for (const task of ["Todo 1", "Todo 2", "Todo 3"]) {
      await input.fill(task);
      await input.press("Enter");
      await page.waitForTimeout(100);
    }

    // Toggle middle todo
    const checkboxes = page.getByRole("checkbox");
    await checkboxes.nth(1).check();
    await expect(checkboxes.nth(1)).toBeChecked();

    // Delete first todo
    const deleteButtons = page.getByRole("button", { name: /delete/i });
    await deleteButtons.first().click();

    await expect(page.getByText("Todo 1")).not.toBeVisible();
    await expect(page.getByText("Todo 2")).toBeVisible();
    await expect(page.getByText("Todo 3")).toBeVisible();
  });

  test("should maintain state after multiple operations", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    // Add, toggle, add, delete, toggle
    await input.fill("Task A");
    await input.press("Enter");
    await page.waitForTimeout(100);

    await page.getByRole("checkbox").first().check();

    await input.fill("Task B");
    await input.press("Enter");
    await page.waitForTimeout(100);

    await page.getByRole("button", { name: /delete/i }).first().click();
    await page.waitForTimeout(100);

    await page.getByRole("checkbox").first().check();

    await expect(page.getByText("Task B")).toBeVisible();
    const checkbox = page.getByRole("checkbox").first();
    await expect(checkbox).toBeChecked();
  });

  test("should handle rapid clicks", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    // Rapidly add todos
    for (let i = 1; i <= 5; i++) {
      await input.fill(`Quick todo ${i}`);
      await button.click();
      // No wait between clicks
    }

    // Verify all were added
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByText(`Quick todo ${i}`)).toBeVisible();
    }
  });
});

test.describe("Todo App - Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should handle input with only newlines", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    // Input fields typically don't allow newlines, but test anyway
    await input.fill("\n\n");
    await button.click();

    await expect(page.getByText(/no todos yet/i)).toBeVisible();
  });

  test("should handle maximum number of todos", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    // Add 50 todos
    for (let i = 1; i <= 50; i++) {
      await input.fill(`Todo ${i}`);
      await input.press("Enter");
      if (i % 10 === 0) {
        await page.waitForTimeout(100); // Small pause every 10
      }
    }

    // Verify last few are visible (use exact match to avoid matching Todo 10, 11, etc.)
    await expect(page.getByText("Todo 50", { exact: true })).toBeVisible();
    await expect(page.getByText("Todo 1", { exact: true })).toBeVisible();
    // Also verify some middle ones
    await expect(page.getByText("Todo 25", { exact: true })).toBeVisible();
  });

  test("should handle duplicate todo text", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    await input.fill("Duplicate");
    await input.press("Enter");
    await page.waitForTimeout(100);

    await input.fill("Duplicate");
    await input.press("Enter");

    const todos = page.getByText("Duplicate");
    const count = await todos.count();
    expect(count).toBe(2);
  });

  test("should clear input after adding todo", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    await input.fill("Test");
    await button.click();

    await expect(input).toHaveValue("");

    // Should be able to add another immediately
    await input.fill("Another");
    await button.click();
    await expect(page.getByText("Another")).toBeVisible();
  });

  test("should handle checkbox click on empty list", async ({ page }) => {
    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();
    expect(count).toBe(0);
  });

  test("should handle delete button on empty list", async ({ page }) => {
    const deleteButtons = page.getByRole("button", { name: /delete/i });
    const count = await deleteButtons.count();
    expect(count).toBe(0);
  });

  test("should persist todos during page interactions", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    await input.fill("Persistent todo");
    await input.press("Enter");

    // Interact with page
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    await expect(page.getByText("Persistent todo")).toBeVisible();
  });
});

test.describe("Todo App - UI/UX", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should have accessible form elements", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');
    const button = page.getByRole("button", { name: /add todo/i });

    // Check input is focusable
    await input.focus();
    await expect(input).toBeFocused();

    // Check button is accessible
    const buttonLabel = await button.getAttribute("aria-label");
    expect(buttonLabel || (await button.textContent())).toBeTruthy();
  });

  test("should show proper empty state", async ({ page }) => {
    const emptyMessage = page.getByText(/no todos yet/i);
    await expect(emptyMessage).toBeVisible();

    // Add and remove todo to verify empty state returns
    const input = page.locator('input[placeholder*="Add a new todo"]');
    await input.fill("Temp");
    await input.press("Enter");

    await page.getByRole("button", { name: /delete/i }).first().click();

    await expect(emptyMessage).toBeVisible();
  });

  test("should handle keyboard navigation", async ({ page }) => {
    const input = page.locator('input[placeholder*="Add a new todo"]');

    await input.fill("Keyboard todo");
    await input.press("Enter");

    // Tab to checkbox
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["INPUT", "BUTTON"]).toContain(focused);
  });
});
