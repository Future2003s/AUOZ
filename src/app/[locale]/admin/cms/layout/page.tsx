"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layout, Save } from "lucide-react";
import { toast } from "sonner";

interface LayoutSettings {
  container: {
    maxWidth: string;
    padding: string;
  };
  grid: {
    columns: number;
    gap: string;
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
}

const defaultLayout: LayoutSettings = {
  container: {
    maxWidth: "1280px",
    padding: "1rem",
  },
  grid: {
    columns: 12,
    gap: "1rem",
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
};

export default function LayoutSettingsPage() {
  const [layout, setLayout] = useState<LayoutSettings>(defaultLayout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLayoutSettings();
  }, []);

  const fetchLayoutSettings = async () => {
    try {
      const res = await fetch("/api/cms/layout", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLayout(data?.data || defaultLayout);
      }
    } catch (error) {
      console.error("Error fetching layout:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(layout),
      });

      if (res.ok) {
        toast.success("Đã lưu cấu hình layout thành công!");
      } else {
        toast.error("Không thể lưu cấu hình");
      }
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Layout</h1>
          <p className="mt-2 text-sm text-gray-600">
            Cấu hình container, grid system và responsive breakpoints
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Container Settings</CardTitle>
            <CardDescription>
              Cấu hình container width và padding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Max Width</Label>
              <Input
                type="text"
                value={layout.container.maxWidth}
                onChange={(e) =>
                  setLayout({
                    ...layout,
                    container: {
                      ...layout.container,
                      maxWidth: e.target.value,
                    },
                  })
                }
                placeholder="1280px"
              />
            </div>
            <div>
              <Label>Padding</Label>
              <Input
                type="text"
                value={layout.container.padding}
                onChange={(e) =>
                  setLayout({
                    ...layout,
                    container: {
                      ...layout.container,
                      padding: e.target.value,
                    },
                  })
                }
                placeholder="1rem"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grid System</CardTitle>
            <CardDescription>
              Cấu hình grid columns và gap
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Columns</Label>
              <Input
                type="number"
                value={layout.grid.columns}
                onChange={(e) =>
                  setLayout({
                    ...layout,
                    grid: {
                      ...layout.grid,
                      columns: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Gap</Label>
              <Input
                type="text"
                value={layout.grid.gap}
                onChange={(e) =>
                  setLayout({
                    ...layout,
                    grid: {
                      ...layout.grid,
                      gap: e.target.value,
                    },
                  })
                }
                placeholder="1rem"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Responsive Breakpoints</CardTitle>
            <CardDescription>
              Cấu hình breakpoints cho responsive design
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(layout.breakpoints).map(([key, value]) => (
                <div key={key}>
                  <Label className="uppercase">{key}</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setLayout({
                        ...layout,
                        breakpoints: {
                          ...layout.breakpoints,
                          [key]: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

