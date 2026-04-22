"use client";
import React, { useEffect, useState } from 'react';
import useTranslations from "@/i18n/useTranslations";
import { Clock, Star, TrendingUp } from "lucide-react";
import { promoWidgetApi, PromoWidget } from "@/apiRequests/promoWidgets";

export default function RightPromoSidebar() {
    const t = useTranslations();
    const [upcomingWidgets, setUpcomingWidgets] = useState<PromoWidget[]>([]);
    const [storyWidgets, setStoryWidgets] = useState<PromoWidget[]>([]);

    useEffect(() => {
        promoWidgetApi.getAll({ isActive: true }).then(res => {
            if (res.success) {
                setUpcomingWidgets(res.data.filter(w => w.position === "right_upcoming"));
                setStoryWidgets(res.data.filter(w => w.position === "right_story"));
            }
        }).catch(err => console.error("Failed to load right promos"));
    }, []);

    if (upcomingWidgets.length === 0 && storyWidgets.length === 0) return null;

    return (
        <div className="space-y-6">
            {/* Coming soon widgets */}
            {upcomingWidgets.map(widget => (
                <div key={widget._id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-amber-400 to-rose-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                            <h3 className="font-extrabold text-gray-900 tracking-tight">Sắp Ra Mắt</h3>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full">New</span>
                    </div>

                    <div className="flex flex-col gap-4 mb-4">
                        {widget.imageUrl && (
                            <div className="w-full h-32 rounded-2xl bg-gray-100 overflow-hidden relative shadow-inner">
                                <img src={widget.imageUrl} alt={widget.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                        )}
                        <div>
                            <h4 className="text-base font-bold text-gray-900 leading-tight mb-1.5 hover:text-amber-600 cursor-pointer transition-colors">{widget.title}</h4>
                            {widget.description && <p className="text-sm text-gray-500 leading-relaxed">{widget.description}</p>}
                        </div>
                    </div>
                    {widget.link && (
                        <a href={widget.link} className="mt-4 flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 text-amber-800 rounded-xl text-sm font-bold w-full hover:bg-amber-100 transition">Khám phá</a>
                    )}
                </div>
            ))}

            {/* Brand story widgets */}
            {storyWidgets.map(widget => (
                <div key={widget._id} className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl group-hover:bg-rose-500/30 transition-all duration-500"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>

                    <div className="relative z-10">
                        <Star className="w-8 h-8 text-yellow-400 mb-5 drop-shadow-md" />
                        <h3 className="text-xl font-black mb-3 tracking-tight drop-shadow-sm">{widget.title}</h3>
                        {widget.description && (
                            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-medium">
                                "{widget.description}"
                            </p>
                        )}
                        <a href={widget.link || "#"} className="inline-flex items-center text-sm font-bold text-white group/btn">
                            Khám Phá Thêm
                            <TrendingUp className="w-4 h-4 ml-1.5 transform group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
}
