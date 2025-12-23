"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useTargets } from "@/lib/performance/hooks";

export function TargetManager() {
  const { targets, createTarget, updateTarget, deleteTarget, isLoading, error } = useTargets();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const handleCreate = (data: any) => {
    createTarget(data)
      .then(() => setIsCreating(false))
      .catch((err) => console.error("Unable to create target", err));
  };

  const handleUpdate = (id: string, data: any) => {
    updateTarget(id, data)
      .then(() => setEditingId(null))
      .catch((err) => console.error("Unable to update target", err));
  };

  const handleDelete = (id: string) => {
    deleteTarget(id).catch((err) => console.error("Unable to delete target", err));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly & Annual Targets</CardTitle>
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Set Target
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isCreating && (
            <TargetForm
              onSubmit={(data) => handleCreate(data)}
              onCancel={() => setIsCreating(false)}
            />
          )}

          <div className="space-y-3">
            {isLoading && !targets?.length && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading targets...
              </div>
            )}

            {targets?.map((target) => (
              <div
                key={target.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
              >
                {editingId === target.id ? (
                  <TargetForm
                    initialData={target}
                    onSubmit={(data) => handleUpdate(target.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {target.month
                              ? `${new Date(target.year, target.month - 1).toLocaleString('default', { month: 'long' })} ${target.year}`
                              : `Year ${target.year}`
                            }
                          </p>
                          {target.year === currentYear && target.month === currentMonth && (
                            <Badge variant="primary">Current</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                          <span>{target.targetUnits} units</span>
                          <span>RM {target.targetIncome.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(target.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(target.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {!targets?.length && !isCreating && !isLoading && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No targets set yet. Create your first target to start tracking!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TargetForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const isEditing = Boolean(initialData);
  const [formData, setFormData] = useState({
    year: initialData?.year || new Date().getFullYear(),
    month: initialData?.month || new Date().getMonth() + 1,
    targetUnits: initialData?.targetUnits || 0,
    targetIncome: initialData?.targetIncome || 0,
    isAnnual: !initialData?.month
  });

  return (
    <div className="w-full space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Period Type</Label>
          <Select
            value={formData.isAnnual ? "annual" : "monthly"}
            onValueChange={(value) => setFormData({ ...formData, isAnnual: value === "annual" })}
            disabled={isEditing}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Year</Label>
          <Input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="mt-1.5"
            disabled={isEditing}
          />
        </div>

        {!formData.isAnnual && (
          <div>
            <Label>Month</Label>
            <Select
              value={formData.month.toString()}
              onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
              disabled={isEditing}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Target Units</Label>
          <Input
            type="number"
            value={formData.targetUnits}
            onChange={(e) => setFormData({ ...formData, targetUnits: parseInt(e.target.value) })}
            className="mt-1.5"
            placeholder="e.g., 10"
          />
        </div>

        <div>
          <Label>Target Income (RM)</Label>
          <Input
            type="number"
            value={formData.targetIncome}
            onChange={(e) => setFormData({ ...formData, targetIncome: parseFloat(e.target.value) })}
            className="mt-1.5"
            placeholder="e.g., 50000"
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
              year: formData.year,
              month: formData.isAnnual ? undefined : formData.month,
              targetUnits: formData.targetUnits,
              targetIncome: formData.targetIncome
            });
          }}
        >
          {initialData ? "Update" : "Create"} Target
        </Button>
      </div>
    </div>
  );
}
