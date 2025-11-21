import { Request, Response, NextFunction } from 'express';
import { HomepageSettings, IHomepageSettings } from '../models/HomepageSettings';
import { asyncHandler } from '../utils/asyncHandler';
import { ResponseHandler } from '../utils/response';
import { AppError } from '../utils/AppError';

const buildDefaultSettings = (): Partial<IHomepageSettings> => ({
    typography: {
        fontFamily: 'Playfair Display',
        baseSize: 16,
        headingScale: { h1: 3, h2: 2, h3: 1.5 },
        lineHeight: 1.6
    } as any,
    colors: {
        primary: '#1D4ED8',
        secondary: '#9333EA',
        accent: '#F97316',
        background: '#FFFFFF',
        text: '#0F172A',
        muted: '#94A3B8'
    },
    sections: {
        hero: {
            enabled: true,
            order: 0,
            data: {
                slides: [
                    {
                        title: 'Tinh tuý từ thiên nhiên',
                        subtitle: 'Sản phẩm mật ong thuần khiết cho gia đình bạn',
                        cta: { label: 'Khám phá ngay', href: '/vi/products', variant: 'solid' },
                        desktopImage: {
                            url: 'https://res.cloudinary.com/demo/image/upload/v1720000000/hero-default.jpg',
                            alt: 'Hero'
                        },
                        overlayOpacity: 0.35
                    }
                ]
            }
        },
        marquee: {
            enabled: true,
            order: 1,
            data: { phrases: ['Mật ong hoa vải • Hương vị tự nhiên • Giao hàng toàn quốc'], speed: 40 }
        },
        about: {
            enabled: true,
            order: 2,
            data: {
                heading: 'Câu chuyện của chúng tôi',
                body: 'Được nuôi dưỡng từ những vườn hoa tốt nhất, mỗi giọt mật mang trong mình sự tận tâm và chăm sóc.',
                media: {
                    url: 'https://res.cloudinary.com/demo/image/upload/v1720000000/about.jpg',
                    alt: 'About section'
                }
            }
        },
        featuredProducts: {
            enabled: true,
            order: 3,
            data: { productIds: [], layout: 'grid' }
        },
        socialProof: {
            enabled: true,
            order: 4,
            data: {
                testimonials: [],
                logos: []
            }
        },
        collection: { enabled: true, order: 5, data: { cards: [] } },
        craft: { enabled: true, order: 6, data: { steps: [] } },
        map: {
            enabled: true,
            order: 7,
            data: { title: 'Nhà máy của chúng tôi', description: 'Hải Phòng, Việt Nam', coordinates: { lat: 20.85, lng: 106.68 } }
        }
    } as any,
    seo: {
        title: 'Trang chủ',
        description: 'Thương hiệu mật ong cao cấp',
        coverImage: {
            url: 'https://res.cloudinary.com/demo/image/upload/v1720000000/seo-cover.jpg',
            alt: 'Cover'
        }
    }
});

const findLatestByStatus = async (status: 'draft' | 'published') => {
    const doc = await HomepageSettings.findOne({ status }).sort({ updatedAt: -1 }).lean<IHomepageSettings>();
    return doc;
};

export const getPublishedHomepage = asyncHandler(async (_req: Request, res: Response) => {
    let settings = await findLatestByStatus('published');

    if (!settings) {
        settings = await HomepageSettings.create({
            ...buildDefaultSettings(),
            status: 'published',
            version: 1
        });
        settings = settings.toObject();
    }

    ResponseHandler.success(res, settings, 'Homepage settings fetched successfully');
});

export const getDraftHomepage = asyncHandler(async (_req: Request, res: Response) => {
    let settings = await findLatestByStatus('draft');
    if (!settings) {
        settings = await findLatestByStatus('published');
    }
    if (!settings) {
        settings = await HomepageSettings.create({
            ...buildDefaultSettings(),
            status: 'draft',
            version: 1
        });
        settings = settings.toObject();
    }

    ResponseHandler.success(res, settings, 'Homepage draft fetched successfully');
});

export const upsertHomepage = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
        return next(new AppError('Invalid payload', 400));
    }

    const status = payload.status === 'published' ? 'published' : 'draft';
    const version = (await HomepageSettings.countDocuments()) + 1;

    const doc = await HomepageSettings.create({
        ...buildDefaultSettings(),
        ...payload,
        status,
        version,
        updatedBy: (req as any).user?.id
    });

    ResponseHandler.created(res, doc, 'Homepage settings saved successfully');
});

