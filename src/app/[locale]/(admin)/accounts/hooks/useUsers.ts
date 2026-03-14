"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type { User } from "../types";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [loginAttemptsMap, setLoginAttemptsMap] = useState<Record<string, number>>({});

  const loadLoginAttempts = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/login-attempts`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const attempts = data?.data?.attempts || data?.attempts || 0;
        setLoginAttemptsMap((prev) => ({ ...prev, [userId]: attempts }));
      }
    } catch (error) {
      console.error("Error loading login attempts:", error);
    }
  };

  const loadUsers = useCallback(async (clearSearch = false) => {
    if (clearSearch) setQ("");
    setLoading(true);
    try {
      const res = await fetch(`/api/users`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        setUsers([]);
        return;
      }

      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        setUsers([]);
        return;
      }

      const list = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data)
        ? data
        : [];

      const mappedUsers: User[] = list.map((u: any) => ({
        id: u._id || u.id || "",
        fullName: u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.name || "N/A",
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email || "",
        phone: u.phone || "",
        role: (u.role || "customer").toUpperCase() as User["role"],
        status: (u.isActive === false ? "DISABLED" : "ACTIVE") as User["status"],
      }));

      setUsers(mappedUsers);

      mappedUsers.forEach((user) => {
        loadLoginAttempts(user.id);
      });
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase())
    );
  }, [users, q]);

  const handleSaveUser = async (formData: any, selectedUser: User | null) => {
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error("Vui lòng điền đầy đủ thông tin");
      }
      if (!selectedUser && !formData.password) {
        throw new Error("Vui lòng nhập mật khẩu");
      }

      let res;
      if (selectedUser) {
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };
        if (formData.password) updateData.password = formData.password;

        res = await fetch(`/api/users/${selectedUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updateData),
        });
      } else {
        res = await fetch(`/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Có lỗi xảy ra" }));
        throw new Error(error.message || "Có lỗi xảy ra");
      }

      toast.success(selectedUser ? "Cập nhật thành công" : "Tạo tài khoản thành công");
      loadUsers();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
      return false;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Có lỗi xảy ra khi xóa" }));
        throw new Error(error.message || "Không thể xóa tài khoản");
      }

      toast.success(`Đã xóa tài khoản thành công`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      return true;
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
      return false;
    }
  };

  const handleBulkDeleteUsers = async (userIds: string[]) => {
    const successes: string[] = [];
    const failures: string[] = [];

    for (const userId of userIds) {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) failures.push(userId);
        else successes.push(userId);
      } catch {
        failures.push(userId);
      }
    }

    if (successes.length) {
      toast.success(`Đã xóa ${successes.length} tài khoản`);
      setUsers((prev) => prev.filter((u) => !successes.includes(u.id)));
    }
    if (failures.length) {
      toast.error(`Không thể xóa ${failures.length} tài khoản`);
    }
    return { successes, failures };
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Có lỗi xảy ra" }));
        throw new Error(error.message || "Có lỗi xảy ra");
      }

      toast.success("Cập nhật quyền thành công");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: "ACTIVE" | "DISABLED") => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: currentStatus === "DISABLED" }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Có lỗi xảy ra" }));
        throw new Error(error.message || "Có lỗi xảy ra");
      }

      toast.success("Cập nhật trạng thái thành công");
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleResetLoginAttempts = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/reset-login-attempts`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Có lỗi xảy ra" }));
        throw new Error(error.message || "Có lỗi xảy ra");
      }

      toast.success("Đã xóa giới hạn đăng nhập. Người dùng có thể đăng nhập ngay");
      setLoginAttemptsMap((prev) => ({ ...prev, [userId]: 0 }));
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  return {
    users: filtered,
    allUsers: users,
    loading,
    q,
    setQ,
    loginAttemptsMap,
    loadUsers,
    handleSaveUser,
    handleDeleteUser,
    handleBulkDeleteUsers,
    handleUpdateRole,
    handleToggleStatus,
    handleResetLoginAttempts,
  };
}
