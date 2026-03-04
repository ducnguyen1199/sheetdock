"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Columns3, Rows3, LayoutGrid, Maximize2 } from "lucide-react";
import { useState, useEffect } from "react";
import type { SheetViewConfig } from "@/lib/types";

interface SheetConfigDialogProps {
  open: boolean;
  onClose: () => void;
  config: SheetViewConfig;
  onSave: (config: SheetViewConfig) => void;
  maxColumns: number;
  maxRows: number;
}

export function SheetConfigDialog({
  open,
  onClose,
  config,
  onSave,
  maxColumns,
  maxRows,
}: SheetConfigDialogProps) {
  const [draft, setDraft] = useState<SheetViewConfig>(config);

  useEffect(() => {
    if (open) setDraft(config);
  }, [open, config]);

  const update = (patch: Partial<SheetViewConfig>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>View Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Columns3 className="h-4 w-4 text-muted-foreground" />
              Freeze Columns
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={maxColumns}
                value={draft.freezeColumns}
                onChange={(e) =>
                  update({
                    freezeColumns: Math.max(
                      0,
                      Math.min(maxColumns, parseInt(e.target.value) || 0),
                    ),
                  })
                }
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">
                of {maxColumns} columns
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Rows3 className="h-4 w-4 text-muted-foreground" />
              Freeze Rows
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={maxRows}
                value={draft.freezeRows}
                onChange={(e) =>
                  update({
                    freezeRows: Math.max(
                      0,
                      Math.min(maxRows, parseInt(e.target.value) || 0),
                    ),
                  })
                }
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">
                of {maxRows} rows (data rows)
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              Pagination
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.enablePagination}
                  onChange={(e) =>
                    update({ enablePagination: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Enable pagination</span>
              </label>
            </div>
            {draft.enablePagination && (
              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground">
                  Rows per page
                </Label>
                <Input
                  type="number"
                  min={10}
                  max={500}
                  value={draft.pageSize}
                  onChange={(e) =>
                    update({
                      pageSize: Math.max(
                        10,
                        Math.min(500, parseInt(e.target.value) || 50),
                      ),
                    })
                  }
                  className="w-24"
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
              Cell Max Size
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Max Width (px)
                </Label>
                <Input
                  type="number"
                  min={50}
                  max={1000}
                  value={draft.cellMaxWidth}
                  onChange={(e) => update({ cellMaxWidth: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Max Height (px)
                </Label>
                <Input
                  type="number"
                  min={20}
                  max={500}
                  value={draft.cellMaxHeight}
                  onChange={(e) =>
                    update({ cellMaxHeight: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
