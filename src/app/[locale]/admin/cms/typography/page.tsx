"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type, Save } from "lucide-react";
import { toast } from "sonner";

interface TypographySettings {
  fontFamily: {
    heading: string;
    body: string;
    mono: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

const defaultTypography: TypographySettings = {
  fontFamily: {
    heading: "Inter",
    body: "Inter",
    mono: "JetBrains Mono",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

const fontOptions = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "JetBrains Mono",
  "Fira Code",
];

export default function TypographySettingsPage() {
  const [typography, setTypography] = useState<TypographySettings>(defaultTypography);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTypographySettings();
  }, []);

  const fetchTypographySettings = async () => {
    try {
      const res = await fetch("/api/cms/typography", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTypography(data?.data || defaultTypography);
      }
    } catch (error) {
      console.error("Error fetching typography:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/typography", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(typography),
      });

      if (res.ok) {
        toast.success("Đã lưu cấu hình typography thành công!");
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
          <h1 className="text-3xl font-bold text-gray-900">Cài Đặt Typography</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý fonts, kích thước chữ và typography system
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
            <CardTitle>Font Family</CardTitle>
            <CardDescription>Chọn fonts cho website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(typography.fontFamily).map(([key, value]) => (
              <div key={key}>
                <Label className="capitalize">{key} Font</Label>
                <Select
                  value={value}
                  onValueChange={(newValue) =>
                    setTypography({
                      ...typography,
                      fontFamily: { ...typography.fontFamily, [key]: newValue },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font Sizes</CardTitle>
            <CardDescription>Kích thước chữ (px)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(typography.fontSize).map(([key, value]) => (
              <div key={key}>
                <Label className="capitalize">{key}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setTypography({
                      ...typography,
                      fontSize: {
                        ...typography.fontSize,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font Weights</CardTitle>
            <CardDescription>Độ đậm của chữ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(typography.fontWeight).map(([key, value]) => (
              <div key={key}>
                <Label className="capitalize">{key}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setTypography({
                      ...typography,
                      fontWeight: {
                        ...typography.fontWeight,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Heights</CardTitle>
            <CardDescription>Khoảng cách giữa các dòng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(typography.lineHeight).map(([key, value]) => (
              <div key={key}>
                <Label className="capitalize">{key}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) =>
                    setTypography({
                      ...typography,
                      lineHeight: {
                        ...typography.lineHeight,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Xem trước typography settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ fontFamily: typography.fontFamily.body }}>
            <h1
              style={{
                fontFamily: typography.fontFamily.heading,
                fontSize: `${typography.fontSize["4xl"]}px`,
                fontWeight: typography.fontWeight.bold,
                lineHeight: typography.lineHeight.tight,
              }}
            >
              Heading 1 Example
            </h1>
            <h2
              style={{
                fontFamily: typography.fontFamily.heading,
                fontSize: `${typography.fontSize["2xl"]}px`,
                fontWeight: typography.fontWeight.semibold,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              Heading 2 Example
            </h2>
            <p
              style={{
                fontSize: `${typography.fontSize.base}px`,
                fontWeight: typography.fontWeight.normal,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              Body text example with current typography settings. This is how your
              content will look with the configured fonts, sizes, and spacing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

