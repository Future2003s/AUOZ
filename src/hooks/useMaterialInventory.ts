import { useState, useEffect, useCallback } from 'react';
import { MaterialInventoryState, HopTonItem, NhanTonItem, SanPham, LogEntry, NhanTo } from '@/types/materials';
import { addWeightedGia, getCurrentTimeStr } from '@/lib/materials-utils';

const STORAGE_KEY = 'maton_v4_react';

const INITIAL_STATE: MaterialInventoryState = {
    kho: [{ id: 'k1', ten: 'Kho Chính', dc: '' }],
    linhKien: {
        nap: { ten: 'Nắp Hộp', donGia: 5000 },
        day: { ten: 'Đáy Hộp', donGia: 3000 },
        khay: { ten: 'Khay Cài', donGia: 2000 },
    },
    sanPham: [
        { id: 'sp1', ten: 'Hộp Làm Hoa 6', bong: 6, gia: 50000, ct: [{ lk: 'nap', sl: 1, gc: 'Nắp 6' }, { lk: 'day', sl: 1, gc: 'Đáy 8' }, { lk: 'khay', sl: 1, gc: 'Khay Cài' }] },
        { id: 'sp2', ten: 'Hộp Làm Hoa 12', bong: 12, gia: 70000, ct: [{ lk: 'nap', sl: 1, gc: 'Nắp 12' }, { lk: 'day', sl: 1, gc: 'Đáy 8' }, { lk: 'khay', sl: 1, gc: 'Khay Cài' }] },
        { id: 'sp3', ten: 'Hộp Làm Hoa 20', bong: 20, gia: 100000, ct: [{ lk: 'nap', sl: 1, gc: 'Nắp 20' }, { lk: 'day', sl: 1, gc: 'Đáy 5' }, { lk: 'khay', sl: 1, gc: 'Khay Cài' }] },
    ],
    hopTon: { k1: { nap: { ton: 0, giaTB: 5000 }, day: { ton: 0, giaTB: 3000 }, khay: { ton: 0, giaTB: 2000 } } },
    nLoai: {
        nl1: { ten: 'Nhãn Mật Ong 500g', mau: 'Vàng gold', kt: '5x7cm', min: 100 },
        nl2: { ten: 'Nhãn Mật Ong 1kg', mau: 'Nâu đồng', kt: '6x9cm', min: 100 },
        nl3: { ten: 'Nhãn Hủ 250g', mau: 'Trắng', kt: '4x5cm', min: 50 },
    },
    nTo: {
        to1: { ten: 'Tờ A4 Mix 500g+1kg', nhaIn: 'Nhà In ABC', kt: 'A4', tp: [{ loai: 'nl1', sl: 10 }, { loai: 'nl2', sl: 8 }] },
        to2: { ten: 'Tờ Cuộn Hủ 250g', nhaIn: 'Nhà In XYZ', kt: 'Cuộn', tp: [{ loai: 'nl3', sl: 20 }] },
    },
    nhanTon: { k1: { nl1: { soCai: 0, giaTB: 0 }, nl2: { soCai: 0, giaTB: 0 }, nl3: { soCai: 0, giaTB: 0 } } },
    nToTon: { to1: 0, to2: 0 },
    ls: [],
    gKho: 'all',
};

