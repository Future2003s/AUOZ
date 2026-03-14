"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, Trash2, Edit2, Eye, EyeOff,
  CheckSquare, Square, ChevronDown, FileText, Loader2
} from "lucide-react";

interface Post {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  status: "published" | "draft" | "archived";
  category?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  seo?: { metaTitle?: string; metaDescription?: string };
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  published: { label: "Đã đăng", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  draft: { label: "Bản nháp", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  archived: { label: "Lưu trữ", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

export default function CmsPostsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusDropOpen, setStatusDropOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const ps = new URLSearchParams();
      if (search) ps.set("q", search);
      if (statusFilter !== "all") ps.set("status", statusFilter);
      ps.set("size", "100");
      const res = await fetch(`/api/cms/posts?${ps}`, { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error("fetch error");
      const data = await res.json();
      const list: Post[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.content)
        ? data.data.content
        : Array.isArray(data)
        ? data
        : [];
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchPosts, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchPosts, search]);

  const postId = (p: Post) => p._id || p.id || "";

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === posts.length) setSelected(new Set());
    else setSelected(new Set(posts.map(postId)));
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Xóa ${selected.size} bài viết?`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/cms/posts/${id}`, { method: "DELETE", credentials: "include" })
        )
      );
      setSelected(new Set());
      fetchPosts();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/cms/posts/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
      setSelected(new Set());
      fetchPosts();
    } finally {
      setBulkLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" /> Quản lý bài viết CMS
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{posts.length} bài viết</p>
        </div>
        <Link
          href={`/${locale}/admin/cms/posts/create`}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Thêm bài viết
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm bài viết, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setStatusDropOpen(!statusDropOpen)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-[140px]"
          >
            {statusFilter === "all" ? "Tất cả trạng thái" : STATUS_LABELS[statusFilter]?.label}
            <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${statusDropOpen ? "rotate-180" : ""}`} />
          </button>
          {statusDropOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50 min-w-[160px]">
              {["all", "published", "draft", "archived"].map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setStatusDropOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${statusFilter === s ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  {s === "all" ? "Tất cả" : STATUS_LABELS[s]?.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Đã chọn {selected.size} bài viết
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => handleBulkStatus("published")} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              <Eye className="h-3.5 w-3.5" /> Đăng ngay
            </button>
            <button onClick={() => handleBulkStatus("draft")} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
              <EyeOff className="h-3.5 w-3.5" /> Bản nháp
            </button>
            <button onClick={handleBulkDelete} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Xóa
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="text-gray-500 text-sm">Chưa có bài viết nào</p>
            <Link href={`/${locale}/admin/cms/posts/create`}
              className="text-blue-600 text-sm font-medium hover:underline">
              Tạo bài viết đầu tiên →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <tr>
                  <th className="pl-4 pr-2 py-3 text-left">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                      {selected.size === posts.length && posts.length > 0
                        ? <CheckSquare className="h-4 w-4 text-blue-500" />
                        : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  {["Tiêu đề", "Slug", "Trạng thái", "Ngày tạo", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {posts.map((post) => {
                  const id = postId(post);
                  const isSelected = selected.has(id);
                  const statusInfo = STATUS_LABELS[post.status] ?? STATUS_LABELS.draft;
                  return (
                    <tr key={id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                      <td className="pl-4 pr-2 py-3">
                        <button onClick={() => toggleSelect(id)} className="text-gray-400 hover:text-blue-500">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 max-w-[280px]">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{post.title}</p>
                        {post.seo?.metaTitle && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">SEO: {post.seo.metaTitle}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {post.slug}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(post.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/${locale}/admin/cms/posts/${id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={async () => {
                              if (!confirm("Xóa bài viết này?")) return;
                              await fetch(`/api/cms/posts/${id}`, { method: "DELETE", credentials: "include" });
                              fetchPosts();
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
