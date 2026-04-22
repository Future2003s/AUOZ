"use client";
import React from 'react';
import { Droplet, Flower2, MapPin, Search, HeartPulse, ThermometerSun } from 'lucide-react';
import useTranslations from '@/i18n/useTranslations';

export default function LycheeHoneyInfographic() {
    const t = useTranslations();

    const InfographicData = [
        {
            title: t("lychee_honey.characteristics", "ĐẶC TÍNH"),
            icon: <Droplet className="w-5 h-5 text-amber-600" strokeWidth={1.5} />,
            desc: t("lychee_honey.characteristics_desc", "Hương thơm đặc biệt, được ví như dòng \"nước hoa ăn được\". Cực kỳ hoàn hảo khi kết hợp với sữa chua, cà phê hay hoa quả.")
        },
        {
            title: t("lychee_honey.season", "MÙA HOA VẢI"),
            icon: <Flower2 className="w-5 h-5 text-amber-600" strokeWidth={1.5} />,
            desc: t("lychee_honey.season_desc", "Chỉ nở rộ một lần vào cuối tháng 2 đến cuối tháng 3. Chỉ thu hoạch 1-2 vòng mật mỗi năm nên cực kỳ quý hiếm.")
        },
        {
            title: t("lychee_honey.origin", "XUẤT XỨ"),
            icon: <MapPin className="w-5 h-5 text-amber-600" strokeWidth={1.5} />,
            desc: t("lychee_honey.origin_desc", "Khai thác 100% tự nhiên từ vải Thanh Hà, Hải Dương. Đa phần xuất khẩu nên rất ít khi được bán nội địa.")
        },
        {
            title: t("lychee_honey.pure", "NGUYÊN CHẤT"),
            icon: <Search className="w-5 h-5 text-amber-600" strokeWidth={1.5} />,
            desc: t("lychee_honey.pure_desc", "Bảo toàn nguyên vẹn lợi khuẩn sống, không thủy phần sấy nhiệt, tạo khí gas và tiếng nổ nhẹ khi mở nắp - minh chứng mật thô.")
        },
        {
            title: t("lychee_honey.benefits", "CÔNG DỤNG"),
            icon: <HeartPulse className="w-5 h-5 text-amber-600" strokeWidth={1.5} />,
            desc: t("lychee_honey.benefits_desc", "Làm đẹp da, ngăn ngừa nhiệt miệng, cảm cúm. Dùng 2 thìa uống trước khi ngủ mang lại giấc ngủ sâu và thư thái.")
        },
        {
            title: t("lychee_honey.storage", "BẢO QUẢN"),
            icon: <ThermometerSun className="w-5 h-5 text-amber-600" strokeWidth={1.5} />,
            desc: t("lychee_honey.storage_desc", "Tránh ánh nắng trực tiếp. Mật có thể kết tủa dưới 10°C, ngâm qua nước ấm dưới 50°C sẽ trở lại trạng thái trong veo.")
        }
    ];

    return (
        <section className="w-full bg-white border-b border-gray-100 py-8 lg:py-12 relative overflow-hidden">
            {/* Nền Gradient mờ */}
            <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-amber-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-orange-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header rút gọn */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div className="max-w-2xl">
                        <p className="text-amber-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                            {t("lychee_honey.subtitle", "Đặc sản vùng Thanh Hà, Hải Dương")}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-serif text-slate-800 tracking-tight">
                            {t("lychee_honey.title", "Bí Mật Về Mật Ong Hoa Vải")}
                        </h2>
                    </div>
                    <div className="hidden md:block w-32 h-[1px] bg-gradient-to-r from-transparent via-amber-300 to-amber-500 mb-2"></div>
                </div>

                {/* Lưới Bento Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {InfographicData.map((item, index) => (
                        <div
                            key={index}
                            className="group relative p-5 md:p-6 bg-[#FCFAf5] border border-amber-100/50 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-100/50 flex-shrink-0 flex flex-col items-center justify-center border border-amber-200/50 group-hover:bg-amber-100 transition-colors">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-2 font-serif group-hover:text-amber-700 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-600 text-[13px] leading-relaxed font-medium">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
