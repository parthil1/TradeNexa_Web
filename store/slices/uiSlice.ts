import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const SIDEBAR_STORAGE_KEY = "tradenexa_sidebar_collapsed";

export interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
}

function readStoredSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
};

/**
 * Portal chrome state. Sidebar collapse lives here (rather than in PortalShell
 * local state) so it survives navigation between buyer/seller pages.
 */
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /** Called once on mount — localStorage is unavailable during SSR. */
    hydrateSidebarFromStorage(state) {
      state.sidebarCollapsed = readStoredSidebarCollapsed();
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(SIDEBAR_STORAGE_KEY, action.payload ? "1" : "0");
        } catch {
          /* private mode — collapse simply won't persist */
        }
      }
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
  },
});

export const { hydrateSidebarFromStorage, setSidebarCollapsed, setMobileNavOpen } =
  uiSlice.actions;

export default uiSlice.reducer;
