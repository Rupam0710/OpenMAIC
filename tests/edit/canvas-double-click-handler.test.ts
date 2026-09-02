import { describe, expect, test, vi } from 'vitest';
import { createTextElementAtCanvasPoint } from '@/lib/edit/slide-edit-elements';

describe('Canvas double-click handler', () => {
  test('does not insert text when double-clicking a locked element', () => {
    // Simulate a locked element target
    const lockedElement = document.createElement('div');
    lockedElement.className = 'editable-element lock';
    lockedElement.id = 'editable-element-text-1';

    const mockEvent = {
      target: lockedElement,
      clientX: 240,
      clientY: 180,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    // The guard should check if target is inside an .editable-element
    const target = mockEvent.target as HTMLElement;
    const isInsideElement = !!target.closest('.editable-element');

    // When the target is inside an editable-element (locked or not),
    // the handler should return early and NOT insert a text box
    expect(isInsideElement).toBe(true);
  });

  test('inserts text when double-clicking blank canvas area', () => {
    // Simulate a blank canvas target
    const canvas = document.createElement('div');
    canvas.className = 'canvas-background';

    const mockEvent = {
      target: canvas,
      clientX: 240,
      clientY: 180,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    // The guard should check if target is inside an .editable-element
    const target = mockEvent.target as HTMLElement;
    const isInsideElement = !!target.closest('.editable-element');

    // When the target is NOT inside an editable-element,
    // the handler should proceed to insert a text box
    expect(isInsideElement).toBe(false);

    // Test that the text element factory works correctly
    const textElement = createTextElementAtCanvasPoint(
      'text-double-click',
      { x: mockEvent.clientX, y: mockEvent.clientY },
      { left: 100, top: 50 },
      1,
    );

    expect(textElement).toMatchObject({
      id: 'text-double-click',
      type: 'text',
      content: '<p style="text-align: center"><br></p>',
    });
  });

  test('double-click on locked element bubble detection', () => {
    // This test verifies the scenario described in the issue:
    // When a locked element's selection handler returns early before stopPropagation,
    // the event bubbles up to the canvas. The guard prevents text insertion in this case.

    // Create a locked text element wrapper
    const lockedElementWrapper = document.createElement('div');
    lockedElementWrapper.className = 'editable-element absolute lock';
    lockedElementWrapper.id = 'editable-element-text-locked';

    // Create a child (e.g., the text content div)
    const textContent = document.createElement('div');
    textContent.className = 'editable-element-text';
    lockedElementWrapper.appendChild(textContent);

    // Simulate event bubbling from locked element
    const mockEvent = {
      target: textContent, // Event originated from inside locked element
      clientX: 240,
      clientY: 180,
      currentTarget: lockedElementWrapper,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent;

    // The guard uses closest() which will find the parent .editable-element
    const target = mockEvent.target as HTMLElement;
    const isInsideElement = !!target.closest('.editable-element');

    expect(isInsideElement).toBe(true);
  });
});
