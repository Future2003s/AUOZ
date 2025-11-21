"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Power,
  RefreshCw,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type User = {
  id: string;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: "ADMIN" | "CUSTOMER" | "SELLER";
  status: "ACTIVE" | "DISABLED";
  loginAttempts?: number;
};

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "customer" as "customer" | "admin" | "seller",
  });
  const [loginAttemptsMap, setLoginAttemptsMap] = useState<
    Record<string, number>
  >({});

  const releaseBodyPointerEvents = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.body.style.pointerEvents !== "") {
      document.body.style.pointerEvents = "";
    }
  }, []);

  const clearSelections = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const closeFormModal = useCallback(() => {
    setIsModalOpen(false);
    releaseBodyPointerEvents();
  }, [releaseBodyPointerEvents]);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    releaseBodyPointerEvents();
  }, [releaseBodyPointerEvents]);

  const closeBulkDeleteModal = useCallback(() => {
    setIsBulkDeleteModalOpen(false);
    releaseBodyPointerEvents();
  }, [releaseBodyPointerEvents]);

  useEffect(() => {
    releaseBodyPointerEvents();
    return () => {
      releaseBodyPointerEvents();
    };
  }, [releaseBodyPointerEvents]);

  useEffect(() => {
    if (!isModalOpen && !isDeleteModalOpen && !isBulkDeleteModalOpen) {
      releaseBodyPointerEvents();
    }
  }, [
    isModalOpen,
    isDeleteModalOpen,
    isBulkDeleteModalOpen,
    releaseBodyPointerEvents,
  ]);

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

  const loadUsers = async (clearSearch = false) => {
    if (clearSearch) {
      setQ("");
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/users`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to fetch users:", res.status);
        setUsers([]);
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

      const mappedUsers: User[] = list.map((u: unknown) => {
        const user = u as {
          _id?: string;
          id?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
          phone?: string;
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
          phone: user.phone || "",
          role: (user.role || "customer").toUpperCase() as
            | "ADMIN"
            | "CUSTOMER"
            | "SELLER",
          status: (user.isActive === false ? "DISABLED" : "ACTIVE") as
            | "ACTIVE"
            | "DISABLED",
        };
      });

      setUsers(mappedUsers);
      clearSelections();

      // Load login attempts for all users
      mappedUsers.forEach((user) => {
        loadLoginAttempts(user.id);
      });
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
  );

  const allFilteredIds = useMemo(() => filtered.map((u) => u.id), [filtered]);
  const selectionCount = selectedIds.length;
  const isAllSelected =
    filtered.length > 0 &&
    filtered.every((user) => selectedIds.includes(user.id));

  const handleToggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked && checked !== "indeterminate") {
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (
    userId: string,
    checked: boolean | "indeterminate"
  ) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(userId);
      if (checked && !exists) {
        return [...prev, userId];
      }
      if (!checked && exists) {
        return prev.filter((id) => id !== userId);
      }
      return prev;
    });
  };

  const handleOpenAddModal = () => {
    setSelectedUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      role: "customer",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      role: user.role.toLowerCase() as "customer" | "admin" | "seller",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error("Vui lòng điền đầy đủ thông tin");
        return;
      }

      if (!selectedUser && !formData.password) {
        toast.error("Vui lòng nhập mật khẩu");
        return;
      }

      let res;
      if (selectedUser) {
        // Update
        const updateData: {
          firstName: string;
          lastName: string;
          email: string;
          phone: string;
          role: "customer" | "admin" | "seller";
          password?: string;
        } = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }

        res = await fetch(`/api/users/${selectedUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updateData),
        });
      } else {
        // Create
        res = await fetch(`/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Có lỗi xảy ra" }));
        toast.error(error.message || "Có lỗi xảy ra");
        return;
      }

      toast.success(
        selectedUser ? "Cập nhật thành công" : "Tạo tài khoản thành công"
      );
      closeFormModal();
      loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || isDeleting) return;

    setIsDeleting(true);
    closeDeleteModal();

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Có lỗi xảy ra khi xóa" }));
        throw new Error(error.message || "Không thể xóa tài khoản");
      }

      toast.success(`Đã xóa tài khoản ${selectedUser.email}`);

      // Update state after a short delay to allow UI to settle
      setTimeout(() => {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        setSelectedIds((prev) => prev.filter((id) => id !== selectedUser.id));
        setSelectedUser(null);
        setIsDeleting(false);
      }, 50);
    } catch (error) {
      console.error("Error deleting user:", error);
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.error(message);
      setIsDeleting(false);
      setSelectedUser(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || isBulkDeleting) return;

    setIsBulkDeleting(true);
    closeBulkDeleteModal();

    const idsToDelete = [...selectedIds];
    const successes: string[] = [];
    const failures: string[] = [];

    try {
      for (const userId of idsToDelete) {
        try {
          const res = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (!res.ok) {
            failures.push(userId);
            continue;
          }

          successes.push(userId);
        } catch (error) {
          console.error(`Error deleting user ${userId}:`, error);
          failures.push(userId);
        }
      }

      if (successes.length) {
        const deletedUsers = users.filter((u) => successes.includes(u.id));
        const deletedEmails = deletedUsers.map((u) => u.email).join(", ");
        toast.success(
          successes.length === 1
            ? `Đã xóa tài khoản ${deletedEmails}`
            : `Đã xóa ${successes.length} tài khoản`
        );
        setUsers((prev) => prev.filter((u) => !successes.includes(u.id)));
      }

      if (failures.length) {
        toast.error(`Không thể xóa ${failures.length} tài khoản`);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Có lỗi xảy ra khi xóa nhiều tài khoản");
      if (!failures.length) {
        failures.push(...idsToDelete);
      }
    } finally {
      setSelectedIds(failures);
      setIsBulkDeleting(false);
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: "customer" | "admin" | "seller"
  ) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Có lỗi xảy ra" }));
        toast.error(error.message || "Có lỗi xảy ra");
        return;
      }

      toast.success("Cập nhật quyền thành công");
      loadUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleToggleStatus = async (
    userId: string,
    currentStatus: "ACTIVE" | "DISABLED"
  ) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: currentStatus === "DISABLED" }),
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Có lỗi xảy ra" }));
        toast.error(error.message || "Có lỗi xảy ra");
        return;
      }

      toast.success("Cập nhật trạng thái thành công");
      loadUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleResetLoginAttempts = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/reset-login-attempts`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "Có lỗi xảy ra" }));
        toast.error(error.message || "Có lỗi xảy ra");
        return;
      }

      toast.success(
        "Đã xóa giới hạn đăng nhập. Người dùng có thể đăng nhập ngay"
      );
      setLoginAttemptsMap((prev) => ({ ...prev, [userId]: 0 }));
    } catch (error) {
      console.error("Error resetting login attempts:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tài khoản</h1>
          <p className="text-gray-600 mt-1">Quản lý người dùng và phân quyền</p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Thêm tài khoản
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Tìm theo tên hoặc email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={loading}
            className="w-full"
            autoComplete="off"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Danh sách người dùng ({filtered.length})</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={selectionCount === 0 || isBulkDeleting}
            >
              {selectionCount > 0
                ? `Xóa ${selectionCount} tài khoản đã chọn`
                : "Xóa các tài khoản đã chọn"}
            </Button>
          </div>
          {selectionCount > 0 && (
            <p className="text-sm text-gray-600">
              Đã chọn {selectionCount} tài khoản
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium w-12">
                    <Checkbox
                      aria-label="Chọn tất cả người dùng"
                      checked={
                        isAllSelected
                          ? true
                          : selectionCount > 0
                          ? "indeterminate"
                          : false
                      }
                      onCheckedChange={handleToggleSelectAll}
                      disabled={filtered.length === 0}
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Tên</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Vai trò</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Trạng thái
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Đăng nhập</th>
                  <th className="text-left py-3 px-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <ContextMenu key={u.id} modal={false}>
                    <ContextMenuTrigger asChild>
                      <tr
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-context-menu transition-all duration-200 group ${
                          selectedIds.includes(u.id)
                            ? "bg-rose-50/40 dark:bg-gray-800/40"
                            : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            aria-label={`Chọn tài khoản ${u.email}`}
                            checked={selectedIds.includes(u.id)}
                            onCheckedChange={(checked) =>
                              handleToggleSelect(u.id, checked)
                            }
                          />
                        </td>
                        <td className="py-3 px-4">{u.fullName}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">
                          <Select
                            value={u.role.toLowerCase()}
                            onValueChange={(value) =>
                              handleUpdateRole(
                                u.id,
                                value as "customer" | "admin" | "seller"
                              )
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">CUSTOMER</SelectItem>
                              <SelectItem value="admin">ADMIN</SelectItem>
                              <SelectItem value="seller">SELLER</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              u.status === "ACTIVE" ? "default" : "secondary"
                            }
                          >
                            {u.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {loginAttemptsMap[u.id] !== undefined &&
                          loginAttemptsMap[u.id] >= 5 ? (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1 w-fit"
                            >
                              <span>Bị khóa ({loginAttemptsMap[u.id]}/5)</span>
                            </Badge>
                          ) : loginAttemptsMap[u.id] !== undefined &&
                            loginAttemptsMap[u.id] > 0 ? (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 w-fit"
                            >
                              <span>{loginAttemptsMap[u.id]}/5 lần sai</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Bình thường
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {loginAttemptsMap[u.id] !== undefined &&
                              loginAttemptsMap[u.id] >= 5 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResetLoginAttempts(u.id)}
                                  title="Xóa giới hạn đăng nhập (đã bị khóa do quá nhiều lần đăng nhập sai)"
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              title={
                                u.status === "ACTIVE"
                                  ? "Khóa tài khoản"
                                  : "Mở khóa tài khoản"
                              }
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(u)}
                              title="Sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setIsDeleteModalOpen(true);
                              }}
                              title="Xóa"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56">
                      <ContextMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {u.fullName}
                      </ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleOpenEditModal(u)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Sửa thông tin</span>
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Thay đổi vai trò</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          <ContextMenuItem
                            onClick={() => handleUpdateRole(u.id, "customer")}
                            className="cursor-pointer"
                          >
                            <span>CUSTOMER</span>
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleUpdateRole(u.id, "admin")}
                            className="cursor-pointer"
                          >
                            <span>ADMIN</span>
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleUpdateRole(u.id, "seller")}
                            className="cursor-pointer"
                          >
                            <span>SELLER</span>
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuItem
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className="cursor-pointer"
                      >
                        {u.status === "ACTIVE" ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            <span>Khóa tài khoản</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Mở khóa tài khoản</span>
                          </>
                        )}
                      </ContextMenuItem>
                      {loginAttemptsMap[u.id] !== undefined &&
                        loginAttemptsMap[u.id] >= 5 && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => handleResetLoginAttempts(u.id)}
                              className="cursor-pointer text-orange-600 focus:text-orange-600"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              <span>Xóa giới hạn đăng nhập</span>
                            </ContextMenuItem>
                          </>
                        )}
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDeleteModalOpen(true);
                        }}
                        variant="destructive"
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Xóa tài khoản</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                Không có người dùng
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            releaseBodyPointerEvents();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Sửa tài khoản" : "Thêm tài khoản"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Cập nhật thông tin tài khoản"
                : "Tạo tài khoản người dùng mới"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Họ</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Tên</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Mật khẩu {selectedUser && "(để trống nếu không đổi)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    role: value as "customer" | "admin" | "seller",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFormModal}>
              Hủy
            </Button>
            <Button onClick={handleSave}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            releaseBodyPointerEvents();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản{" "}
              <strong>{selectedUser?.email}</strong>? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBulkDeleteModalOpen}
        onOpenChange={(open) => {
          setIsBulkDeleteModalOpen(open);
          if (!open) {
            releaseBodyPointerEvents();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa nhiều tài khoản</DialogTitle>
            <DialogDescription>
              Bạn sắp xóa {selectionCount} tài khoản đã chọn. Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeBulkDeleteModal}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting || selectionCount === 0}
            >
              {isBulkDeleting ? "Đang xóa..." : "Xóa các tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
