"use client";

import { useState, useMemo, useEffect } from "react";
import TaskCalendar from "@/components/task-calendar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users } from "lucide-react";

type User = {
  id: string;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "ADMIN" | "CUSTOMER" | "SELLER" | "EMPLOYEE";
};

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Load employees list
  useEffect(() => {
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await fetch(`/api/users`, {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Failed to fetch users:", res.status);
          setEmployees([]);
          return;
        }

        let data: { data?: unknown[]; content?: unknown[] } | null = null;
        try {
          const text = await res.text();
          data = text
            ? (JSON.parse(text) as { data?: unknown[]; content?: unknown[] })
            : null;
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          setEmployees([]);
          return;
        }

        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
          ? data
          : [];

        const mappedUsers: User[] = list
          .map((u: unknown) => {
            const user = u as {
              _id?: string;
              id?: string;
              firstName?: string;
              lastName?: string;
              email?: string;
              role?: string;
              isActive?: boolean;
              fullName?: string;
              name?: string;
            };
            return {
              id: user._id || user.id || "",
              fullName:
                user.fullName ||
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.name ||
                "N/A",
              firstName: user.firstName || "",
              lastName: user.lastName || "",
              email: user.email || "",
              role: (user.role || "customer").toUpperCase() as
                | "ADMIN"
                | "CUSTOMER"
                | "SELLER"
                | "EMPLOYEE",
            };
          })
          .filter(
            (u) =>
              u.role === "EMPLOYEE" ||
              u.role === "SELLER" ||
              u.role === "ADMIN"
          ); // Chỉ lấy employees, sellers và admins

        setEmployees(mappedUsers);
      } catch (error) {
        console.error("Error loading employees:", error);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, []);

  return (
    <div className="mt-10 container mx-auto px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Quản lý công việc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              Bạn có thể xem tất cả công việc và giao công việc cho nhân viên
            </p>
            {loadingEmployees && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Đang tải danh sách nhân viên...
              </p>
            )}
            {!loadingEmployees && employees.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Chưa có nhân viên nào trong hệ thống. Vui lòng thêm nhân viên trong mục "Tài Khoản".
              </p>
            )}
            {!loadingEmployees && employees.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Có {employees.length} nhân viên có thể giao việc
              </p>
            )}
          </div>
          <TaskCalendar 
            key="admin-task-calendar" 
            filterType="all" 
            currentUserId={user?._id || user?.id}
            employees={employees}
            isAdmin={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
