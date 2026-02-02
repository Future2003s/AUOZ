"use client";
import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  bgColor?: string;
}

const StatCard = memo(({ 
  label, 
  value, 
  change, 
  isPositive, 
  icon: Icon,
  color = "text-blue-600 dark:text-blue-400",
  bgColor = "bg-blue-100 dark:bg-blue-900/30"
}: StatCardProps) => {
  // Map icons to colors if not provided
  const iconColors: Record<string, { color: string; bgColor: string }> = {
    ShoppingBag: {
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    Ticket: {
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    Users: {
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  };

  const iconName = Icon.displayName || Icon.name || "";
  const finalColor = color || iconColors[iconName]?.color || "text-blue-600 dark:text-blue-400";
  const finalBgColor = bgColor || iconColors[iconName]?.bgColor || "bg-blue-100 dark:bg-blue-900/30";

  return (
    <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${finalBgColor}`}>
            <Icon className={`w-6 h-6 ${finalColor}`} />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {value}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{label}</p>
          <div className="flex items-center text-xs">
            <span
              className={`font-medium ${
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {change}
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">so với tháng trước</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";

export default StatCard;

