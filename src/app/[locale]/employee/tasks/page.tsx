"use client";

import { useState, useMemo } from "react";
import TaskCalendar from "@/components/task-calendar";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase } from "lucide-react";

export default function EmployeeTasksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"my-tasks" | "assigned-tasks">("my-tasks");
  const currentUserId = user?._id || user?.id;

  // Memoize filterType để tránh re-render không cần thiết
  const filterType = useMemo(() => activeTab, [activeTab]);

  return (
    <div className="mt-10 container mx-auto px-4 py-6 space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "my-tasks" | "assigned-tasks")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="my-tasks" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Công việc của tôi
          </TabsTrigger>
          <TabsTrigger value="assigned-tasks" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Công việc được giao
          </TabsTrigger>
        </TabsList>

        {/* Render một TaskCalendar duy nhất, chỉ thay đổi filterType */}
        <div className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === "my-tasks" ? (
                  <>
                    <User className="w-5 h-5" />
                    Công việc của tôi
                  </>
                ) : (
                  <>
                    <Briefcase className="w-5 h-5" />
                    Công việc được giao
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskCalendar 
                key="task-calendar-shared" 
                filterType={filterType} 
                currentUserId={currentUserId}
              />
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}

