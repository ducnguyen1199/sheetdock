"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { storage } from "@/lib/storage";
import { notifyPinnedSheetsChanged } from "@/components/app-sidebar";
import type { SpreadsheetSearchResult } from "@/lib/types";
import { Search, Pin, PinOff, FileSpreadsheet, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export default function SettingsPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedQuery = useDebounce(searchInput, 400);

  const { data: results, isLoading, error } = useQuery<SpreadsheetSearchResult[]>({
    queryKey: ["search-sheets", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/sheets/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Search failed");
      }
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const [, forceUpdate] = useState(0);

  const handlePin = useCallback((sheet: SpreadsheetSearchResult) => {
    storage.pinSheet({
      sheetId: sheet.id,
      sheetName: sheet.name,
      sheetUrl: sheet.url,
    });
    notifyPinnedSheetsChanged();
    forceUpdate((n) => n + 1);
    toast.success(`Pinned "${sheet.name}"`);
  }, []);

  const handleUnpin = useCallback((sheetId: string, name: string) => {
    storage.unpinSheet(sheetId);
    notifyPinnedSheetsChanged();
    forceUpdate((n) => n + 1);
    toast.success(`Unpinned "${name}"`);
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Search for Google Spreadsheets and pin them to your sidebar.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for a Google Spreadsheet..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}

      {results && results.length === 0 && (
        <div className="py-12 text-center">
          <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No spreadsheets found for &quot;{debouncedQuery}&quot;</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-2">
          {results.map((sheet) => {
            const pinned = storage.isPinned(sheet.id);
            return (
              <div
                key={sheet.id}
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{sheet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Modified {new Date(sheet.modifiedTime).toLocaleDateString()}
                  </p>
                </div>
                {pinned && (
                  <Badge variant="secondary" className="shrink-0">
                    Pinned
                  </Badge>
                )}
                <a
                  href={sheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                {pinned ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnpin(sheet.id, sheet.name)}
                    className="shrink-0 gap-1.5"
                  >
                    <PinOff className="h-3.5 w-3.5" />
                    Unpin
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handlePin(sheet)}
                    className="shrink-0 gap-1.5 bg-blue-600 hover:bg-blue-700"
                  >
                    <Pin className="h-3.5 w-3.5" />
                    Pin
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!debouncedQuery && (
        <div className="py-12 text-center">
          <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            Start typing to search your Google Spreadsheets
          </p>
        </div>
      )}
    </div>
  );
}
