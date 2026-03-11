export const formatCurrency = (amount: number | undefined | null): string => {
    return Number(amount || 0).toLocaleString('vi-VN') + '₫';
};

export const formatNumber = (amount: number | undefined | null): string => {
    return Number(amount || 0).toLocaleString('vi-VN');
};

export const getCurrentTimeStr = (): string => {
    return new Date().toLocaleString('vi-VN');
};

/**
 * Adds quantity and recalculates weighted average price.
 * Modifies the `cur` object in place.
 */
export const addWeightedGia = (
    cur: { ton?: number; soCai?: number; giaTB: number },
    addSL: number,
    addGia: number
) => {
    if (addGia > 0) {
        const isHop = cur.ton !== undefined;
        const currentQty = isHop ? cur.ton! : cur.soCai!;

        const oldTotalVal = currentQty * cur.giaTB;
        const newVal = addSL * addGia;
        const newQty = currentQty + addSL;

        const newGia = newQty > 0 ? (oldTotalVal + newVal) / newQty : addGia;

        if (isHop) {
            cur.ton! += addSL;
            cur.giaTB = newGia;
        } else {
            cur.soCai! += addSL;
            cur.giaTB = newGia;
        }
    } else {
        if (cur.ton !== undefined) {
            cur.ton += addSL;
        } else {
            cur.soCai! += addSL;
        }
    }
};

/**
 * Dynamic script loader for XLSX
 */
export const loadXLSX = (): Promise<any> => {
    if (typeof window === 'undefined') return Promise.resolve(null);

    if ((window as any).XLSX) return Promise.resolve((window as any).XLSX);

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => resolve((window as any).XLSX);
        document.head.appendChild(script);
    });
};
