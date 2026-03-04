import { NextRequest, NextResponse } from "next/server";
import { searchSpreadsheets } from "@/lib/google";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const results = await searchSpreadsheets(query);
    return NextResponse.json(results);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to search sheets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
