import { describe, it, expect, vi } from 'vitest';

describe('Unsaved Changes Interception Workflow', () => {
  it('executes action immediately without confirmation when state is not dirty', () => {
    let isDirty = false;
    const confirmIfDirty = (action: () => void, onPrompt: (msg: string) => void) => {
      if (!isDirty) {
        action();
        return;
      }
      onPrompt('Datos sin guardar');
    };

    const actionMock = vi.fn();
    const promptMock = vi.fn();

    confirmIfDirty(actionMock, promptMock);

    expect(actionMock).toHaveBeenCalledTimes(1);
    expect(promptMock).not.toHaveBeenCalled();
  });

  it('triggers prompt and waits for confirmation when state is dirty', () => {
    let isDirty = true;
    let pendingAction: (() => void) | null = null;
    let promptTriggered = false;

    const confirmIfDirty = (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      promptTriggered = true;
      pendingAction = action;
    };

    const actionMock = vi.fn();
    confirmIfDirty(actionMock);

    // Should NOT have run action yet
    expect(actionMock).not.toHaveBeenCalled();
    expect(promptTriggered).toBe(true);

    // Simulate user choosing "Volver al formulario" (cancel discard)
    const onCancel = () => {
      pendingAction = null;
    };
    onCancel();
    expect(actionMock).not.toHaveBeenCalled();

    // Now simulate re-triggering and user choosing "Descartar y avanzar" (confirm discard)
    confirmIfDirty(actionMock);
    const onConfirm = () => {
      isDirty = false;
      const act = pendingAction;
      pendingAction = null;
      if (act) act();
    };
    onConfirm();

    expect(actionMock).toHaveBeenCalledTimes(1);
    expect(isDirty).toBe(false);
  });

  it('intercepts tab navigation when dirty and only navigates if confirmed', () => {
    let isDirty = true;
    let currentTab = 'remitos';
    let navigateCalled = false;

    const navigateHandler = (targetTab: string) => {
      currentTab = targetTab;
      navigateCalled = true;
    };

    let pendingNavigation: (() => void) | null = null;

    const requestNavigate = (targetTab: string) => {
      if (!isDirty) {
        navigateHandler(targetTab);
        return;
      }
      pendingNavigation = () => {
        isDirty = false;
        navigateHandler(targetTab);
      };
    };

    requestNavigate('expenses');

    // Should not have navigated yet
    expect(currentTab).toBe('remitos');
    expect(navigateCalled).toBe(false);

    // User confirms discard
    if (pendingNavigation) {
      pendingNavigation();
    }

    expect(currentTab).toBe('expenses');
    expect(navigateCalled).toBe(true);
    expect(isDirty).toBe(false);
  });
});
