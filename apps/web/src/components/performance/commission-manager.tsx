"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthPicker } from "@/components/ui/month-picker";
import { Plus, Edit2, Trash2, DollarSign } from "lucide-react";
import { useCommissions, type CommissionEntry, type CommissionMutation } from "@/lib/performance/hooks";

export function CommissionManager() {
  const { commissions, createCommission, updateCommission, deleteCommission, isLoading, error } =
    useCommissions();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  );

  const filteredCommissions = commissions?.filter((item) => {
    const closedDate = new Date(item.closedDate);
    const [year, month] = filterMonth.split("-");
    return (
      closedDate.getFullYear() === parseInt(year) &&
      closedDate.getMonth() + 1 === parseInt(month)
    );
  });

  const handleCreate = (data: any) => {
    createCommission(data)
      .then(() => setIsCreating(false))
      .catch((err) => console.error("Unable to create commission", err));
  };

  const handleUpdate = (id: string, data: any) => {
    updateCommission(id, data)
      .then(() => setEditingId(null))
      .catch((err) => console.error("Unable to update commission", err));
  };

  const handleDelete = (id: string) => {
    deleteCommission(id).catch((err) => console.error("Unable to delete commission", err));
  };

  const total = filteredCommissions?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <Card padded={false} className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Commission (filtered)</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              RM {total.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-950">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Commission Entries</CardTitle>
            <div className="flex gap-3">
              <MonthPicker
                value={filterMonth}
                onChange={(val) => setFilterMonth(val)}
                placeholder="Filter by month"
                className="w-48"
              />
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Commission
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isCreating && (
            <CommissionForm onSubmit={(data) => handleCreate(data)} onCancel={() => setIsCreating(false)} />
          )}

          <div className="space-y-2">
            {isLoading && !filteredCommissions?.length && (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading commissions...</div>
            )}

            {filteredCommissions?.map((commission) => (
              <div
                key={commission.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
              >
                {editingId === commission.id ? (
                  <CommissionForm
                    initialData={commission}
                    onSubmit={(data) => handleUpdate(commission.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            RM {commission.amount.toLocaleString()}
                          </p>
                          {commission.listingId && (
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              Listing
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(commission.closedDate).toLocaleDateString("en-MY", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {commission.notes ? ` • ${commission.notes}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(commission.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(commission.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {!filteredCommissions?.length && !isCreating && !isLoading && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No commissions recorded for this month.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CommissionForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: CommissionEntry;
  onSubmit: (data: CommissionMutation) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount ?? 0,
    closedDate: initialData?.closedDate
      ? new Date(initialData.closedDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    notes: initialData?.notes ?? ""
  });

  return (
    <div className="w-full space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Amount (RM)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="mt-1.5"
            placeholder="e.g., 3000.00"
          />
        </div>

        <div>
          <Label>Closed Date</Label>
          <DatePicker
            value={formData.closedDate}
            onChange={(val) => setFormData({ ...formData, closedDate: val })}
            placeholder="Select date"
            className="mt-1.5"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Notes (optional)</Label>
          <Input
            type="text"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="mt-1.5"
            placeholder="e.g., Sale commission for Setia Alam"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onSubmit({
              amount: formData.amount,
              closedDate: formData.closedDate,
              notes: formData.notes.trim() ? formData.notes : undefined
            });
          }}
        >
          {initialData ? "Update" : "Create"} Commission
        </Button>
      </div>
    </div>
  );
}
