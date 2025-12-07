"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Save, RotateCcw, Eye } from "lucide-react";
import { toast } from "sonner";

interface ThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    base: number;
    scale: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
}

const defaultTheme: ThemeSettings = {
  colors: {
    primary: "#4f46e5",
    secondary: "#7c3aed",
    accent: "#ec4899",
    background: "#ffffff",
    text: "#111827",
    border: "#e5e7eb",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  spacing: {
    base: 4,
    scale: 1.5,
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
};

export default function ThemeSettingsPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "vi";
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchThemeSettings();
  }, []);

  const fetchThemeSettings = async () => {
    try {
      const res = await fetch("/api/cms/theme", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTheme(data?.data || defaultTheme);
      }
    } catch (error) {
      console.error("Error fetching theme:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(theme),
      });

      if (res.ok) {
        toast.success("Đã lưu cấu hình theme thành công!");
      } else {
        toast.error("Không thể lưu cấu hình theme");
      }
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTheme(defaultTheme);
    toast.info("Đã reset về cấu hình mặc định");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Theme</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tùy chỉnh màu sắc, fonts và spacing của website
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="colors">Màu Sắc</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="spacing">Spacing</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Màu Sắc Chính</CardTitle>
              <CardDescription>
                Cấu hình màu sắc chính của website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(theme.colors).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-4">
                  <Label className="w-32 capitalize">{key}</Label>
                  <div className="flex-1 flex items-center space-x-2">
                    <Input
                      type="color"
                      value={value}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: { ...theme.colors, [key]: e.target.value },
                        })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          colors: { ...theme.colors, [key]: e.target.value },
                        })
                      }
                      className="flex-1"
                    />
                  </div>
                  <div
                    className="w-16 h-10 rounded border border-gray-300"
                    style={{ backgroundColor: value }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Cấu hình fonts cho website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(theme.fonts).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-4">
                  <Label className="w-32 capitalize">{key} Font</Label>
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        fonts: { ...theme.fonts, [key]: e.target.value },
                      })
                    }
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spacing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spacing & Border Radius</CardTitle>
              <CardDescription>
                Cấu hình khoảng cách và bo góc
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Base Spacing (px)</Label>
                  <Input
                    type="number"
                    value={theme.spacing.base}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        spacing: {
                          ...theme.spacing,
                          base: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Spacing Scale</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={theme.spacing.scale}
                    onChange={(e) =>
                      setTheme({
                        ...theme,
                        spacing: {
                          ...theme.spacing,
                          scale: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Border Radius</h3>
                {Object.entries(theme.borderRadius).map(([key, value]) => (
                  <div key={key}>
                    <Label className="capitalize">{key} (px)</Label>
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setTheme({
                          ...theme,
                          borderRadius: {
                            ...theme.borderRadius,
                            [key]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Xem trước các thay đổi theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="p-6 rounded-lg space-y-4"
                style={{
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  borderWidth: "1px",
                  fontFamily: theme.fonts.body,
                }}
              >
                <h1
                  style={{
                    fontFamily: theme.fonts.heading,
                    color: theme.colors.primary,
                  }}
                >
                  Heading Example
                </h1>
                <p>Body text example with current theme settings.</p>
                <Button
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: `${theme.borderRadius.medium}px`,
                  }}
                >
                  Button Example
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

