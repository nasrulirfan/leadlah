"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface ListingsDonutProps {
  data: {
    active: number;
    sold: number;
    pending: number;
    expired: number;
  };
}

const COLORS = {
  active: "#10b981",
  sold: "#3b82f6",
  pending: "#f59e0b",
  expired: "#ef4444",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function ListingsDonut({ data }: ListingsDonutProps) {
  const chartData = [
    { name: "Active", value: data.active, color: COLORS.active },
    { name: "Sold", value: data.sold, color: COLORS.sold },
    { name: "Pending", value: data.pending, color: COLORS.pending },
    { name: "Expired", value: data.expired, color: COLORS.expired },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Listings Overview</h3>
          <p className="text-sm text-muted-foreground">Distribution by status</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{total}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
