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
    <tr className="hover:bg-[#f8f9fa] dark:hover:bg-gray-800/50 transition-colors group border-b border-[#f1f3f4] dark:border-gray-800 last:border-0">
      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-[500] text-[#0b57d0] dark:text-[#a8c7fa] group-hover:underline cursor-pointer">
        {order.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-[14px] font-[500] text-gray-900 dark:text-gray-100">{order.customer}</div>
        <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{order.date}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-[14px] text-gray-700 dark:text-gray-300 font-[500]">
        {order.total}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b57d0]">
          <MoreVertical size={18} />
        </button>
      </td>
    </tr>
  );
});

OrderRow.displayName = "OrderRow";

export default OrderRow;
