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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
        {order.id}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div>{order.customer}</div>
        <div className="text-xs text-gray-400">{order.date}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
        {order.total}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={16} />
        </button>
      </td>
    </tr>
  );
});

OrderRow.displayName = "OrderRow";

export default OrderRow;

