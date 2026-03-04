"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, Pin } from "lucide-react";
import { useSyncExternalStore, useCallback } from "react";
import type { PinnedSheet } from "@/lib/types";

let listeners: (() => void)[] = [];
let cachedSheets: PinnedSheet[] | null = null;

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  if (cachedSheets === null) {
    cachedSheets = storage.getPinnedSheets();
  }
  return cachedSheets;
}

const EMPTY_SHEETS: PinnedSheet[] = [];

function getServerSnapshot() {
  return EMPTY_SHEETS;
}

export function notifyPinnedSheetsChanged() {
  cachedSheets = storage.getPinnedSheets();
  listeners.forEach((l) => l());
}

interface AppSidebarProps {
  open: boolean;
}

export function AppSidebar({ open }: AppSidebarProps) {
  const pathname = usePathname();
  const pinnedSheets = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const isActive = useCallback(
    (sheetId: string) => pathname === `/dashboard/sheet/${sheetId}`,
    [pathname]
  );

  if (!open) return null;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Pin className="h-3 w-3" />
        Pinned Sheets
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {pinnedSheets.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No pinned sheets</p>
            <Link
              href="/dashboard/settings"
              className="mt-1 text-xs text-blue-600 hover:underline"
            >
              Go to Settings to pin sheets
            </Link>
          </div>
        ) : (
          pinnedSheets
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((sheet) => (
              <Link
                key={sheet.sheetId}
                href={`/dashboard/sheet/${sheet.sheetId}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
                  isActive(sheet.sheetId) &&
                    "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                )}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-600" />
                <span className="truncate">{sheet.sheetName}</span>
              </Link>
            ))
        )}
      </nav>
    </aside>
  );
}
