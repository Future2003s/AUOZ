"use client";
import React, { useEffect, useState } from 'react';
import useTranslations from "@/i18n/useTranslations";
import { Sparkles, ArrowRight } from "lucide-react";
import { promoWidgetApi, PromoWidget } from "@/apiRequests/promoWidgets";
import Link from 'next/link';

export default function LeftAdSidebar() {
    const t = useTranslations();
    const [widgets, setWidgets] = useState<PromoWidget[]>([]);

    useEffect(() => {
        promoWidgetApi.getAll({ position: "left_ad", isActive: true }).then(res => {
            if (res.success) setWidgets(res.data);
        }).catch(err => console.error("Failed to load left ad promos"));
    }, []);

    if (widgets.length === 0) return null;

    return (
        <div className="space-y-6">
            {widgets.map(widget => (
                <div key={widget._id} className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-6 border border-rose-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-24 h-24 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm ring-1 ring-rose-200">
                            <Sparkles className="w-3.5 h-3.5" /> Nổi Bật
                        </span>

                        <h3 className="text-xl font-black text-gray-900 mb-3 leading-tight tracking-tight">{widget.title}</h3>
                        {widget.description && (
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed font-medium">
                                {widget.description}
                            </p>
                        )}

                        {widget.imageUrl && (
                            <div className="mb-6 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg relative">
                                <img src={widget.imageUrl} alt={widget.title} className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <p className="absolute bottom-3 left-3 text-white font-bold text-sm tracking-wide">Lala Lycheee</p>
                            </div>
                        )}

                        {widget.link ? (
                            <Link href={widget.link} className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-rose-500/30 active:scale-95 group/btn">
                                Khám Phá Ngay <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        ) : (
                            <button className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-rose-500/30 active:scale-95 group/btn">
                                Xem Chi Tiết <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
