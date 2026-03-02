"use client";
import React, { memo } from "react";

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
  color = "text-[#0b57d0] dark:text-[#a8c7fa]",
  bgColor = "bg-[#d3e3fd]/50 dark:bg-[#004a77]/50"
}: StatCardProps) => {
  // Map icons to Google-ish colors if not provided
  const iconColors: Record<string, { color: string; bgColor: string }> = {
    ShoppingBag: {
      color: "text-[#0b57d0] dark:text-[#a8c7fa]", // Blue
      bgColor: "bg-[#d3e3fd]/50 dark:bg-[#004a77]/50",
    },
    Ticket: {
      color: "text-[#b3261e] dark:text-[#f2b8b5]", // Red/Tertiary
      bgColor: "bg-[#f9dedc]/50 dark:bg-[#8c1d18]/50",
    },
    Users: {
      color: "text-[#146c2e] dark:text-[#c4eed0]", // Green
      bgColor: "bg-[#c4eed0]/50 dark:bg-[#0f5223]/50",
    },
  };

  const iconName = Icon.displayName || Icon.name || "";
  const finalColor = color || iconColors[iconName]?.color || "text-[#0b57d0] dark:text-[#a8c7fa]";
  const finalBgColor = bgColor || iconColors[iconName]?.bgColor || "bg-[#d3e3fd]/50 dark:bg-[#004a77]/50";

  return (
    <div className="bg-white dark:bg-[#1f1f1f] rounded-[24px] border border-[#f1f3f4] dark:border-gray-800 p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${finalBgColor}`}>
          <Icon className={`w-[22px] h-[22px] ${finalColor}`} />
        </div>
        <div className={`flex items-center px-2.5 py-1 rounded-full text-[12px] font-[600] ${isPositive
            ? "text-[#146c2e] bg-[#c4eed0]/50 dark:text-[#c4eed0] dark:bg-[#0f5223]/50"
            : "text-[#b3261e] bg-[#f9dedc]/50 dark:text-[#f2b8b5] dark:bg-[#8c1d18]/50"
          }`}>
          {isPositive ? "↑" : "↓"} {change}
        </div>
      </div>
      <div>
        <h4 className="text-[14px] font-[500] text-gray-500 dark:text-gray-400 mb-1">{label}</h4>
        <p className="text-[28px] leading-tight font-[400] text-gray-900 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";

export default StatCard;
