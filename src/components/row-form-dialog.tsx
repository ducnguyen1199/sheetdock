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
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface RowFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: string[]) => Promise<void>;
  headers: string[];
  initialValues?: string[];
  mode: "add" | "edit";
}

export function RowFormDialog({
  open,
  onClose,
  onSubmit,
  headers,
  initialValues,
  mode,
}: RowFormDialogProps) {
  const [values, setValues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(headers.map((_, i) => initialValues?.[i] ?? ""));
    }
  }, [open, headers, initialValues]);

  const handleChange = (index: number, value: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Row" : "Edit Row"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {headers.map((header, i) => (
            <div key={i} className="space-y-1.5">
              <Label htmlFor={`field-${i}`}>{header}</Label>
              <Input
                id={`field-${i}`}
                value={values[i] ?? ""}
                onChange={(e) => handleChange(i, e.target.value)}
              />
            </div>
          ))}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "add" ? "Add Row" : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
