"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { newsApi } from "@/apiRequests/news";
import { NewsArticle, NewsStatus } from "@/types/news";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

export default function NewsAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const queryClient = useQueryClient();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsStatus | "all">("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // ─── Data Fetching ─────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-news", statusFilter, debouncedSearch],
    queryFn: () =>
      newsApi.adminList({
        status: statusFilter,
        search: debouncedSearch || undefined,
        locale,
      }),
    staleTime: 30_000,
  });

  const news: NewsArticle[] = useMemo(() => {
    if (!data?.success) return [];
    if (Array.isArray(data.data)) return data.data;
    const d = data.data as any;
    if (d?.items && Array.isArray(d.items)) return d.items;
    return [];
  }, [data]);

  // ─── Mutations ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-news"] });
      toast.success("Đã xóa tin tức");
    },
    onError: (err: any) => toast.error(err.message || "Không thể xóa"),
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleBulkDelete = async () => {
    const selectedIds = table
      .getSelectedRowModel()
      .rows.map((r) => r.original._id || r.original.id || "")
      .filter(Boolean);

    await Promise.all(selectedIds.map((id) => newsApi.delete(id)));
    queryClient.invalidateQueries({ queryKey: ["admin-news"] });
    setRowSelection({});
    setBulkDeleteOpen(false);
    toast.success(`Đã xóa ${selectedIds.length} tin tức`);
  };

  // ─── Columns ──────────────────────────────────────────────────
  const columns: ColumnDef<NewsArticle>[] = useMemo(
    () => [
      // Checkbox column
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
            aria-label="Chọn tất cả"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(val) => row.toggleSelected(!!val)}
            aria-label="Chọn hàng"
          />
        ),
        enableSorting: false,
        size: 40,
      },
      // Title + thumbnail
      {
        id: "title",
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => {
          const article = row.original;
          return (
            <div className="flex items-center gap-3 min-w-0">
              {article.coverImage ? (
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-14 h-10 object-cover rounded shrink-0"
                />
              ) : (
                <div className="w-14 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-gray-400" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm truncate max-w-xs">{article.title}</div>
                {article.excerpt && (
                  <div className="text-xs text-gray-400 truncate max-w-xs">
                    {article.excerpt}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      // Status
      {
        id: "status",
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <Badge variant={status === "published" ? "default" : "secondary"}>
              {status === "published" ? "Đã xuất bản" : "Bản nháp"}
            </Badge>
          );
        },
        size: 130,
      },
      // Created At
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 text-gray-600 font-medium"
          >
            Ngày tạo
            {column.getIsSorted() === "asc" ? (
              <ArrowUp size={13} />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown size={13} />
            ) : (
              <ArrowUpDown size={13} className="opacity-40" />
            )}
          </button>
        ),
        cell: ({ getValue }) => {
          const raw = getValue<string | undefined>();
          if (!raw) return "—";
          return new Date(raw).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        },
        size: 120,
      },
      // Views
      {
        id: "views",
        accessorKey: "views",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 text-gray-600 font-medium"
          >
            Lượt xem
            {column.getIsSorted() === "asc" ? (
              <ArrowUp size={13} />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown size={13} />
            ) : (
              <ArrowUpDown size={13} className="opacity-40" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-600">{(getValue<number>() || 0).toLocaleString()}</span>
        ),
        size: 100,
      },
      // Actions
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const article = row.original;
          const id = article._id || article.id || "";
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/${locale}/admin/news/${id}`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(`/${locale}/news/${article.slug}`, "_blank")}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Xem trang
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => handleDelete(id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 50,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, deleteMutation.isPending]
  );

  // ─── Table ───────────────────────────────────────────────────
  const table = useReactTable({
    data: news,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const selectedCount = Object.keys(rowSelection).length;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Tin Tức</h1>
          <p className="mt-1 text-sm text-gray-500">
            {news.length > 0 ? `${news.length} bài viết` : "Tạo, chỉnh sửa và quản lý tin tức"}
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/admin/news/new`)} className="gap-2">
          <Plus size={16} />
          Tạo Tin Tức Mới
        </Button>
      </div>

      {/* Filters toolbar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tiêu đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as NewsStatus | "all");
                setRowSelection({});
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
            {/* Refresh */}
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            Đã chọn {selectedCount} bài viết
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setBulkDeleteOpen(true)}
            className="gap-1 h-7 text-xs"
          >
            <Trash2 size={13} />
            Xóa {selectedCount} bài
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRowSelection({})}
            className="gap-1 h-7 text-xs text-blue-700"
          >
            Bỏ chọn
          </Button>
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-4">
          <CardTitle className="text-base font-semibold text-gray-700">Danh Sách Tin Tức</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 px-0 pb-0">
          {isError ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-3">Không thể tải danh sách tin tức</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                Thử lại
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              <span>Đang tải...</span>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium mb-1">Không tìm thấy tin tức</p>
              <p className="text-sm text-gray-400 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  : "Bắt đầu bằng cách tạo tin tức đầu tiên"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => router.push(`/${locale}/admin/news/new`)} variant="outline">
                  <Plus size={14} className="mr-2" />
                  Tạo Tin Tức Mới
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow key={hg.id} className="hover:bg-transparent">
                      {hg.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                          className="px-4 text-xs uppercase tracking-wide text-gray-500 font-semibold"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : ""}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {news.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Trang{" "}
                <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span>
                {" "}/ <span className="font-medium">{table.getPageCount()}</span>
                {" "}({table.getFilteredRowModel().rows.length} kết quả)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Delete Confirm Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa {selectedCount} tin tức?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tất cả {selectedCount} bài viết đã chọn sẽ bị xóa
              vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa {selectedCount} bài
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
