"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pastoralApi, type PastoralImage } from "@/apiRequests/pastoral";

import { PastoralForm } from "./components/PastoralForm";
import { PastoralList } from "./components/PastoralList";

export default function PageClient() {
    const [pastorals, setPastorals] = useState<PastoralImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<PastoralImage | null>(null);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPastorals();
    }, []);

    const fetchPastorals = async () => {
        try {
            setLoading(true);
            const response = await pastoralApi.getAll();

            if (response.success && response.data) {
                setPastorals(response.data);
            }
        } catch (error: any) {
            toast.error("Không thể tải danh sách khoảnh khắc Đồng Quê");
            console.error("Error fetching pastorals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditing(null);
        setCreating(true);
    };

    const handleEdit = (pastoral: PastoralImage) => {
        setEditing(pastoral);
        setCreating(false);
    };

    const handleClose = () => {
        setCreating(false);
        setEditing(null);
    };

    const handleSubmit = async (data: Partial<PastoralImage>) => {
        try {
            setSaving(true);
            if (editing) {
                await pastoralApi.update(editing._id!, data);
                toast.success("Cập nhật khoảnh khắc thành công");
            } else {
                await pastoralApi.create(data);
                toast.success("Thêm khoảnh khắc mới thành công");
            }
            handleClose();
            fetchPastorals();
        } catch (error: any) {
            toast.error(
                editing
                    ? "Không thể cập nhật"
                    : "Không thể thêm mới"
            );
            console.error("Error saving pastoral image:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa khoảnh khắc này khỏi thư viện ảnh?")) return;

        try {
            setDeletingId(id);
            await pastoralApi.delete(id);
            toast.success("Đã xóa khoảnh khắc thành công");
            fetchPastorals();
        } catch (error: any) {
            toast.error("Không thể xóa khoảnh khắc");
            console.error("Error deleting pastoral image:", error);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Thư Viện Đồng Quê</h1>
                    <p className="text-gray-600 mt-1">
                        Quản lý thư viện hình ảnh hiển thị tại trang Khoảnh Khắc / Đồng Quê
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm ảnh mới
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <PastoralList
                        pastorals={pastorals}
                        loading={loading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        deletingId={deletingId}
                    />
                </CardContent>
            </Card>

            <PastoralForm
                open={creating || editing !== null}
                onClose={handleClose}
                onSubmit={handleSubmit}
                pastoral={editing}
                isSubmitting={saving}
            />
        </div>
    );
}
