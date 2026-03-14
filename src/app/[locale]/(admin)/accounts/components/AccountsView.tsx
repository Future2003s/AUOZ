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
import type { User } from "../types";

export interface AccountsViewProps {
  users: User[];
  allUsers: User[];
  loading: boolean;
  q: string;
  setQ: (q: string) => void;
  loginAttemptsMap: Record<string, number>;
  loadUsers: (clear?: boolean) => void;
  handleSaveUser: (formData: any, selectedUser: User | null) => Promise<boolean>;
  handleDeleteUser: (userId: string) => Promise<boolean>;
  handleBulkDeleteUsers: (userIds: string[]) => Promise<{ successes: string[]; failures: string[] }>;
  handleUpdateRole: (userId: string, role: string) => Promise<void>;
  handleToggleStatus: (userId: string, status: "ACTIVE" | "DISABLED") => Promise<void>;
  handleResetLoginAttempts: (userId: string) => Promise<void>;
}

export function AccountsView({
  users,
  allUsers,
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
}: AccountsViewProps) {
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
    role: "customer" as "customer" | "admin" | "seller" | "employee",
  });

  const releaseBodyPointerEvents = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.body.style.pointerEvents !== "") {
      document.body.style.pointerEvents = "";
    }
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
    return () => releaseBodyPointerEvents();
  }, [releaseBodyPointerEvents]);

  useEffect(() => {
    if (!isModalOpen && !isDeleteModalOpen && !isBulkDeleteModalOpen) {
      releaseBodyPointerEvents();
    }
  }, [isModalOpen, isDeleteModalOpen, isBulkDeleteModalOpen, releaseBodyPointerEvents]);

  // Clear selection when data changes from external source entirely if needed, 
  // but let's keep it simple: just maintain selection that still exists
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => allUsers.some((u) => u.id === id)));
  }, [allUsers]);

  const allFilteredIds = useMemo(() => users.map((u) => u.id), [users]);
  const selectionCount = selectedIds.length;
  const isAllSelected = users.length > 0 && users.every((user) => selectedIds.includes(user.id));

  const handleToggleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked && checked !== "indeterminate") {
      setSelectedIds(allFilteredIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (userId: string, checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      const exists = prev.includes(userId);
      if (checked && !exists) return [...prev, userId];
      if (!checked && exists) return prev.filter((id) => id !== userId);
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
      role: user.role.toLowerCase() as "customer" | "admin" | "seller" | "employee",
    });
    setIsModalOpen(true);
  };

  const onSave = async () => {
    const success = await handleSaveUser(formData, selectedUser);
    if (success) closeFormModal();
  };

  const onDelete = async () => {
    if (!selectedUser || isDeleting) return;
    setIsDeleting(true);
    closeDeleteModal();
    const success = await handleDeleteUser(selectedUser.id);
    if (success) {
      setSelectedIds((prev) => prev.filter((id) => id !== selectedUser?.id));
      setSelectedUser(null);
    }
    setIsDeleting(false);
  };

  const onBulkDelete = async () => {
    if (!selectedIds.length || isBulkDeleting) return;
    setIsBulkDeleting(true);
    closeBulkDeleteModal();
    const { failures } = await handleBulkDeleteUsers(selectedIds);
    setSelectedIds(failures);
    setIsBulkDeleting(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tài khoản</h1>
          <p className="text-gray-600 mt-1">Quản lý người dùng và phân quyền</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-2">
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
            <CardTitle>Danh sách người dùng ({users.length})</CardTitle>
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
                        isAllSelected ? true : selectionCount > 0 ? "indeterminate" : false
                      }
                      onCheckedChange={handleToggleSelectAll}
                      disabled={users.length === 0}
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Tên</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Vai trò</th>
                  <th className="text-left py-3 px-4 font-medium">Trạng thái</th>
                  <th className="text-left py-3 px-4 font-medium">Đăng nhập</th>
                  <th className="text-left py-3 px-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <ContextMenu key={u.id} modal={false}>
                    <ContextMenuTrigger asChild>
                      <tr
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-context-menu transition-all duration-200 group ${
                          selectedIds.includes(u.id) ? "bg-rose-50/40 dark:bg-gray-800/40" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            aria-label={`Chọn tài khoản ${u.email}`}
                            checked={selectedIds.includes(u.id)}
                            onCheckedChange={(checked) => handleToggleSelect(u.id, checked)}
                          />
                        </td>
                        <td className="py-3 px-4">{u.fullName}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">
                          <Select
                            value={u.role.toLowerCase()}
                            onValueChange={(value) => handleUpdateRole(u.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">CUSTOMER</SelectItem>
                              <SelectItem value="admin">ADMIN</SelectItem>
                              <SelectItem value="seller">SELLER</SelectItem>
                              <SelectItem value="employee">EMPLOYEE</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={u.status === "ACTIVE" ? "default" : "secondary"}>
                            {u.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {loginAttemptsMap[u.id] !== undefined && loginAttemptsMap[u.id] >= 5 ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <span>Bị khóa ({loginAttemptsMap[u.id]}/5)</span>
                            </Badge>
                          ) : loginAttemptsMap[u.id] !== undefined && loginAttemptsMap[u.id] > 0 ? (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
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
                            {loginAttemptsMap[u.id] !== undefined && loginAttemptsMap[u.id] >= 5 && (
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
                              title={u.status === "ACTIVE" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
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
                      <ContextMenuItem onClick={() => handleOpenEditModal(u)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Sửa thông tin</span>
                      </ContextMenuItem>
                      <ContextMenuSub>
                        <ContextMenuSubTrigger className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Thay đổi vai trò</span>
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          <ContextMenuItem onClick={() => handleUpdateRole(u.id, "customer")} className="cursor-pointer">
                            <span>CUSTOMER</span>
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleUpdateRole(u.id, "admin")} className="cursor-pointer">
                            <span>ADMIN</span>
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleUpdateRole(u.id, "seller")} className="cursor-pointer">
                            <span>SELLER</span>
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleUpdateRole(u.id, "employee")} className="cursor-pointer">
                            <span>EMPLOYEE</span>
                          </ContextMenuItem>
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                      <ContextMenuItem onClick={() => handleToggleStatus(u.id, u.status)} className="cursor-pointer">
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
                      {loginAttemptsMap[u.id] !== undefined && loginAttemptsMap[u.id] >= 5 && (
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
            {users.length === 0 && !loading && (
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
            <DialogTitle>{selectedUser ? "Sửa tài khoản" : "Thêm tài khoản"}</DialogTitle>
            <DialogDescription>
              {selectedUser ? "Cập nhật thông tin tài khoản" : "Tạo tài khoản người dùng mới"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Họ</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Tên</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    role: value as "customer" | "admin" | "seller" | "employee",
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
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeFormModal}>
              Hủy
            </Button>
            <Button onClick={onSave}>Lưu</Button>
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
              Bạn có chắc chắn muốn xóa tài khoản <strong>{selectedUser?.email}</strong>? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
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
              Bạn sắp xóa {selectionCount} tài khoản đã chọn. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeBulkDeleteModal}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onBulkDelete} disabled={isBulkDeleting || selectionCount === 0}>
              {isBulkDeleting ? "Đang xóa..." : "Xóa các tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
