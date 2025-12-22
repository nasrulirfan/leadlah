"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Receipt } from "lucide-react";
import { useExpenses } from "@/lib/performance/hooks";
import { ExpenseCategory } from "@leadlah/core";

const categoryColors: Record<string, string> = {
  [ExpenseCategory.FUEL]: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  [ExpenseCategory.ADVERTISING]: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  [ExpenseCategory.ENTERTAINMENT]: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  [ExpenseCategory.PRINTING]: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  [ExpenseCategory.TRANSPORTATION]: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  [ExpenseCategory.OFFICE]: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  [ExpenseCategory.PROFESSIONAL_FEES]: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  [ExpenseCategory.OTHER]: "bg-muted text-muted-foreground"
};

export function ExpenseTracker() {
  const { expenses, createExpense, updateExpense, deleteExpense, summary, isLoading, error } = useExpenses();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  const filteredExpenses = expenses?.filter((exp) => {
    const expDate = new Date(exp.date);
    const [year, month] = filterMonth.split('-');
    return expDate.getFullYear() === parseInt(year) && expDate.getMonth() + 1 === parseInt(month);
  });

  const handleCreate = (data: any) => {
    createExpense(data)
      .then(() => setIsCreating(false))
      .catch((err) => console.error("Unable to create expense", err));
  };

  const handleUpdate = (id: string, data: any) => {
    updateExpense(id, data)
      .then(() => setEditingId(null))
      .catch((err) => console.error("Unable to update expense", err));
  };

  const handleDelete = (id: string) => {
    deleteExpense(id).catch((err) => console.error("Unable to delete expense", err));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(summary?.byCategory || {}).map(([category, amount]) => (
          <Card key={category} padded={false} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{category}</p>
                <p className="mt-1 text-xl font-bold text-foreground">
                  RM {amount.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${categoryColors[category]}`}>
                <Receipt className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Expense Records</CardTitle>
            <div className="flex gap-3">
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-44"
              />
              <Button size="sm" onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
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
            <ExpenseForm
              onSubmit={(data) => handleCreate(data)}
              onCancel={() => setIsCreating(false)}
            />
          )}

          <div className="space-y-2">
            {isLoading && !filteredExpenses?.length && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading expenses...
              </div>
            )}

            {filteredExpenses?.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
              >
                {editingId === expense.id ? (
                  <ExpenseForm
                    initialData={expense}
                    onSubmit={(data) => handleUpdate(expense.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{expense.description}</p>
                          <Badge className={categoryColors[expense.category]}>
                            {expense.category}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('en-MY', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          RM {expense.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(expense.id)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {!filteredExpenses?.length && !isCreating && !isLoading && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No expenses recorded for this month.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpenseForm({
  initialData,
  onSubmit,
  onCancel
}: {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    category: initialData?.category || ExpenseCategory.FUEL,
    amount: initialData?.amount || 0,
    description: initialData?.description || "",
    date: initialData?.date
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  });

  return (
    <div className="w-full space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Category</Label>
          <select
            className="mt-1.5 w-full rounded-md border border-input px-3 py-2 text-sm"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
          >
            {Object.values(ExpenseCategory).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <Label>Amount (RM)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="mt-1.5"
            placeholder="e.g., 150.00"
          />
        </div>

        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1.5"
            placeholder="e.g., Fuel for property viewing"
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
              category: formData.category,
              amount: formData.amount,
              description: formData.description,
              date: new Date(formData.date)
            });
          }}
        >
          {initialData ? "Update" : "Add"} Expense
        </Button>
      </div>
    </div>
  );
}
