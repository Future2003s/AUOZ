"use client";

import { PastoralCard } from "./PastoralCard";
import { PastoralImage } from "@/apiRequests/pastoral";
import { Loader } from "@/components/ui/loader";

interface PastoralListProps {
    pastorals: PastoralImage[];
    loading: boolean;
    onEdit: (pastoral: PastoralImage) => void;
    onDelete: (id: string) => void;
    deletingId: string | null;
}

export function PastoralList({
    pastorals,
    loading,
    onEdit,
    onDelete,
    deletingId,
}: PastoralListProps) {
    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader />
            </div>
        );
    }

    if (pastorals.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Chưa có ảnh nào được thêm vào Đồng Quê</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastorals.map((pastoral) => (
                <PastoralCard
                    key={pastoral._id}
                    pastoral={pastoral}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isDeleting={deletingId === pastoral._id}
                />
            ))}
        </div>
    );
}
