import { NextRequest, NextResponse } from "next/server";
import { getSheetTabs, getSheetData } from "@/lib/google";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sheetTitle = req.nextUrl.searchParams.get("sheet");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "50");

  try {
    if (!sheetTitle) {
      const tabs = await getSheetTabs(id);
      return NextResponse.json({ tabs });
    }

    const data = await getSheetData(id, sheetTitle, page, pageSize);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch sheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
