"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BookOpen, FileCheck, HelpCircle } from "lucide-react";

const documents = [
  {
    id: "doc-1",
    title: "Hướng dẫn sử dụng hệ thống",
    description: "Tài liệu hướng dẫn chi tiết cách sử dụng các tính năng",
    type: "guide",
    icon: BookOpen,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "doc-2",
    title: "Quy trình xử lý đơn hàng",
    description: "Quy trình chuẩn để xử lý và theo dõi đơn hàng",
    type: "process",
    icon: FileCheck,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "doc-3",
    title: "FAQ - Câu hỏi thường gặp",
    description: "Các câu hỏi và câu trả lời thường gặp",
    type: "faq",
    icon: HelpCircle,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function EmployeeDocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Tài Liệu & Hướng Dẫn
        </h1>
        <p className="text-slate-600">
          Truy cập tài liệu và hướng dẫn làm việc
        </p>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const Icon = doc.icon;
          return (
            <Card
              key={doc.id}
              className="border-0 shadow-md hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${doc.bgColor}`}>
                    <Icon className={`w-6 h-6 ${doc.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
                <p className="text-sm text-slate-600 mb-4">
                  {doc.description}
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Tải xuống
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Help */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                Cần hỗ trợ thêm?
              </h3>
              <p className="text-indigo-100">
                Liên hệ với quản lý hoặc bộ phận IT để được hỗ trợ
              </p>
            </div>
            <Button className="bg-white text-indigo-600 hover:bg-indigo-50">
              Liên hệ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

