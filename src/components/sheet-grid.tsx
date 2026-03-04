"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { SheetData, SheetViewConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SheetGridProps {
  data: SheetData | undefined;
  isLoading: boolean;
  page: number;
  config: SheetViewConfig;
  onPageChange: (page: number) => void;
  onEditRow: (rowIndex: number, values: string[]) => void;
  onDeleteRow: (rowIndex: number) => void;
}

export function SheetGrid({
  data,
  isLoading,
  page,
  config,
  onPageChange,
  onEditRow,
  onDeleteRow,
}: SheetGridProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { freezeColumns, freezeRows, enablePagination, cellMaxWidth, cellMaxHeight } = config;
  const pageSize = config.pageSize;
  const totalPages = enablePagination ? Math.ceil(data.totalRows / pageSize) : 1;
  const startRow = enablePagination ? (page - 1) * pageSize : 0;
  const displayRows = enablePagination ? data.rows : data.rows;

  const actionsColWidth = 80;

  function getFrozenColLeft(colIdx: number): number {
    let left = actionsColWidth;
    for (let i = 0; i < colIdx; i++) {
      left += Math.min(data!.columnWidths[i] || 100, cellMaxWidth);
    }
    return left;
  }

  const frozenColStyle = (colIdx: number): React.CSSProperties =>
    colIdx < freezeColumns
      ? {
          position: "sticky",
          left: getFrozenColLeft(colIdx),
          zIndex: 2,
        }
      : {};

  const actionsSticky: React.CSSProperties = {
    position: "sticky",
    left: 0,
    zIndex: 2,
  };

  return (
    <div>
      <div className="overflow-auto border-b">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-20 text-center bg-background border-r"
                style={actionsSticky}
              >
                Actions
              </TableHead>
              {data.headers.map((header, i) => (
                <TableHead
                  key={i}
                  className={cn(i < freezeColumns && "bg-background", "truncate")}
                  style={{
                    width: Math.min(data.columnWidths[i], cellMaxWidth),
                    minWidth: Math.min(data.columnWidths[i], cellMaxWidth),
                    maxWidth: cellMaxWidth,
                    backgroundColor: header.bgColor,
                    color: header.textColor,
                    ...frozenColStyle(i),
                  }}
                >
                  {header.value}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={data.headers.length + 1}
                  className="h-32 text-center text-muted-foreground"
                >
                  No data
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, rowIdx) => {
                const isFrozenRow = rowIdx < freezeRows;
                const rowHeight = Math.min(
                  data.rowHeights[rowIdx] || 21,
                  cellMaxHeight,
                );

                return (
                  <TableRow
                    key={rowIdx}
                    className={cn("group", isFrozenRow && "bg-muted/30")}
                    style={{
                      height: rowHeight,
                      ...(isFrozenRow
                        ? {
                            position: "sticky",
                            top: 40 + rowIdx * rowHeight,
                            zIndex: 1,
                          }
                        : {}),
                    }}
                  >
                    <TableCell
                      className={cn(
                        "text-center bg-background border-r",
                        isFrozenRow && "bg-muted/30",
                      )}
                      style={actionsSticky}
                    >
                      <div className="flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            onEditRow(
                              startRow + rowIdx,
                              row.map((c) => c.value),
                            )
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDeleteRow(startRow + rowIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    {row.map((cell, cellIdx) => (
                      <TableCell
                        key={cellIdx}
                        className={cn(
                          "truncate",
                          cellIdx < freezeColumns && "bg-background",
                        )}
                        style={{
                          maxWidth: cellMaxWidth,
                          maxHeight: cellMaxHeight,
                          overflow: "hidden",
                          backgroundColor: cell.bgColor,
                          color: cell.textColor,
                          ...frozenColStyle(cellIdx),
                        }}
                      >
                        {cell.imageUrl ? (
                          <img
                            src={cell.imageUrl}
                            alt=""
                            className="rounded object-contain"
                            style={{
                              maxHeight: rowHeight - 8,
                              maxWidth:
                                Math.min(
                                  data.columnWidths[cellIdx],
                                  cellMaxWidth,
                                ) - 16,
                            }}
                            loading="lazy"
                          />
                        ) : (
                          cell.value
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {startRow + 1}–
            {Math.min(startRow + pageSize, data.totalRows)} of {data.totalRows}{" "}
            rows
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
