'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Share2,
    Maximize2,
    Image as ImageIcon,
    Camera,
    TrendingUp,
    Award,
    ArrowRight
} from 'lucide-react';
import { pastoralApi, PastoralImage } from '@/apiRequests/pastoral';

// --- MOCK TEXT DATA ---
const GALLERY_DATA = {
    vi: {
        title: 'Bộ Sưu Tập Cao Cấp',
        subtitle: 'Khám phá thế giới qua lăng kính của chúng tôi',
        storyTitle: 'Câu Chuyện Đằng Sau Ống Kính',
        storyText: 'Mỗi bức ảnh không chỉ là một khoảnh khắc được lưu giữ, mà còn là một câu chuyện chân thực về cuộc sống, con người và vẻ đẹp của tự nhiên.',
        featuredIn: 'ĐƯỢC VINH DANH TRONG',
        filterAll: 'Tất cả',
        filterLandscape: 'Phong cảnh',
        filterLife: 'Đời sống',
        filterNature: 'Thiên nhiên',
        emptyState: 'Không tìm thấy khoảnh khắc nào phù hợp.',
        ctaTitle: 'Bạn Bị Lôi Cuốn Bởi Những Khoảnh Khắc Này?',
        ctaText: 'Hãy để chúng tôi giúp bạn kiến tạo và lưu giữ những câu chuyện của riêng bạn hoặc nâng tầm thương hiệu của bạn qua nghệ thuật nhiếp ảnh.',
        ctaButton: 'Liên Hệ Hợp Tác Ngay',
        shareSuccess: 'Đã chia sẻ thành công!',
        shareError: 'Không thể chia sẻ lúc này.'
    },
    en: {
        title: 'Premium Collection',
        subtitle: 'Explore the world through our lens',
        storyTitle: 'The Story Behind The Lens',
        storyText: 'Every photograph is more than just a captured moment; it is a true story about life, people, and the eternal beauty of nature. We are dedicated to translating the vast world into these emotionally resonant frames.',
        featuredIn: 'PROUDLY FEATURED IN',
        filterAll: 'All',
        filterLandscape: 'Landscape',
        filterLife: 'Lifestyle',
        filterNature: 'Nature',
        emptyState: 'No moments found for this category.',
        ctaTitle: 'Captivated By These Moments?',
        ctaText: 'Let us help you create and preserve your own stories or elevate your brand through the art of photography.',
        ctaButton: 'Contact For Collaboration',
        shareSuccess: 'Shared successfully!',
        shareError: 'Could not share right now.'
    }
};

