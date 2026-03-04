export interface PinnedSheet {
  sheetId: string;
  sheetName: string;
  sheetUrl: string;
  sortOrder: number;
  pinnedAt: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
}

export interface SheetTab {
  sheetId: number;
  title: string;
  index: number;
}

export interface CellData {
  value: string;
  bgColor?: string;
  textColor?: string;
  imageUrl?: string;
}

export interface SheetData {
  headers: CellData[];
  rows: CellData[][];
  totalRows: number;
  columnWidths: number[];
  rowHeights: number[];
}

export interface SpreadsheetSearchResult {
  id: string;
  name: string;
  url: string;
  modifiedTime: string;
}

export interface SheetViewConfig {
  freezeColumns: number;
  freezeRows: number;
  enablePagination: boolean;
  pageSize: number;
  cellMaxWidth: number;
  cellMaxHeight: number;
}