export const useMaterialInventory = () => {
    const [state, setState] = useState<MaterialInventoryState>(INITIAL_STATE);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed: MaterialInventoryState = JSON.parse(stored);

                // Ensure data integrity (fill missing keys)
                parsed.kho.forEach(k => {
                    if (!parsed.hopTon[k.id]) parsed.hopTon[k.id] = {};
                    if (!parsed.nhanTon[k.id]) parsed.nhanTon[k.id] = {};

                    Object.keys(parsed.linhKien).forEach(lk => {
                        if (!parsed.hopTon[k.id][lk]) parsed.hopTon[k.id][lk] = { ton: 0, giaTB: 0 };
                    });

                    Object.keys(parsed.nLoai).forEach(nl => {
                        if (!parsed.nhanTon[k.id][nl]) parsed.nhanTon[k.id][nl] = { soCai: 0, giaTB: 0 };
                    });
                });

                setState(parsed);
            }
        } catch (e) {
            console.error('Failed to load materials inventory from local storage', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to local storage whenever state changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state, isLoaded]);

    // --- ACTIONS ---

    const setGlobalKho = (khoId: string) => {
        setState(prev => ({ ...prev, gKho: khoId }));
    };

    const importBoxPart = (khoId: string, lkId: string, quantity: number, price: number, note: string) => {
        setState(prev => {
            const next = structuredClone(prev);
            addWeightedGia(next.hopTon[khoId][lkId], quantity, price);

            next.ls.push({
                mod: 'hop',
                type: 'nhap',
                kho: khoId,
                lk: lkId,
                lkTen: next.linhKien[lkId]?.ten || lkId,
                sl: quantity,
                gia: price,
                tt: quantity * price,
                gc: note,
                time: getCurrentTimeStr()
            } as any); // Type assertion for brevity since the full union type is complex

            return next;
        });
    };

    const importBoxPartsBatch = (rows: { lk: string; kho: string; sl: number; gia: number }[]) => {
        setState(prev => {
            const next = structuredClone(prev);
            rows.forEach(r => {
                if (!r.sl || r.sl <= 0 || !r.lk || !r.kho) return;
                addWeightedGia(next.hopTon[r.kho][r.lk], r.sl, r.gia || 0);

                next.ls.push({
                    mod: 'hop',
                    type: 'nhap',
                    kho: r.kho,
                    lk: r.lk,
                    lkTen: next.linhKien[r.lk]?.ten || r.lk,
                    sl: r.sl,
                    gia: r.gia || 0,
                    tt: r.sl * (r.gia || 0),
                    gc: 'Hàng loạt',
                    time: getCurrentTimeStr()
                } as any);
            });
            return next;
        });
    };

    const exportBoxes = (khoId: string, spId: string, bong: number, note: string) => {
        setState(prev => {
            const next = structuredClone(prev);
            const sp = next.sanPham.find((s: SanPham) => s.id === spId);
            if (!sp) return prev;

            const soNap = Math.ceil(bong / (sp.bong || 1));

            sp.ct.forEach(item => {
                next.hopTon[khoId][item.lk].ton -= item.sl * soNap;
            });

            next.ls.push({
                mod: 'hop',
                type: 'xuat',
                kho: khoId,
                sp: spId,
                spTen: sp.ten,
                bong: bong,
                soNap: soNap,
                gc: note,
                time: getCurrentTimeStr()
            } as any);

            return next;
        });
    };

    const importLabelSheet = (khoId: string, toId: string, sheetCount: number, pricePerSheet: number, note: string) => {
        setState(prev => {
            const next = structuredClone(prev);
            const to = next.nTo[toId];
            if (!to) return prev;

            next.nToTon[toId] = (next.nToTon[toId] || 0) + sheetCount;

            const totalLabelsOnSheet = to.tp.reduce((s, tp) => s + tp.sl, 0);
            const pricePerLabel = totalLabelsOnSheet > 0 && pricePerSheet > 0 ? pricePerSheet / totalLabelsOnSheet : 0;

            const details: string[] = [];

            to.tp.forEach(tp => {
                const added = tp.sl * sheetCount;
                addWeightedGia(next.nhanTon[khoId][tp.loai], added, pricePerLabel);
                details.push(`${next.nLoai[tp.loai]?.ten || tp.loai}: +${added}`);
            });

            next.ls.push({
                mod: 'nhan',
                type: 'nhap-to',
                kho: khoId,
                toId: toId,
                toTen: to.ten,
                soTo: sheetCount,
                gia: pricePerSheet,
                tt: pricePerSheet * sheetCount,
                detail: details.join(', '),
                gc: note,
                time: getCurrentTimeStr()
            } as any);

            return next;
        });
    };

    // --- GETTERS & COMPUTED ---

    const lkName = (id: string) => state.linhKien[id]?.ten || id;
    const khoName = (id: string) => state.kho.find(k => k.id === id)?.ten || id;
    const nLoaiName = (id: string) => state.nLoai[id]?.ten || id;

    const getHopTon = (khoId: string, lkId: string) => state.hopTon?.[khoId]?.[lkId]?.ton || 0;
    const getHopGia = (khoId: string, lkId: string) => state.hopTon?.[khoId]?.[lkId]?.giaTB || 0;
    const getAllHopTon = (lkId: string) => state.kho.reduce((s, k) => s + getHopTon(k.id, lkId), 0);

    const getNTon = (khoId: string, loaiId: string) => state.nhanTon?.[khoId]?.[loaiId]?.soCai || 0;
    const getNGia = (khoId: string, loaiId: string) => state.nhanTon?.[khoId]?.[loaiId]?.giaTB || 0;
    const getAllNTon = (loaiId: string) => state.kho.reduce((s, k) => s + getNTon(k.id, loaiId), 0);

    const calcMaxHop = (sp: SanPham, khoId: string) => {
        let min = Infinity;
        sp.ct.forEach(item => {
            const t = khoId === 'all' ? getAllHopTon(item.lk) : getHopTon(khoId, item.lk);
            min = Math.min(min, Math.floor(t / item.sl));
        });
        return min === Infinity ? 0 : min;
    };

    return {
        state,
        isLoaded,

        // Actions
        setGlobalKho,
        importBoxPart,
        importBoxPartsBatch,
        exportBoxes,
        importLabelSheet,

        // Getters
        lkName,
        khoName,
        nLoaiName,
        getHopTon,
        getHopGia,
        getAllHopTon,
        getNTon,
        getNGia,
        getAllNTon,
        calcMaxHop
    };
};