// Component xử lý load ảnh mượt mà
const PremiumImage = ({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="relative w-full h-full bg-slate-200 overflow-hidden">
            {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-slate-200 flex items-center justify-center">
                    <ImageIcon className="text-slate-300 w-8 h-8" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
                className={`${className} transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
            />
        </div>
    );
};

export default function PremiumGalleryClient({
    defaultLang = 'vi',
}: {
    defaultLang?: 'vi' | 'en';
}) {
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [isScrolled, setIsScrolled] = useState(false);
    const [shareTooltip, setShareTooltip] = useState<string | null>(null);

    // API State
    const [photos, setPhotos] = useState<PastoralImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const lang = defaultLang;
    const t = GALLERY_DATA[lang];

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                setIsLoading(true);
                const res = await pastoralApi.getAll();
                if (res.success) {
                    setPhotos(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch pastoral images:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPhotos();
    }, []);

    const filteredPhotos = photos.filter((photo) =>
        activeFilter === 'all' ? true : photo.category === activeFilter
    );

    // Hiệu ứng thanh cuộn
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNextPhoto = useCallback(() => {
        setSelectedPhotoIndex((prev) =>
            prev === null ? 0 : prev === filteredPhotos.length - 1 ? 0 : prev + 1
        );
    }, [filteredPhotos.length]);

    const handlePrevPhoto = useCallback(() => {
        setSelectedPhotoIndex((prev) =>
            prev === null ? 0 : prev === 0 ? filteredPhotos.length - 1 : prev - 1
        );
    }, [filteredPhotos.length]);

    // Xử lý phím tắt Lightbox
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (selectedPhotoIndex === null) return;
            if (e.key === 'Escape') setSelectedPhotoIndex(null);
            if (e.key === 'ArrowLeft') handlePrevPhoto();
            if (e.key === 'ArrowRight') handleNextPhoto();
        },
        [selectedPhotoIndex, handlePrevPhoto, handleNextPhoto]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        if (selectedPhotoIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [handleKeyDown, selectedPhotoIndex]);

    // Xử lý Web Share API
    const handleShare = async () => {
        if (selectedPhotoIndex === null) return;

        const photoInfo = filteredPhotos[selectedPhotoIndex];
        const title = lang === 'vi' ? photoInfo.titleVi : photoInfo.titleEn;
        const text = lang === 'vi' ? photoInfo.descVi : photoInfo.descEn;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: title,
                    text: text,
                    url: window.location.href,
                });
                showTooltip(t.shareSuccess);
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                showTooltip(t.shareSuccess);
            }
        } catch (err) {
            console.error('Error sharing:', err);
            // Ignore AbortError (user cancelled)
            if ((err as Error).name !== 'AbortError') {
                showTooltip(t.shareError);
            }
        }
    };

    const showTooltip = (msg: string) => {
        setShareTooltip(msg);
        setTimeout(() => setShareTooltip(null), 2500);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-200 selection:text-emerald-900 overflow-x-hidden">
            {/* --- HEADER w/ STORYTELLING --- */}
            <header className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 text-center overflow-hidden w-full">
                {/* Full-width Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/cauChuyenBackGround.jpg"
                        alt="Pastoral Background"
                        className="w-full h-full object-cover opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/0 via-[#F8FAFC]/5 to-[#F8FAFC]/10"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    {/* Background decorative blob */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 animate-fade-in-up bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 drop-shadow-sm">
                        {t.title}
                    </h1>

                    {/* Storytelling block */}
                    <div className="mt-12 p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-xl ring-1 ring-white/50 animate-fade-in mx-auto max-w-3xl relative overflow-hidden group transition-all duration-500">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center justify-center gap-2">
                            <Camera className="w-5 h-5 text-emerald-600" />
                            {t.storyTitle}
                        </h3>
                        <p className="text-base md:text-lg text-slate-700 leading-relaxed font-medium italic">
                            "{t.storyText}"
                        </p>
                    </div>
                </div>
            </header>

            {/* --- STICKY FILTER BAR --- */}
            <div
                className={`sticky top-0 z-30 transition-all duration-300 ${isScrolled
                    ? 'py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm'
                    : 'py-8 bg-transparent'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 flex justify-center">
                    <div className="inline-flex p-1.5 bg-slate-100/90 backdrop-blur-md rounded-full shadow-inner ring-1 ring-slate-200/50 overflow-x-auto hide-scrollbar max-w-full">
                        {[
                            { id: 'all', label: t.filterAll },
                            { id: 'landscape', label: t.filterLandscape },
                            { id: 'life', label: t.filterLife },
                            { id: 'nature', label: t.filterNature },
                        ].map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setActiveFilter(cat.id);
                                    setSelectedPhotoIndex(null);
                                }}
                                className={`relative whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 
                  ${activeFilter === cat.id
                                        ? 'text-white shadow-lg shadow-emerald-900/20'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                            >
                                {activeFilter === cat.id && (
                                    <span className="absolute inset-0 rounded-full bg-emerald-600 -z-10 animate-fade-in shadow-md"></span>
                                )}
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MASONRY GRID --- */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[50vh]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-500 font-medium">Đang tải ảnh...</p>
                    </div>
                ) : (
                    <>
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                            {filteredPhotos.map((photo, index) => (
                                <div
                                    key={photo._id || index}
                                    onClick={() => setSelectedPhotoIndex(index)}
                                    className="relative rounded-3xl cursor-pointer group break-inside-avoid shadow-sm hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 ring-1 ring-slate-900/5 overflow-hidden bg-white"
                                >
                                    <PremiumImage
                                        src={photo.url}
                                        alt={lang === 'vi' ? photo.titleVi : photo.titleEn}
                                        className="w-full h-auto object-cover group-hover:scale-105"
                                    />

                                    {/* Premium Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-8">
                                        {/* Expand Icon */}
                                        <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 delay-100 shadow-xl">
                                            <Maximize2 size={18} />
                                        </div>

                                        <h4 className="text-white font-bold text-xl md:text-2xl transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                                            {lang === 'vi' ? photo.titleVi : photo.titleEn}
                                        </h4>
                                        <p className="text-emerald-100 font-medium text-sm mt-3 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-500 delay-75 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100">
                                            {lang === 'vi' ? photo.descVi : photo.descEn}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State Premium */}
                        {filteredPhotos.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-32 text-slate-400 animate-fade-in">
                                <div className="bg-slate-100 p-6 rounded-full mb-6 ring-1 ring-slate-200">
                                    <ImageIcon size={48} className="text-slate-300" />
                                </div>
                                <p className="text-xl font-medium text-slate-600">{t.emptyState}</p>
                                <button
                                    onClick={() => setActiveFilter('all')}
                                    className="mt-6 text-emerald-600 font-semibold hover:text-emerald-700 hover:underline underline-offset-4"
                                >
                                    {lang === 'vi' ? 'Xem tất cả ảnh' : 'View all photos'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* --- CALL TO ACTION BANNER (New) --- */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden p-10 md:p-16 text-center shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-900 z-0"></div>
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <Award className="w-12 h-12 text-emerald-400 mb-6" />
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                            {t.ctaTitle}
                        </h2>
                        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                            {t.ctaText}
                        </p>
                        <button className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-emerald-600 rounded-full hover:bg-emerald-500 shadow-lg shadow-emerald-900/50 hover:shadow-emerald-500/30 hover:-translate-y-1 overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                {t.ctaButton}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* --- PREMIUM LIGHTBOX --- */}
            {selectedPhotoIndex !== null && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl transition-all duration-300 animate-fade-in pl-0">

                    {/* Top Controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="text-white/80 text-sm font-bold tracking-widest bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-md ring-1 ring-white/20 shadow-lg">
                            {selectedPhotoIndex + 1}{' '}
                            <span className="text-white/30 mx-1">/</span> {filteredPhotos.length}
                        </div>
                        <div className="flex gap-3 md:gap-4 relative">
                            {/* Share Tooltip */}
                            {shareTooltip && (
                                <div className="absolute -bottom-10 right-16 whitespace-nowrap bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-md animate-fade-in-up">
                                    {shareTooltip}
                                    <div className="absolute -top-1 right-4 w-2 h-2 bg-emerald-600 rotate-45"></div>
                                </div>
                            )}
                            <button
                                onClick={handleShare}
                                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 md:p-4 transition-all duration-300 ring-1 ring-white/20 hover:ring-white/40 hover:scale-105 shadow-lg group"
                                title="Chia sẻ"
                            >
                                <Share2 size={20} className="group-hover:text-emerald-400 transition-colors" />
                            </button>
                            <button
                                onClick={() => setSelectedPhotoIndex(null)}
                                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 md:p-4 transition-all duration-300 ring-1 ring-white/20 hover:ring-white/40 hover:scale-105 shadow-lg"
                                title="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Center Content: Nav + Image */}
                    <div className="flex-1 w-full flex items-center justify-center relative px-4 md:px-20 mb-28 md:mb-36 mt-16 md:mt-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                        {/* Nav Previous */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePrevPhoto();
                            }}
                            className="absolute left-2 md:left-8 text-white/50 hover:text-white bg-transparent hover:bg-white/10 rounded-full p-3 transition-all duration-300 z-50 focus:outline-none hover:scale-110"
                        >
                            <ChevronLeft size={40} strokeWidth={1.5} />
                        </button>

                        {/* Main Image */}
                        <div
                            className="relative w-full h-full flex flex-col items-center justify-center"
                            onClick={() => setSelectedPhotoIndex(null)}
                        >
                            <img
                                src={filteredPhotos[selectedPhotoIndex].url}
                                alt="Fullscreen view"
                                className="max-w-full max-h-[65vh] md:max-h-[75vh] object-contain shadow-2xl rounded-sm animate-zoom-in"
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Floating Caption inside Lightbox */}
                            <div
                                className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl bg-black/70 backdrop-blur-xl p-6 rounded-3xl ring-1 ring-white/30 animate-fade-in-up shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                                    {lang === 'vi'
                                        ? filteredPhotos[selectedPhotoIndex].titleVi
                                        : filteredPhotos[selectedPhotoIndex].titleEn}
                                </h3>
                                <p className="text-white/70 text-sm md:text-base leading-relaxed">
                                    {lang === 'vi'
                                        ? filteredPhotos[selectedPhotoIndex].descVi
                                        : filteredPhotos[selectedPhotoIndex].descEn}
                                </p>
                            </div>
                        </div>

                        {/* Nav Next */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleNextPhoto();
                            }}
                            className="absolute right-2 md:right-8 text-white/50 hover:text-white bg-transparent hover:bg-white/10 rounded-full p-3 transition-all duration-300 z-50 focus:outline-none hover:scale-110"
                        >
                            <ChevronRight size={40} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* Bottom Thumbnail Strip */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 md:h-36 bg-black/60 border-t border-white/10 backdrop-blur-lg flex items-center px-4 overflow-x-auto hide-scrollbar pb-6 pt-6 z-50">
                        <div className="flex items-center gap-3 md:gap-4 mx-auto">
                            {filteredPhotos.map((photo, index) => (
                                <button
                                    key={photo._id || index}
                                    onClick={() => setSelectedPhotoIndex(index)}
                                    className={`relative h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ${selectedPhotoIndex === index
                                        ? 'ring-2 ring-emerald-400 scale-110 opacity-100 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                                        : 'opacity-40 hover:opacity-100 hover:scale-100 ring-1 ring-white/20'
                                        }`}
                                >
                                    <img
                                        src={photo.url}
                                        alt={`Thumbnail ${index}`}
                                        className="w-full h-full object-cover"
                                    />
                                    {selectedPhotoIndex === index && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- CUSTOM ANIMATION STYLES --- */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes zoom-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
                }}
            />
        </div>
    );
}
