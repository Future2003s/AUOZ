"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { newsApi } from "@/apiRequests/news";
import { NewsArticle, NewsStatus } from "@/types/news";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  FileText,
  Calendar,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";

export default function NewsAdminPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<NewsStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchNews = React.useCallback(async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated || !user) {
      console.log("User not authenticated, skipping fetch");
      setLoading(false);
      setError("Vui lòng đăng nhập để xem danh sách tin tức");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: {
        status?: NewsStatus;
        locale?: string;
        search?: string;
      } = {};
      
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (locale) {
        params.locale = locale;
      }
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      console.log("Fetching news with params:", params);
      // Token is sent via httpOnly cookie, no need to pass it explicitly
      const response = await newsApi.adminList(params);
      console.log("News API response:", response);
      
      if (response && response.success) {
        // Handle paginated response: { success: true, data: [...], pagination: {...} }
        const newsData = response.data;
        if (Array.isArray(newsData)) {
          setNews(newsData);
          console.log(`Loaded ${newsData.length} news articles`);
          if (newsData.length === 0) {
            setError(null); // No error, just empty list
          }
        } else if (newsData && typeof newsData === "object" && Array.isArray(newsData.items)) {
          // If backend returns { items: [...], pagination: {...} }
          setNews(newsData.items);
          console.log(`Loaded ${newsData.items.length} news articles`);
        } else {
          console.warn("Unexpected response data format:", newsData);
          setNews([]);
          setError("Định dạng dữ liệu không hợp lệ");
        }
      } else {
        console.warn("Response not successful:", response);
        setNews([]);
        setError(response?.message || "Không thể tải danh sách tin tức");
      }
    } catch (error: any) {
      console.error("Error fetching news:", error);
      console.error("Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        payload: error.payload,
      });
      
      const errorMessage = 
        error.statusCode === 401 
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : error.statusCode === 403
          ? "Bạn không có quyền truy cập trang này."
          : error.message || "Không thể tải danh sách tin tức";
      
      toast.error(errorMessage);
      setError(errorMessage);
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, authLoading, locale, statusFilter, debouncedSearchQuery]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    if (isAuthenticated && user && locale) {
      fetchNews();
    } else if (!isAuthenticated) {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem danh sách tin tức");
    }
  }, [isAuthenticated, user, authLoading, locale, fetchNews]);

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập để thực hiện thao tác này");
      return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa tin tức này?")) return;

    try {
      // Token is sent via httpOnly cookie, no need to pass it
      const response = await newsApi.delete(id);
      if (response.success) {
        toast.success("Xóa tin tức thành công");
        fetchNews();
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa tin tức");
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Tin Tức</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tạo, chỉnh sửa và quản lý các bài viết tin tức
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/admin/news/new`)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo Tin Tức Mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm tin tức..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as NewsStatus | "all")
              }
              className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="published">Đã xuất bản</option>
            </select>
            <Button onClick={fetchNews} variant="outline" disabled={loading}>
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* News List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Tin Tức</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">{error}</div>
              <Button onClick={fetchNews} variant="outline" size="sm">
                Thử lại
              </Button>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">Không có tin tức nào</p>
              <p className="text-sm text-gray-400 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                  : "Bắt đầu bằng cách tạo tin tức mới"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button
                  onClick={() => router.push(`/${locale}/admin/news/new`)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Tin Tức Mới
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Lượt xem</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((article) => (
                  <TableRow key={article._id || article.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {article.coverImage && (
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{article.title}</div>
                          <div className="text-sm text-gray-500">
                            {article.excerpt}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          article.status === "published"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {article.status === "published"
                          ? "Đã xuất bản"
                          : "Bản nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(article.createdAt || new Date())}
                    </TableCell>
                    <TableCell>{article.views || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/${locale}/admin/news/${article._id || article.id}`
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/${locale}/news/${article.slug}`,
                                "_blank"
                              )
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(article._id || article.id || "")}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

