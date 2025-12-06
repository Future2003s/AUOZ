"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Bell, Shield, Globe } from "lucide-react";

export default function EmployeeSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Cài Đặt
        </h1>
        <p className="text-slate-600">
          Quản lý cài đặt tài khoản và tùy chọn
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Họ</Label>
              <Input id="firstName" placeholder="Nhập họ của bạn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Tên</Label>
              <Input id="lastName" placeholder="Nhập tên của bạn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" placeholder="0901234567" />
            </div>
          </div>
          <Button className="bg-indigo-500 hover:bg-indigo-600">
            Lưu thay đổi
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Thông báo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold">Thông báo email</p>
              <p className="text-sm text-slate-600">
                Nhận thông báo qua email
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold">Thông báo đơn hàng mới</p>
              <p className="text-sm text-slate-600">
                Nhận thông báo khi có đơn hàng mới
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold">Thông báo công việc</p>
              <p className="text-sm text-slate-600">
                Nhận thông báo về công việc được giao
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Bảo mật
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button className="bg-indigo-500 hover:bg-indigo-600">
            Đổi mật khẩu
          </Button>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            Ngôn ngữ & Vùng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Ngôn ngữ</Label>
            <select
              id="language"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
          <Button className="bg-indigo-500 hover:bg-indigo-600">
            Lưu cài đặt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

