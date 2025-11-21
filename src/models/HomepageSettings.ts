import mongoose, { Document, Schema } from 'mongoose';

export interface IHomepageSection<T = any> {
    enabled: boolean;
    order: number;
    data: T;
}

export interface IHomepageSettings extends Document {
    typography: {
        fontFamily: string;
        fontUrl?: string;
        baseSize: number;
        headingScale: {
            h1: number;
            h2: number;
            h3: number;
        };
        lineHeight: number;
    };
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
        muted: string;
    };
    sections: {
        hero: IHomepageSection;
        marquee: IHomepageSection;
        about: IHomepageSection;
        featuredProducts: IHomepageSection;
        socialProof: IHomepageSection;
        collection: IHomepageSection;
        craft: IHomepageSection;
        map: IHomepageSection;
    };
    seo: {
        title: string;
        description: string;
        coverImage?: {
            url: string;
            alt?: string;
        };
    };
    status: 'draft' | 'published';
    version: number;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ImageAssetSchema = new Schema(
    {
        url: { type: String, required: true },
        alt: { type: String },
        focalPoint: {
            x: { type: Number, default: 0.5 },
            y: { type: Number, default: 0.5 }
        }
    },
    { _id: false }
);

const SectionSchema = new Schema(
    {
        enabled: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        data: { type: Schema.Types.Mixed, default: {} }
    },
    { _id: false }
);

const HomepageSettingsSchema = new Schema<IHomepageSettings>(
    {
        typography: {
            fontFamily: { type: String, default: 'Playfair Display' },
            fontUrl: { type: String },
            baseSize: { type: Number, default: 16 },
            headingScale: {
                h1: { type: Number, default: 3 },
                h2: { type: Number, default: 2 },
                h3: { type: Number, default: 1.5 }
            },
            lineHeight: { type: Number, default: 1.6 }
        },
        colors: {
            primary: { type: String, default: '#1D4ED8' },
            secondary: { type: String, default: '#9333EA' },
            accent: { type: String, default: '#F97316' },
            background: { type: String, default: '#FFFFFF' },
            text: { type: String, default: '#0F172A' },
            muted: { type: String, default: '#94A3B8' }
        },
        sections: {
            hero: { type: SectionSchema, default: () => ({ data: { slides: [] } }) },
            marquee: { type: SectionSchema, default: () => ({ data: { phrases: [] } }) },
            about: { type: SectionSchema, default: () => ({ data: {} }) },
            featuredProducts: { type: SectionSchema, default: () => ({ data: { productIds: [] } }) },
            socialProof: { type: SectionSchema, default: () => ({ data: { testimonials: [], logos: [] } }) },
            collection: { type: SectionSchema, default: () => ({ data: { cards: [] } }) },
            craft: { type: SectionSchema, default: () => ({ data: { steps: [] } }) },
            map: { type: SectionSchema, default: () => ({ data: {} }) }
        },
        seo: {
            title: { type: String, default: 'Trang chủ' },
            description: { type: String, default: '' },
            coverImage: { type: ImageAssetSchema, default: null }
        },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        version: { type: Number, default: 1 },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true }
);

export const HomepageSettings =
    mongoose.models.HomepageSettings || mongoose.model<IHomepageSettings>('HomepageSettings', HomepageSettingsSchema);

