import { requireSession } from "@/lib/session";
import { PerformanceOverview } from "@/components/performance/performance-overview";
import { TargetManager } from "@/components/performance/target-manager";
import { ExpenseTracker } from "@/components/performance/expense-tracker";
import { PerformanceReports } from "@/components/performance/performance-reports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function PerformancePage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Dashboard</h1>
        <p className="text-sm text-muted-foreground">Track targets, expenses, and analyze your business profitability.</p>
      </div>

      <PerformanceOverview />

      <Tabs defaultValue="targets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="targets" className="mt-6">
          <TargetManager />
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-6">
          <ExpenseTracker />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <PerformanceReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
