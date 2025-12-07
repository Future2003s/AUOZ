"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layout,
  Palette,
  Image as ImageIcon,
  FileText,
  Settings,
  Eye,
  Globe,
  Type,
  Layers,
  Megaphone,
  Home,
  Navigation,
  Sparkles,
  BookOpen,
  Newspaper,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CMSModule {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status: "active" | "pending" | "coming-soon";
  color: string;
}

export default function CMSDashboard() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";

  const cmsModules: CMSModule[] = [
    {
      id: "homepage",
      title: "Trang Chủ",
      description: "Quản lý hero section, featured products, banners và nội dung trang chủ",
      icon: Home,
      href: `/${locale}/admin/homepage`,
      status: "active",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "banners",
      title: "Banners & Slider",
      description: "Quản lý banner quảng cáo, slider và popup notifications",
      icon: Megaphone,
      href: `/${locale}/admin/advertisements`,
      status: "active",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "story",
      title: "Trang Story",
      description: "Quản lý nội dung và hình ảnh trang câu chuyện",
      icon: BookOpen,
      href: `/${locale}/admin/story`,
      status: "active",
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "news",
      title: "Tin Tức",
      description: "Quản lý bài viết tin tức, blog và nội dung bài viết",
      icon: Newspaper,
      href: `/${locale}/admin/news`,
      status: "active",
      color: "from-blue-600 to-indigo-600",
    },
    {
      id: "footer",
      title: "Chân Trang",
      description: "Cấu hình footer, links, thông tin liên hệ và social media",
      icon: FileText,
      href: `/${locale}/admin/cms/footer`,
      status: "active",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "theme",
      title: "Giao Diện & Theme",
      description: "Tùy chỉnh màu sắc, fonts, spacing và style của website",
      icon: Palette,
      href: `/${locale}/admin/cms/theme`,
      status: "active",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "navigation",
      title: "Điều Hướng",
      description: "Quản lý menu, navigation items và cấu trúc điều hướng",
      icon: Navigation,
      href: `/${locale}/admin/cms/navigation`,
      status: "active",
      color: "from-indigo-500 to-blue-500",
    },
    {
      id: "seo",
      title: "SEO & Metadata",
      description: "Cấu hình meta tags, Open Graph, sitemap và SEO settings",
      icon: Globe,
      href: `/${locale}/admin/cms/seo`,
      status: "active",
      color: "from-teal-500 to-cyan-500",
    },
    {
      id: "typography",
      title: "Typography",
      description: "Quản lý fonts, text styles, headings và typography system",
      icon: Type,
      href: `/${locale}/admin/cms/typography`,
      status: "active",
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "layout",
      title: "Layout Settings",
      description: "Cấu hình container width, grid system và responsive breakpoints",
      icon: Layout,
      href: `/${locale}/admin/cms/layout`,
      status: "active",
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CMS - Quản Lý Giao Diện</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý và tùy chỉnh toàn bộ giao diện website của bạn
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              Xem Website
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Modules Hoạt Động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {cmsModules.filter((m) => m.status === "active").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              / {cmsModules.length} modules
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Đang Phát Triển
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {cmsModules.filter((m) => m.status === "coming-soon").length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sắp ra mắt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng Cấu Hình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {cmsModules.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Modules có sẵn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trạng Thái
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Hoạt Động
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Hệ thống CMS</p>
          </CardContent>
        </Card>
      </div>

      {/* CMS Modules Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Modules Quản Lý
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cmsModules.map((module) => {
            const Icon = module.icon;
            const isActive = module.status === "active";
            const isComingSoon = module.status === "coming-soon";

            return (
              <Card
                key={module.id}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  isComingSoon ? "opacity-75" : ""
                }`}
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${module.color} opacity-10 rounded-bl-full`}
                />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${module.color} text-white shadow-sm`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {isComingSoon && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Sắp ra mắt
                      </Badge>
                    )}
                    {isActive && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Hoạt động
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-4 text-lg">{module.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isActive ? (
                    <Button asChild className="w-full" variant="default">
                      <Link href={module.href}>
                        <Settings className="mr-2 h-4 w-4" />
                        Quản Lý
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Sắp Ra Mắt
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao Tác Nhanh</CardTitle>
          <CardDescription>
            Các thao tác thường dùng trong quản lý CMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/${locale}/admin/homepage`}>
                <Home className="mr-2 h-4 w-4" />
                Chỉnh Sửa Trang Chủ
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/${locale}/admin/advertisements`}>
                <Megaphone className="mr-2 h-4 w-4" />
                Quản Lý Banners
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/${locale}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Xem Trang Web
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/${locale}/admin/translations`}>
                <Globe className="mr-2 h-4 w-4" />
                Quản Lý Đa Ngôn Ngữ
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href={`/${locale}/admin/news`}>
                <Newspaper className="mr-2 h-4 w-4" />
                Quản Lý Tin Tức
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

