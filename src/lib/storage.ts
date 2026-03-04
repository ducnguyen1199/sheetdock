import type { PinnedSheet, UserPreferences, SheetViewConfig } from "./types";

const PINNED_SHEETS_KEY = "sheetdock:pinned-sheets";
const PREFERENCES_KEY = "sheetdock:preferences";
const SHEET_CONFIG_PREFIX = "sheetdock:config:";

export const DEFAULT_SHEET_CONFIG: SheetViewConfig = {
  freezeColumns: 0,
  freezeRows: 0,
  enablePagination: true,
  pageSize: 50,
  cellMaxWidth: 300,
  cellMaxHeight: 200,
};

export const storage = {
  getPinnedSheets(): PinnedSheet[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(PINNED_SHEETS_KEY);
    return data ? JSON.parse(data) : [];
  },

  setPinnedSheets(sheets: PinnedSheet[]) {
    localStorage.setItem(PINNED_SHEETS_KEY, JSON.stringify(sheets));
  },

  pinSheet(sheet: Omit<PinnedSheet, "sortOrder" | "pinnedAt">) {
    const sheets = this.getPinnedSheets();
    if (sheets.some((s) => s.sheetId === sheet.sheetId)) return sheets;
    const newSheet: PinnedSheet = {
      ...sheet,
      sortOrder: sheets.length,
      pinnedAt: new Date().toISOString(),
    };
    const updated = [...sheets, newSheet];
    this.setPinnedSheets(updated);
    return updated;
  },

  unpinSheet(sheetId: string) {
    const sheets = this.getPinnedSheets();
    const updated = sheets
      .filter((s) => s.sheetId !== sheetId)
      .map((s, i) => ({ ...s, sortOrder: i }));
    this.setPinnedSheets(updated);
    return updated;
  },

  isPinned(sheetId: string): boolean {
    return this.getPinnedSheets().some((s) => s.sheetId === sheetId);
  },

  getPreferences(): UserPreferences {
    if (typeof window === "undefined") return { theme: "system" };
    const data = localStorage.getItem(PREFERENCES_KEY);
    return data ? JSON.parse(data) : { theme: "system" };
  },

  setPreferences(prefs: Partial<UserPreferences>) {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return updated;
  },

  getSheetConfig(sheetId: string, tabName: string): SheetViewConfig {
    if (typeof window === "undefined") return DEFAULT_SHEET_CONFIG;
    const key = `${SHEET_CONFIG_PREFIX}${sheetId}:${tabName}`;
    const data = localStorage.getItem(key);
    return data ? { ...DEFAULT_SHEET_CONFIG, ...JSON.parse(data) } : DEFAULT_SHEET_CONFIG;
  },

  setSheetConfig(sheetId: string, tabName: string, config: Partial<SheetViewConfig>) {
    const key = `${SHEET_CONFIG_PREFIX}${sheetId}:${tabName}`;
    const current = this.getSheetConfig(sheetId, tabName);
    const updated = { ...current, ...config };
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },
};
