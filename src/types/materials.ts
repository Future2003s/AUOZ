export interface Kho {
    id: string;
    ten: string;
    dc?: string;
}

export interface LinhKien {
    ten: string;
    donGia: number;
}

export interface CT_SanPham {
    lk: string;
    sl: number;
    gc: string;
}

export interface SanPham {
    id: string;
    ten: string;
    bong: number;
    gia: number;
    ct: CT_SanPham[];
}

export interface HopTonItem {
    ton: number;
    giaTB: number;
}

export interface NhanLoai {
    ten: string;
    mau: string;
    kt: string;
    min: number;
}

export interface TP_NhanTo {
    loai: string;
    sl: number;
}

export interface NhanTo {
    ten: string;
    nhaIn: string;
    kt: string;
    tp: TP_NhanTo[];
}

export interface NhanTonItem {
    soCai: number;
    giaTB: number;
}

// Log entries
export type LogEntryType = 'hop' | 'nhan';
export type LogActionType = 'nhap' | 'xuat' | 'nhap-to' | 'chuyen';

export interface BaseLogEntry {
    mod: LogEntryType;
    type: LogActionType;
    kho: string;
    time: string;
    gc?: string;
}

export interface HopNhapLogEntry extends BaseLogEntry {
    mod: 'hop';
    type: 'nhap';
    lk: string;
    lkTen: string;
    sl: number;
    gia: number;
    tt: number;
}

export interface HopXuatLogEntry extends BaseLogEntry {
    mod: 'hop';
    type: 'xuat';
    sp: string;
    spTen: string;
    bong: number;
    soNap: number;
}

export interface NhanToNhapLogEntry extends BaseLogEntry {
    mod: 'nhan';
    type: 'nhap-to';
    toId: string;
    toTen: string;
    soTo: number;
    gia: number;
    tt: number;
    detail: string;
}

export interface NhanXuatLogEntry extends BaseLogEntry {
    mod: 'nhan';
    type: 'xuat';
    loai: string;
    loaiTen: string;
    sl: number;
}

export type LogEntry =
    | HopNhapLogEntry
    | HopXuatLogEntry
    | NhanToNhapLogEntry
    | NhanXuatLogEntry;

export interface MaterialInventoryState {
    kho: Kho[];
    linhKien: Record<string, LinhKien>;
    sanPham: SanPham[];
    hopTon: Record<string, Record<string, HopTonItem>>; // khoId -> linhKienId -> HopTonItem
    nLoai: Record<string, NhanLoai>;
    nTo: Record<string, NhanTo>;
    nhanTon: Record<string, Record<string, NhanTonItem>>; // khoId -> nhanLoaiId -> NhanTonItem
    nToTon: Record<string, number>; // nToId -> count
    ls: LogEntry[];
    gKho: string; // "all" or khoId
}
