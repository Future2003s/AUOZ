"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigation, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  id: string;
  label: string;
  href: string;
  order: number;
  visible: boolean;
}

export default function NavigationSettingsPage() {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNavigation();
  }, []);

  const fetchNavigation = async () => {
    try {
      const res = await fetch("/api/cms/navigation", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setNavItems(data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching navigation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(navItems),
      });

      if (res.ok) {
        toast.success("Đã lưu cấu hình navigation thành công!");
      } else {
        toast.error("Không thể lưu cấu hình");
      }
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const addNavItem = () => {
    const newItem: NavItem = {
      id: `nav-${Date.now()}`,
      label: "Menu Item Mới",
      href: "#",
      order: navItems.length,
      visible: true,
    };
    setNavItems([...navItems, newItem]);
  };

  const removeNavItem = (id: string) => {
    setNavItems(navItems.filter((item) => item.id !== id));
  };

  const updateNavItem = (id: string, updates: Partial<NavItem>) => {
    setNavItems(
      navItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Navigation</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý menu và điều hướng của website
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={addNavItem}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm Menu Item
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>
            Quản lý các mục trong menu điều hướng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {navItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có menu items. Hãy thêm menu item mới.
              </div>
            ) : (
              navItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label>Label</Label>
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateNavItem(item.id, { label: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Link (href)</Label>
                      <Input
                        value={item.href}
                        onChange={(e) =>
                          updateNavItem(item.id, { href: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={item.visible}
                      onChange={(e) =>
                        updateNavItem(item.id, { visible: e.target.checked })
                      }
                      className="rounded"
                    />
                    <Label className="text-sm">Hiển thị</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNavItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

