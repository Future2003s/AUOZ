"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { PastoralImage } from "@/apiRequests/pastoral";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

interface PastoralFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<PastoralImage>) => Promise<void>;
    pastoral?: PastoralImage | null;
    isSubmitting: boolean;
}

export function PastoralForm({
    open,
    onClose,
    onSubmit,
    pastoral,
    isSubmitting,
}: PastoralFormProps) {
    const [formData, setFormData] = useState<Partial<PastoralImage>>({
        titleVi: "",
        titleEn: "",
        descVi: "",
        descEn: "",
        url: "",
        category: "landscape",
    });

    useEffect(() => {
        if (pastoral) {
            setFormData({
                titleVi: pastoral.titleVi || "",
                titleEn: pastoral.titleEn || "",
                descVi: pastoral.descVi || "",
                descEn: pastoral.descEn || "",
                url: pastoral.url || "",
                category: pastoral.category || "landscape",
            });
        } else {
            setFormData({
                titleVi: "",
                titleEn: "",
                descVi: "",
                descEn: "",
                url: "",
                category: "landscape",
            });
        }
    }, [pastoral, open]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (value: string) => {
        setFormData((prev) => ({ ...prev, category: value as any }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.url) {
            toast.error("Vui lòng tải lên hoặc nhập URL hình ảnh");
            return;
        }
        await onSubmit(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {pastoral ? "Chỉnh sửa Khoảnh Khắc" : "Thêm Khoảnh Khắc Mới"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="titleVi">
                                Tiêu đề (Tiếng Việt) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="titleVi"
                                name="titleVi"
                                required
                                value={formData.titleVi}
                                onChange={handleChange}
                                placeholder="Ví dụ: Cánh đồng lúa chín"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="titleEn">
                                Tiêu đề (Tiếng Anh) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="titleEn"
                                name="titleEn"
                                required
                                value={formData.titleEn}
                                onChange={handleChange}
                                placeholder="E.g: Golden Rice Fields"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="descVi">Mô tả (Tiếng Việt)</Label>
                            <Textarea
                                id="descVi"
                                name="descVi"
                                value={formData.descVi}
                                onChange={handleChange}
                                placeholder="Mô tả hoàn cảnh..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="descEn">Mô tả (Tiếng Anh)</Label>
                            <Textarea
                                id="descEn"
                                name="descEn"
                                value={formData.descEn}
                                onChange={handleChange}
                                placeholder="Description..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Phân loại <span className="text-red-500">*</span></Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn phân loại" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="landscape">Phong cảnh (Landscape)</SelectItem>
                                    <SelectItem value="life">Đời sống (Life)</SelectItem>
                                    <SelectItem value="nature">Thiên nhiên (Nature)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <ImageUpload
                            value={formData.url || ""}
                            onChange={(url) => setFormData({ ...formData, url: url })}
                            label="Hình ảnh khoảnh khắc"
                            folder="pastoral"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu Khoảnh Khắc
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
