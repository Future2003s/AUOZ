"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Save, Globe, AlertCircle } from "lucide-react";
import { TranslationData } from "@/apiRequests/translations";

interface TranslationFormProps {
  translation?: TranslationData | null;
  onSubmit: (data: TranslationData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const categories = [
  { value: "product", label: "Sản phẩm" },
  { value: "category", label: "Danh mục" },
  { value: "brand", label: "Thương hiệu" },
  { value: "ui", label: "Giao diện" },
  { value: "error", label: "Lỗi" },
  { value: "success", label: "Thành công" },
  { value: "validation", label: "Xác thực" },
  { value: "email", label: "Email" },
  { value: "notification", label: "Thông báo" },
];

const languages = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
];

export function TranslationForm({
  translation,
  onSubmit,
  onCancel,
  loading,
}: TranslationFormProps) {
  const [formData, setFormData] = useState<TranslationData>({
    key: "",
    category: "ui",
    translations: {
      vi: "",
      en: "",
      ja: "",
    },
    description: "",
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (translation) {
      setFormData(translation);
    }
  }, [translation]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate key
    if (!formData.key.trim()) {
      newErrors.key = "Key là bắt buộc";
    } else if (!/^[a-z0-9._-]+$/.test(formData.key)) {
      newErrors.key =
        "Key chỉ được chứa chữ thường, số, dấu chấm, gạch dưới và gạch ngang";
    }

    // Validate category
    if (!formData.category) {
      newErrors.category = "Danh mục là bắt buộc";
    }

    // Validate translations
    languages.forEach((lang) => {
      if (
        !formData.translations[
          lang.code as keyof typeof formData.translations
        ]?.trim()
      ) {
        newErrors[
          `translation_${lang.code}`
        ] = `Bản dịch ${lang.name} là bắt buộc`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleTranslationChange = (language: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [language]: value,
      },
    }));

    // Clear error when user starts typing
    const errorKey = `translation_${language}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value as any,
    }));

    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleToggleActive = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {translation ? "Chỉnh sửa bản dịch" : "Thêm bản dịch mới"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Key and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => handleInputChange("key", e.target.value)}
                  placeholder="product.name"
                  className={errors.key ? "border-red-500" : ""}
                  disabled={!!translation} // Key cannot be changed when editing
                />
                {errors.key && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {errors.key}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Key duy nhất để định danh bản dịch (chỉ chữ thường, số, dấu
                  chấm, gạch dưới, gạch ngang)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Danh mục *</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger
                    className={errors.category ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {errors.category}
                  </div>
                )}
              </div>
            </div>

            {/* Translations - Side by Side for Easy Comparison */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Bản dịch *</Label>
                <p className="text-xs text-muted-foreground">
                  Sửa trực tiếp các bản dịch để so sánh và chỉnh sửa dễ dàng
                </p>
              </div>
              
              {/* Comparison View - All languages side by side */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-x divide-y md:divide-y-0">
                  {languages.map((lang, index) => (
                    <div 
                      key={lang.code} 
                      className={`p-4 ${index === 0 ? 'bg-blue-50/30' : index === 1 ? 'bg-green-50/30' : 'bg-purple-50/30'}`}
                    >
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                        <span className="text-2xl">{lang.flag}</span>
                        <Label 
                          htmlFor={`translation_${lang.code}`}
                          className="text-sm font-semibold"
                        >
                          {lang.name}
                        </Label>
                        {lang.code === "vi" && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            Mặc định
                          </Badge>
                        )}
                      </div>
                      <Textarea
                        id={`translation_${lang.code}`}
                        value={
                          formData.translations[
                            lang.code as keyof typeof formData.translations
                          ] || ""
                        }
                        onChange={(e) =>
                          handleTranslationChange(lang.code, e.target.value)
                        }
                        placeholder={`Nhập bản dịch ${lang.name}...`}
                        className={
                          errors[`translation_${lang.code}`]
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        }
                        rows={4}
                      />
                      {errors[`translation_${lang.code}`] && (
                        <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                          <AlertCircle className="h-4 w-4" />
                          {errors[`translation_${lang.code}`]}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {formData.translations[
                          lang.code as keyof typeof formData.translations
                        ]?.length || 0} ký tự
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Comparison Helper */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">So sánh nhanh:</span>
                  <div className="flex items-center gap-3 ml-2">
                    {languages.map((lang) => (
                      <div key={lang.code} className="flex items-center gap-1">
                        <span className="text-xs">{lang.flag}</span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formData.translations[
                            lang.code as keyof typeof formData.translations
                          ]?.substring(0, 20) || "..."}
                          {formData.translations[
                            lang.code as keyof typeof formData.translations
                          ]?.length > 20 ? "..." : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Mô tả về bản dịch này (tùy chọn)"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Mô tả giúp hiểu rõ hơn về ngữ cảnh sử dụng của bản dịch
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={handleToggleActive}
              />
              <Label htmlFor="isActive">Bản dịch đang hoạt động</Label>
            </div>

            {/* Live Preview - Side by Side */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Xem trước trực tiếp</Label>
                <Badge variant="outline" className="text-xs">
                  Cập nhật theo thời gian thực
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 rounded-lg border-2 border-dashed">
                {languages.map((lang, index) => {
                  const translation = formData.translations[
                    lang.code as keyof typeof formData.translations
                  ] || "";
                  return (
                    <div 
                      key={lang.code} 
                      className={`p-3 rounded-lg bg-white/80 backdrop-blur-sm border ${
                        index === 0 ? 'border-blue-200' : index === 1 ? 'border-green-200' : 'border-purple-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{lang.flag}</span>
                        <div className="text-sm font-semibold">{lang.name}</div>
                      </div>
                      <div className={`text-sm break-words min-h-[40px] ${
                        translation ? 'text-foreground' : 'text-muted-foreground italic'
                      }`}>
                        {translation || "Chưa có bản dịch"}
                      </div>
                      {translation && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {translation.length} ký tự
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Đang lưu..." : translation ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
