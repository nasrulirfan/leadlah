"use client";

import { motion } from "framer-motion";
import { Home, DollarSign, Users, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "listing" | "sale" | "lead" | "reminder" | "target";
  title: string;
  description: string;
  time: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons = {
  listing: { icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
  sale: { icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  lead: { icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
  reminder: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  target: { icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-500/10" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  // Mock activities if none provided
  const displayActivities: Activity[] =
    activities.length > 0
      ? activities
      : [
          {
            id: "1",
            type: "listing",
            title: "New listing added",
            description: "Condo at KLCC Tower",
            time: "2 hours ago",
          },
          {
            id: "2",
            type: "sale",
            title: "Property sold",
            description: "Terrace house in Bangsar",
            time: "Yesterday",
          },
          {
            id: "3",
            type: "lead",
            title: "New enquiry received",
            description: "Interested in Mont Kiara unit",
            time: "2 days ago",
          },
          {
            id: "4",
            type: "reminder",
            title: "Follow-up scheduled",
            description: "Call client about viewing",
            time: "3 days ago",
          },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Your latest updates</p>
        </div>

        <div className="space-y-4">
          {displayActivities.map((activity, index) => {
            const { icon: Icon, color, bg } = activityIcons[activity.type];
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className={cn("rounded-lg p-2", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
