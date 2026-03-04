"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Settings } from "lucide-react";
import { storage } from "@/lib/storage";
import { useEffect, useState } from "react";
import type { PinnedSheet } from "@/lib/types";

export default function DashboardPage() {
  const [pinnedSheets, setPinnedSheets] = useState<PinnedSheet[]>([]);

  useEffect(() => {
    setPinnedSheets(storage.getPinnedSheets());
  }, []);

  if (pinnedSheets.length > 0) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
        <p className="mb-6 text-muted-foreground">
          Select a sheet from the sidebar to get started.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pinnedSheets.map((sheet) => (
            <Link
              key={sheet.sheetId}
              href={`/dashboard/sheet/${sheet.sheetId}`}
              className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <FileSpreadsheet className="h-8 w-8 shrink-0 text-green-600" />
              <div className="min-w-0">
                <p className="truncate font-medium">{sheet.sheetName}</p>
                <p className="text-xs text-muted-foreground">
                  Pinned {new Date(sheet.pinnedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950">
        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
      </div>
      <h1 className="text-2xl font-bold">Welcome to SheetDock</h1>
      <p className="max-w-md text-muted-foreground">
        Get started by pinning your first Google Sheet. Go to Settings to search
        and pin sheets to your sidebar.
      </p>
      <Link href="/dashboard/settings">
        <Button className="gap-2">
          <Settings className="h-4 w-4" />
          Go to Settings
        </Button>
      </Link>
    </div>
  );
}
