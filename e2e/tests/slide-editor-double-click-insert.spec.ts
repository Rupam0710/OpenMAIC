import { test, expect } from '../fixtures/base';
import { HomePage } from '../pages/home.page';
import { GenerationPreviewPage } from '../pages/generation-preview.page';
import { ClassroomPage } from '../pages/classroom.page';
import { createSettingsStorage } from '../fixtures/test-data/settings';

const SETTINGS_STORAGE = createSettingsStorage({ sidebarCollapsed: false });

/**
 * Double-click text insertion on slide canvas (#1310).
 * Verifies that double-clicking on blank canvas area creates a new text element
 * and that double-clicking existing elements does NOT insert a duplicate text element.
 */
test.describe('Slide editor double-click text insertion (#1310)', () => {
  test.beforeEach(async ({ page, mockApi }) => {
    await page.addInitScript((settings) => {
      localStorage.setItem('maic:account:settings-storage', settings);
    }, SETTINGS_STORAGE);
    await mockApi.setupGenerationMocks();
  });

  test('double-click on blank canvas area creates a new text element', async ({ page }) => {
    // Generate a classroom through the mocked pipeline
    const home = new HomePage(page);
    await home.goto();
    // Dismiss the "What's New" changelog modal
    await page
      .getByRole('button', { name: /got it|知道了/i })
      .click({ timeout: 5_000 })
      .catch(() => {});
    await home.fillRequirement('Test Canvas Double Click');
    await home.submit();
    await page.waitForURL(/\/generation-preview/);

    const preview = new GenerationPreviewPage(page);
    await preview.waitForRedirectToClassroom();

    const classroom = new ClassroomPage(page);
    await classroom.waitForLoaded();
    await expect(classroom.sidebarScenes.first()).toBeVisible({ timeout: 10_000 });

    // Enter Pro edit mode
    await page.getByRole('switch').click();
    await expect(page.getByTestId('slide-nav-rail')).toBeVisible({ timeout: 10_000 });

    // Open slide editor by clicking on first scene
    await classroom.clickScene(0);
    await page.waitForTimeout(500); // Wait for slide editor to render

    // Get the canvas viewport
    const canvas = page.locator('[data-testid="canvas-viewport"], .canvas-viewport, [class*="canvas"]').first();
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // Get initial count of editable elements
    const initialElementCount = await page.locator('.editable-element').count();

    // Double-click on blank canvas area (roughly center, but avoiding existing elements)
    const boundingBox = await canvas.boundingBox();
    if (!boundingBox) throw new Error('Canvas bounding box not found');

    const clickX = boundingBox.x + boundingBox.width * 0.7;
    const clickY = boundingBox.y + boundingBox.height * 0.7;

    await page.mouse.dblclick(clickX, clickY);
    await page.waitForTimeout(300); // Wait for text element creation

    // Verify a new text element was created
    const newElementCount = await page.locator('.editable-element').count();
    expect(newElementCount).toBe(initialElementCount + 1);

    // Verify the new text element is visible and appears to be selected (has focus or indicator)
    const newTextElement = page.locator('.editable-element-text').last();
    await expect(newTextElement).toBeVisible();

    // Verify element contains the default empty text content
    const content = await newTextElement.evaluate((el) => el.innerHTML);
    expect(content).toBeTruthy(); // Should have some content (even if just whitespace)
  });

  test('double-click on existing element does NOT insert a new text element', async ({ page }) => {
    // Generate a classroom through the mocked pipeline
    const home = new HomePage(page);
    await home.goto();
    // Dismiss the "What's New" changelog modal
    await page
      .getByRole('button', { name: /got it|知道了/i })
      .click({ timeout: 5_000 })
      .catch(() => {});
    await home.fillRequirement('Test Canvas Element Double Click');
    await home.submit();
    await page.waitForURL(/\/generation-preview/);

    const preview = new GenerationPreviewPage(page);
    await preview.waitForRedirectToClassroom();

    const classroom = new ClassroomPage(page);
    await classroom.waitForLoaded();
    await expect(classroom.sidebarScenes.first()).toBeVisible({ timeout: 10_000 });

    // Enter Pro edit mode
    await page.getByRole('switch').click();
    await expect(page.getByTestId('slide-nav-rail')).toBeVisible({ timeout: 10_000 });

    // Open slide editor by clicking on first scene
    await classroom.clickScene(0);
    await page.waitForTimeout(500); // Wait for slide editor to render

    // Wait for at least one editable element to be present (existing slide content)
    const existingElement = page.locator('.editable-element').first();
    await expect(existingElement).toBeVisible({ timeout: 10_000 });

    // Get initial count of editable elements
    const initialElementCount = await page.locator('.editable-element').count();

    // Double-click on an existing element
    await existingElement.dblclick();
    await page.waitForTimeout(300); // Wait for any potential element creation

    // Verify NO new element was created (count should remain the same)
    const newElementCount = await page.locator('.editable-element').count();
    expect(newElementCount).toBe(initialElementCount);
  });
});
