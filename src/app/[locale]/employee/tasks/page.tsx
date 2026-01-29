"use client";

import { useState, useMemo } from "react";
import TaskCalendar from "@/components/task-calendar";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, Calendar } from "lucide-react";

export default function EmployeeTasksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my-tasks" | "assigned-tasks">("my-tasks");
  const currentUserId = user?._id || user?.id;
  const isAdminLike =
    user?.role === "admin" || user?.role === "seller" || user?.role === "staff";

  // Memoize filterType để tránh re-render không cần thiết
  const filterType = useMemo(() => activeTab, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my-tasks" | "assigned-tasks")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
          <TabsTrigger 
            value="my-tasks" 
            className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg transition-all"
          >
            <User className="w-4 h-4" />
            Công việc của tôi
          </TabsTrigger>
          <TabsTrigger 
            value="assigned-tasks" 
            className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg transition-all"
          >
            <Briefcase className="w-4 h-4" />
            Công việc được giao
          </TabsTrigger>
        </TabsList>

        {/* Task Calendar */}
        <div className="mt-6">
          <TaskCalendar 
            key="task-calendar-shared" 
            filterType={filterType} 
            currentUserId={currentUserId}
            isAdmin={Boolean(isAdminLike)}
          />
        </div>
      </Tabs>
    </div>
  );
}

