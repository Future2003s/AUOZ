"use client";

import { useState } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { useTranslationsV2Admin } from "@/hooks/useTranslationsV2Admin";
import { TranslationV2Data } from "@/apiRequests/translationsV2";
import {
  TranslationStats,
  TranslationList,
  TranslationForm,
  TranslationSearch,
  TranslationImportExport,
} from "@/components/admin/translations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Upload, Download, X } from "lucide-react";
import { toast } from "sonner";
import {
  SupportedLocales,
  buildTranslationKey,
  parseTranslationKey,
} from "@/i18n/configV2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const categories = [
  { value: "ui", label: "UI" },
  { value: "selling_point", label: "Selling Point" },
  { value: "message", label: "Message" },
  { value: "error", label: "Error" },
  { value: "success", label: "Success" },
  { value: "validation", label: "Validation" },
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "email", label: "Email" },
  { value: "notification", label: "Notification" },
];

const locales = Object.values(SupportedLocales).map((locale) => ({
  value: locale,
  label: locale.toUpperCase(),
}));

export default function TranslationsPage() {
  // V1 translations
  const {
    translations: v1Translations,
    loading: v1Loading,
    error: v1Error,
    stats,
    pagination: v1Pagination,
    fetchTranslations: v1FetchTranslations,
    createTranslation: v1CreateTranslation,
    updateTranslation: v1UpdateTranslation,
    deleteTranslation: v1DeleteTranslation,
    clearError: v1ClearError,
  } = useTranslations();

  // V2 translations
  const {
    translations: v2Translations,
    loading: v2Loading,
    error: v2Error,
    pagination: v2Pagination,
    fetchTranslations: v2FetchTranslations,
    upsertTranslation: v2UpsertTranslation,
    bulkImport: v2BulkImport,
    clearError: v2ClearError,
  } = useTranslationsV2Admin();

  const [activeTab, setActiveTab] = useState<"v1" | "v2">("v2");
  const [showV1Form, setShowV1Form] = useState(false);
  const [showV2Form, setShowV2Form] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [editingV1Translation, setEditingV1Translation] = useState<any>(null);
  const [editingV2Translation, setEditingV2Translation] =
    useState<TranslationV2Data | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocale, setSelectedLocale] = useState<string>("");
  const [baseKeyFilter, setBaseKeyFilter] = useState("");

  // V2 Form state
  const [v2FormState, setV2FormState] = useState({
    baseKey: "",
    locale: SupportedLocales.VIETNAMESE,
    variant: "",
    category: "ui" as TranslationV2Data["category"],
    value: "",
    description: "",
  });

  // V1 Handlers
  const handleV1CreateNew = () => {
    setEditingV1Translation(null);
    setShowV1Form(true);
  };

  const handleV1Edit = (translation: any) => {
    setEditingV1Translation(translation);
    setShowV1Form(true);
  };

  const handleV1FormSubmit = async (data: any) => {
    let success = false;
    if (editingV1Translation) {
      success = await v1UpdateTranslation(editingV1Translation.key, data);
    } else {
      success = await v1CreateTranslation(data);
    }
    if (success) {
      setShowV1Form(false);
      setEditingV1Translation(null);
    }
  };

  // V2 Handlers
  const handleV2CreateNew = () => {
    setEditingV2Translation(null);
    setV2FormState({
      baseKey: "",
      locale: SupportedLocales.VIETNAMESE,
      variant: "",
      category: "ui",
      value: "",
      description: "",
    });
    setShowV2Form(true);
  };

  const handleV2Edit = (translation: TranslationV2Data) => {
    setEditingV2Translation(translation);
    const parsed = parseTranslationKey(translation.key);
    setV2FormState({
      baseKey: parsed.baseKey,
      locale: translation.locale as SupportedLocales,
      variant: translation.variant || "",
      category: translation.category,
      value: translation.value,
      description: translation.description || "",
    });
    setShowV2Form(true);
  };

  const handleV2FormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = buildTranslationKey(
      v2FormState.baseKey,
      v2FormState.locale,
      v2FormState.variant || undefined
    );
    const success = await v2UpsertTranslation({
      key,
      value: v2FormState.value,
      category: v2FormState.category,
      description: v2FormState.description || undefined,
    });
    if (success) {
      toast.success("Translation saved successfully");
      setShowV2Form(false);
      setEditingV2Translation(null);
    } else {
      toast.error(v2Error || "Failed to save translation");
    }
  };

  const handleV2BulkImport = async () => {
    try {
      const lines = bulkImportText.split("\n").filter((line) => line.trim());
      const translations: Array<{
        key: string;
        value: string;
        category: TranslationV2Data["category"];
      }> = [];

      for (const line of lines) {
        if (line.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.key && parsed.value) {
              translations.push({
                key: parsed.key,
                value: parsed.value,
                category: parsed.category || "ui",
              });
            }
          } catch {
            // Skip invalid JSON
          }
        } else {
          const [key, ...valueParts] = line.split("=");
          if (key && valueParts.length > 0) {
            translations.push({
              key: key.trim(),
              value: valueParts.join("=").trim(),
              category: "ui",
            });
          }
        }
      }

      if (translations.length === 0) {
        toast.error("No valid translations found");
        return;
      }

      const result = await v2BulkImport(translations);
      toast.success(
        `Imported ${result.success} translations${
          result.failed > 0 ? `, ${result.failed} failed` : ""
        }`
      );
      setShowBulkImport(false);
      setBulkImportText("");
    } catch (error: any) {
      toast.error(error.message || "Failed to import translations");
    }
  };

  const handleV2Export = () => {
    const data = v2Translations.map((t) => ({
      key: t.key,
      value: t.value,
      category: t.category,
      description: t.description,
    }));
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Translations exported successfully");
  };

  const handleV2Filter = () => {
    v2FetchTranslations(
      1,
      v2Pagination.limit,
      selectedLocale || undefined,
      selectedCategory || undefined,
      searchQuery || undefined,
      baseKeyFilter || undefined
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Đa ngôn ngữ</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý translations với 2 cấu trúc: V1 (nested) và V2 (locale in
            key)
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "v1" | "v2")}
      >
        <TabsList>
          <TabsTrigger value="v1">V1 (Nested Structure)</TabsTrigger>
          <TabsTrigger value="v2">V2 (Locale in Key)</TabsTrigger>
        </TabsList>

        {/* V1 Tab */}
        <TabsContent value="v1" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  v1FetchTranslations(
                    v1Pagination.page,
                    v1Pagination.limit,
                    selectedCategory,
                    searchQuery
                  )
                }
                variant="outline"
                disabled={v1Loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${v1Loading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>
              <Button onClick={handleV1CreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm mới
              </Button>
            </div>
          </div>

          {stats && <TranslationStats stats={stats} />}

          <TranslationSearch
            onSearch={(query) => {
              setSearchQuery(query);
              v1FetchTranslations(
                1,
                v1Pagination.limit,
                selectedCategory,
                query
              );
            }}
            onCategoryChange={(category) => {
              setSelectedCategory(category);
              v1FetchTranslations(1, v1Pagination.limit, category, searchQuery);
            }}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
          />

          <TranslationImportExport />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách bản dịch (V1)</CardTitle>
                </CardHeader>
                <CardContent>
                  <TranslationList
                    translations={v1Translations}
                    loading={v1Loading}
                    pagination={v1Pagination}
                    onEdit={handleV1Edit}
                    onDelete={v1DeleteTranslation}
                    onPageChange={(page) =>
                      v1FetchTranslations(
                        page,
                        v1Pagination.limit,
                        selectedCategory,
                        searchQuery
                      )
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {showV1Form && (
            <TranslationForm
              translation={editingV1Translation}
              onSubmit={handleV1FormSubmit}
              onCancel={() => {
                setShowV1Form(false);
                setEditingV1Translation(null);
              }}
              loading={v1Loading}
            />
          )}

          {v1Error && (
            <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
              <div className="flex justify-between items-center">
                <span>{v1Error}</span>
                <Button
                  onClick={v1ClearError}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white/80 ml-4"
                >
                  ×
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* V2 Tab */}
        <TabsContent value="v2" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                onClick={handleV2Export}
                variant="outline"
                disabled={v2Loading}
              >
                <Download className="w-4 h-4 mr-2" />
                Xuất
              </Button>
              <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Nhập
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Translations</DialogTitle>
                    <DialogDescription>
                      Nhập translations theo format JSON hoặc key=value
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={bulkImportText}
                      onChange={(e) => setBulkImportText(e.target.value)}
                      placeholder={`{"key": "Label_test_vn", "value": "Test", "category": "ui"}\nLabel_test2_vn=Test 2`}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkImport(false)}
                      >
                        Hủy
                      </Button>
                      <Button onClick={handleV2BulkImport} disabled={v2Loading}>
                        {v2Loading ? "Đang nhập..." : "Nhập"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleV2CreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm mới
              </Button>
              <Button
                onClick={handleV2Filter}
                variant="outline"
                disabled={v2Loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${v2Loading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>
            </div>
          </div>

          {/* V2 Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Bộ Lọc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Tìm kiếm</Label>
                  <Input
                    placeholder="Tìm kiếm key, value..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleV2Filter();
                    }}
                  />
                </div>
                <div>
                  <Label>Locale</Label>
                  <Select
                    value={selectedLocale || "all"}
                    onValueChange={(value) => setSelectedLocale(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả locales" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả locales</SelectItem>
                      {locales.map((locale) => (
                        <SelectItem key={locale.value} value={locale.value}>
                          {locale.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={selectedCategory || "all"}
                    onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Base Key</Label>
                  <Input
                    placeholder="Lọc theo base key..."
                    value={baseKeyFilter}
                    onChange={(e) => setBaseKeyFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleV2Filter();
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleV2Filter} disabled={v2Loading}>
                  Áp dụng bộ lọc
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* V2 Translations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh Sách Translations (V2)</CardTitle>
              <CardDescription>
                Hiển thị {v2Translations.length} / {v2Pagination.total}{" "}
                translations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {v2Loading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : v2Translations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy translations nào
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Key</TableHead>
                          <TableHead>Base Key</TableHead>
                          <TableHead>Locale</TableHead>
                          <TableHead>Variant</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {v2Translations.map((translation) => (
                          <TableRow key={translation.key}>
                            <TableCell className="font-mono text-xs">
                              {translation.key}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {translation.baseKey}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {translation.locale}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {translation.variant ? (
                                <Badge variant="secondary">
                                  {translation.variant}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge>{translation.category}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {translation.value}
                            </TableCell>
                            <TableCell>
                              {translation.isActive ? (
                                <Badge variant="default">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleV2Edit(translation)}
                              >
                                Chỉnh sửa
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {v2Pagination.totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Trang {v2Pagination.page} / {v2Pagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            v2FetchTranslations(
                              v2Pagination.page - 1,
                              v2Pagination.limit,
                              selectedLocale || undefined,
                              selectedCategory || undefined,
                              searchQuery || undefined,
                              baseKeyFilter || undefined
                            );
                          }}
                          disabled={v2Pagination.page === 1}
                        >
                          Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            v2FetchTranslations(
                              v2Pagination.page + 1,
                              v2Pagination.limit,
                              selectedLocale || undefined,
                              selectedCategory || undefined,
                              searchQuery || undefined,
                              baseKeyFilter || undefined
                            );
                          }}
                          disabled={
                            v2Pagination.page === v2Pagination.totalPages
                          }
                        >
                          Sau
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* V2 Form Dialog */}
          <Dialog open={showV2Form} onOpenChange={setShowV2Form}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingV2Translation
                    ? "Chỉnh Sửa Translation"
                    : "Thêm Translation Mới"}
                </DialogTitle>
                <DialogDescription>
                  Tạo hoặc chỉnh sửa translation. Key sẽ được tự động tạo từ
                  baseKey, locale và variant.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleV2FormSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Key *</Label>
                    <Input
                      value={v2FormState.baseKey}
                      onChange={(e) =>
                        setV2FormState({
                          ...v2FormState,
                          baseKey: e.target.value,
                        })
                      }
                      placeholder="Label_selling_point_1"
                      required
                    />
                  </div>
                  <div>
                    <Label>Locale *</Label>
                    <Select
                      value={v2FormState.locale}
                      onValueChange={(value) =>
                        setV2FormState({
                          ...v2FormState,
                          locale: value as SupportedLocales,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {locales.map((locale) => (
                          <SelectItem key={locale.value} value={locale.value}>
                            {locale.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Variant (tùy chọn)</Label>
                    <Input
                      value={v2FormState.variant}
                      onChange={(e) =>
                        setV2FormState({
                          ...v2FormState,
                          variant: e.target.value,
                        })
                      }
                      placeholder="short, long, etc."
                    />
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select
                      value={v2FormState.category}
                      onValueChange={(value) =>
                        setV2FormState({
                          ...v2FormState,
                          category: value as TranslationV2Data["category"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Value *</Label>
                  <Textarea
                    value={v2FormState.value}
                    onChange={(e) =>
                      setV2FormState({ ...v2FormState, value: e.target.value })
                    }
                    placeholder="Translation value"
                    required
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Description (tùy chọn)</Label>
                  <Textarea
                    value={v2FormState.description}
                    onChange={(e) =>
                      setV2FormState({
                        ...v2FormState,
                        description: e.target.value,
                      })
                    }
                    placeholder="Mô tả về translation này"
                    rows={2}
                  />
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <Label className="text-xs text-gray-600">
                    Generated Key:
                  </Label>
                  <p className="font-mono text-sm mt-1">
                    {buildTranslationKey(
                      v2FormState.baseKey,
                      v2FormState.locale,
                      v2FormState.variant || undefined
                    )}
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowV2Form(false);
                      setEditingV2Translation(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={v2Loading}>
                    {v2Loading
                      ? "Đang lưu..."
                      : editingV2Translation
                      ? "Cập nhật"
                      : "Tạo mới"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {v2Error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-red-800">{v2Error}</p>
                  <Button variant="ghost" size="sm" onClick={v2ClearError}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
