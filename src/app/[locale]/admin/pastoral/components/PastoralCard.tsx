"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Map } from "lucide-react";
import Image from "next/image";
import { PastoralImage } from "@/apiRequests/pastoral";

interface PastoralCardProps {
    pastoral: PastoralImage;
    onEdit: (pastoral: PastoralImage) => void;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

export function PastoralCard({
    pastoral,
    onEdit,
    onDelete,
    isDeleting,
}: PastoralCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex flex-col gap-2 mb-2">
                            <CardTitle className="text-lg">{pastoral.titleVi}</CardTitle>
                            <div className="text-sm text-gray-500 italic">"{pastoral.titleEn}"</div>

                            <div className="mt-2">
                                <Badge variant="outline" className="capitalize">
                                    {pastoral.category === "landscape" ? "Phong cảnh" : pastoral.category === "life" ? "Đời sống" : "Thiên nhiên"}
                                </Badge>
                            </div>
                        </div>
                        {pastoral.descVi && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                {pastoral.descVi}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {pastoral.url && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 bg-gray-100 flex items-center justify-center">
                        <Image
                            src={pastoral.url}
                            alt={pastoral.titleVi}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                )}

                <div className="flex items-center justify-end pt-4 border-t gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(pastoral)}
                    >
                        <Edit className="w-4 h-4 mr-1" />
                        Sửa
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(pastoral._id!)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Xóa
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
