import { NextRequest, NextResponse } from "next/server";
import { appendRow, updateRow, deleteRow } from "@/lib/google";

type RouteParams = { params: Promise<{ id: string; sheetName: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id, sheetName } = await params;
  const { values } = await req.json();

  try {
    await appendRow(id, decodeURIComponent(sheetName), values);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to add row";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id, sheetName } = await params;
  const { rowIndex, values } = await req.json();

  try {
    await updateRow(id, decodeURIComponent(sheetName), rowIndex, values);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update row";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id, sheetName } = await params;
  const { rowIndex } = await req.json();

  try {
    await deleteRow(id, decodeURIComponent(sheetName), rowIndex);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete row";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
