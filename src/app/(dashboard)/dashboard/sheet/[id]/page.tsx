"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SheetGrid } from "@/components/sheet-grid";
import { RowFormDialog } from "@/components/row-form-dialog";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { SheetConfigDialog } from "@/components/sheet-config-dialog";
import { Plus, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { storage, DEFAULT_SHEET_CONFIG } from "@/lib/storage";
import type { SheetTab, SheetData, SheetViewConfig } from "@/lib/types";

export default function SheetViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [config, setConfig] = useState<SheetViewConfig>(DEFAULT_SHEET_CONFIG);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    rowIndex: number;
    values: string[];
  }>({ open: false, rowIndex: 0, values: [] });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    rowIndex: number;
  }>({ open: false, rowIndex: 0 });

  const { data: tabs, isLoading: tabsLoading } = useQuery<SheetTab[]>({
    queryKey: ["sheet-tabs", id],
    queryFn: async () => {
      const res = await fetch(`/api/sheets/${id}`);
      if (!res.ok) throw new Error("Failed to load sheet tabs");
      const data = await res.json();
      return data.tabs;
    },
  });

  const currentTab = activeTab || tabs?.[0]?.title || null;

  useEffect(() => {
    if (currentTab) {
      setConfig(storage.getSheetConfig(id, currentTab));
    }
  }, [id, currentTab]);

  const pageSize = config.enablePagination ? config.pageSize : 10000;

  const {
    data: sheetData,
    isLoading: dataLoading,
    isFetching,
  } = useQuery<SheetData>({
    queryKey: ["sheet-data", id, currentTab, page, pageSize],
    queryFn: async () => {
      const res = await fetch(
        `/api/sheets/${id}?sheet=${encodeURIComponent(currentTab!)}&page=${page}&pageSize=${pageSize}`
      );
      if (!res.ok) throw new Error("Failed to load sheet data");
      return res.json();
    },
    enabled: !!currentTab,
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    setConfig(storage.getSheetConfig(id, tab));
  };

  const refreshData = () => {
    queryClient.invalidateQueries({
      queryKey: ["sheet-data", id, currentTab],
    });
  };

  const handleConfigSave = (newConfig: SheetViewConfig) => {
    if (!currentTab) return;
    storage.setSheetConfig(id, currentTab, newConfig);
    setConfig(newConfig);
    setPage(1);
    toast.success("Configuration saved");
    queryClient.invalidateQueries({
      queryKey: ["sheet-data", id, currentTab],
    });
  };

  const handleAddRow = async (values: string[]) => {
    const res = await fetch(
      `/api/sheets/${id}/${encodeURIComponent(currentTab!)}/rows`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to add row");
    }
    toast.success("Row added successfully");
    setAddDialogOpen(false);
    refreshData();
  };

  const handleEditRow = async (values: string[]) => {
    const res = await fetch(
      `/api/sheets/${id}/${encodeURIComponent(currentTab!)}/rows`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: editDialog.rowIndex, values }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update row");
    }
    toast.success("Row updated successfully");
    setEditDialog({ open: false, rowIndex: 0, values: [] });
    refreshData();
  };

  const handleDeleteRow = async () => {
    const res = await fetch(
      `/api/sheets/${id}/${encodeURIComponent(currentTab!)}/rows`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex: deleteDialog.rowIndex }),
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete row");
    }
    toast.success("Row deleted successfully");
    setDeleteDialog({ open: false, rowIndex: 0 });
    refreshData();
  };

  return (
    <div className="flex h-full flex-col">
      {tabsLoading ? (
        <div className="flex gap-2 border-b px-4 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
      ) : tabs && tabs.length > 0 ? (
        <div className="border-b">
          <Tabs
            value={currentTab || ""}
            onValueChange={handleTabChange}
            className="px-4"
          >
            <TabsList className="h-10 bg-transparent p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.sheetId}
                  value={tab.title}
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Button
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          disabled={!sheetData}
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfigDialogOpen(true)}
          className="gap-1.5"
        >
          <Settings2 className="h-4 w-4" />
          Config
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isFetching}
          className="gap-1.5"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
        {sheetData && (
          <span className="ml-auto text-xs text-muted-foreground">
            {sheetData.totalRows} rows
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <SheetGrid
          data={sheetData}
          isLoading={dataLoading}
          page={page}
          config={config}
          onPageChange={setPage}
          onEditRow={(rowIndex, values) =>
            setEditDialog({ open: true, rowIndex, values })
          }
          onDeleteRow={(rowIndex) =>
            setDeleteDialog({ open: true, rowIndex })
          }
        />
      </div>

      <SheetConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        config={config}
        onSave={handleConfigSave}
        maxColumns={sheetData?.headers.length ?? 0}
        maxRows={sheetData?.totalRows ?? 0}
      />

      {sheetData && (
        <>
          <RowFormDialog
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            onSubmit={handleAddRow}
            headers={sheetData.headers.map((h) => h.value)}
            mode="add"
          />
          <RowFormDialog
            open={editDialog.open}
            onClose={() =>
              setEditDialog({ open: false, rowIndex: 0, values: [] })
            }
            onSubmit={handleEditRow}
            headers={sheetData.headers.map((h) => h.value)}
            initialValues={editDialog.values}
            mode="edit"
          />
          <DeleteConfirmDialog
            open={deleteDialog.open}
            onClose={() => setDeleteDialog({ open: false, rowIndex: 0 })}
            onConfirm={handleDeleteRow}
          />
        </>
      )}
    </div>
  );
}
