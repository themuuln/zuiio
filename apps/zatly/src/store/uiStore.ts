import { create } from "zustand";

export type WorkspaceTab =
  | "home"
  | "contacts"
  | "automation"
  | "inbox"
  | "broadcasts"
  | "settings";

export type AutomationView = "list" | "builder";

interface UiState {
  activeTab: WorkspaceTab;
  automationView: AutomationView;
  activeAutomationId: string | null;
  activeAutomationName: string;
  previewMode: boolean;
  buttonFocusRequest: { nodeId: string; buttonId: string; key: number } | null;
  setActiveTab: (tab: WorkspaceTab) => void;
  openAutomationBuilder: (automation: { id: string; name: string }) => void;
  backToAutomationList: () => void;
  togglePreviewMode: () => void;
  requestButtonFocus: (nodeId: string, buttonId: string) => void;
  clearButtonFocusRequest: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: "automation",
  automationView: "list",
  activeAutomationId: null,
  activeAutomationName: "Main Flow",
  previewMode: false,
  buttonFocusRequest: null,
  setActiveTab: (tab) =>
    set((state) => ({
      activeTab: tab,
      automationView:
        tab === "automation" ? state.automationView : "list",
    })),
  openAutomationBuilder: (automation) =>
    set({
      activeTab: "automation",
      automationView: "builder",
      activeAutomationId: automation.id,
      activeAutomationName: automation.name,
    }),
  backToAutomationList: () =>
    set({
      automationView: "list",
    }),
  togglePreviewMode: () => set((state) => ({ previewMode: !state.previewMode })),
  requestButtonFocus: (nodeId, buttonId) =>
    set({
      buttonFocusRequest: {
        nodeId,
        buttonId,
        key: Date.now(),
      },
    }),
  clearButtonFocusRequest: () => set({ buttonFocusRequest: null }),
}));
