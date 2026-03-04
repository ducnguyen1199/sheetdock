import { google } from "googleapis";
import { auth } from "./auth";
import { headers } from "next/headers";
import type { SheetTab, SheetData, CellData, SpreadsheetSearchResult } from "./types";

async function getOAuth2Client() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error("Not authenticated");

  const ctx = await auth.$context;
  const accounts = await ctx.internalAdapter.findAccounts(session.user.id);
  const googleAccount = accounts.find((a) => a.providerId === "google");

  if (!googleAccount?.accessToken) throw new Error("Google account not linked");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: googleAccount.accessToken,
    refresh_token: googleAccount.refreshToken,
  });

  return oauth2Client;
}

export async function searchSpreadsheets(
  query: string
): Promise<SpreadsheetSearchResult[]> {
  const oauth2Client = await getOAuth2Client();
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.spreadsheet' and name contains '${query.replace(/'/g, "\\'")}'`,
    fields: "files(id, name, webViewLink, modifiedTime)",
    pageSize: 20,
    orderBy: "modifiedTime desc",
  });

  return (res.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    url: f.webViewLink!,
    modifiedTime: f.modifiedTime!,
  }));
}

export async function getSheetTabs(
  spreadsheetId: string
): Promise<SheetTab[]> {
  const oauth2Client = await getOAuth2Client();
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });

  return (res.data.sheets || []).map((s) => ({
    sheetId: s.properties!.sheetId!,
    title: s.properties!.title!,
    index: s.properties!.index!,
  }));
}

function rgbaToCSS(color?: { red?: number | null; green?: number | null; blue?: number | null; alpha?: number | null }): string | undefined {
  if (!color) return undefined;
  const r = Math.round((color.red ?? 0) * 255);
  const g = Math.round((color.green ?? 0) * 255);
  const b = Math.round((color.blue ?? 0) * 255);
  if (r === 255 && g === 255 && b === 255) return undefined;
  if (r === 0 && g === 0 && b === 0) return undefined;
  return `rgb(${r}, ${g}, ${b})`;
}

type RawCell = {
  formattedValue?: string | null;
  userEnteredValue?: { formulaValue?: string | null; stringValue?: string | null } | null;
  effectiveFormat?: { backgroundColor?: object; textFormat?: { foregroundColor?: object } };
};

function extractImageUrl(cell?: RawCell): string | undefined {
  const formula = cell?.userEnteredValue?.formulaValue;
  if (!formula) return undefined;
  const match = formula.match(/=IMAGE\(\s*"([^"]+)"/i);
  return match?.[1];
}

function extractCellData(cell?: RawCell): CellData {
  const value = cell?.formattedValue ?? "";
  const fmt = cell?.effectiveFormat;
  type Color = { red?: number | null; green?: number | null; blue?: number | null; alpha?: number | null };
  const bgColor = rgbaToCSS(fmt?.backgroundColor as Color | undefined);
  const textColor = rgbaToCSS(fmt?.textFormat?.foregroundColor as Color | undefined);
  const imageUrl = extractImageUrl(cell);
  return { value, bgColor, textColor, imageUrl };
}

export async function getSheetData(
  spreadsheetId: string,
  sheetTitle: string,
  page: number = 1,
  pageSize: number = 50
): Promise<SheetData> {
  const oauth2Client = await getOAuth2Client();
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: [`'${sheetTitle}'`],
    includeGridData: true,
    fields: "sheets.data.rowData.values(formattedValue,userEnteredValue.formulaValue,effectiveFormat.backgroundColor,effectiveFormat.textFormat.foregroundColor),sheets.data.columnMetadata.pixelSize,sheets.data.rowMetadata.pixelSize",
  });

  const gridData = res.data.sheets?.[0]?.data?.[0];
  const allRowData = gridData?.rowData || [];

  const headerRow = allRowData[0]?.values || [];
  const headers: CellData[] = headerRow.map((cell) => extractCellData(cell));
  const colCount = headers.length;

  const columnMeta = gridData?.columnMetadata || [];
  const columnWidths = columnMeta.slice(0, colCount).map((c) => c.pixelSize ?? 100);

  const allRowMeta = gridData?.rowMetadata || [];
  const dataRowData = allRowData.slice(1);
  const totalRows = dataRowData.length;

  const startIdx = (page - 1) * pageSize;
  const paginatedRowData = dataRowData.slice(startIdx, startIdx + pageSize);
  const paginatedRowMeta = allRowMeta.slice(startIdx + 1, startIdx + 1 + pageSize);

  const rowHeights = paginatedRowMeta.map((r) => r.pixelSize ?? 21);

  const rows: CellData[][] = paginatedRowData.map((row) => {
    const cells = row.values || [];
    const rowCells: CellData[] = [];
    for (let i = 0; i < colCount; i++) {
      rowCells.push(extractCellData(cells[i]));
    }
    return rowCells;
  });

  return { headers, rows, totalRows, columnWidths, rowHeights };
}

export async function appendRow(
  spreadsheetId: string,
  sheetTitle: string,
  values: string[]
) {
  const oauth2Client = await getOAuth2Client();
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${sheetTitle}'!A:A`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function updateRow(
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number,
  values: string[]
) {
  const oauth2Client = await getOAuth2Client();
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const range = `'${sheetTitle}'!A${rowIndex + 2}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

export async function deleteRow(
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number
) {
  const oauth2Client = await getOAuth2Client();
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const tabsRes = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  });

  const tab = tabsRes.data.sheets?.find(
    (s) => s.properties?.title === sheetTitle
  );
  if (!tab) throw new Error(`Sheet "${sheetTitle}" not found`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: tab.properties!.sheetId!,
              dimension: "ROWS",
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });
}
