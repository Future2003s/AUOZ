"use client";
import React, { memo } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const StatCard = memo(({ label, value, change, isPositive, icon: Icon }: StatCardProps) => {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {label}
              </dt>
              <dd>
                <div className="text-lg font-bold text-gray-900">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span
            className={`font-medium inline-flex items-center ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={14} className="mr-1" />
            ) : (
              <ArrowDownRight size={14} className="mr-1" />
            )}
            {change}
          </span>
          <span className="text-gray-500 ml-2"> so với tháng trước</span>
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";

export default StatCard;

