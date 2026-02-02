"use client";
import React, { memo } from "react";
import { MoreVertical } from "lucide-react";
import { StatusBadge } from "./AdminDashboard";

interface OrderRowProps {
  order: {
    id: string;
    customer: string;
    date: string;
    total: string;
    status: string;
  };
}

const OrderRow = memo(({ order }: OrderRowProps) => {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
        {order.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
        <div>{order.customer}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{order.date}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 font-medium">
        {order.total}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
});

OrderRow.displayName = "OrderRow";

export default OrderRow;

