import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input, Select, InputGroup, Label } from '../shared/FormControls';
import { AlertBadge } from '../shared/AlertBadge';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { PlusCircle, Trash2, Box, Info } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/materials-utils';

export const BoxImportView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state, importBoxPart, importBoxPartsBatch } = inventory;
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [successMsg, setSuccessMsg] = useState('');
    const [khoId, setKhoId] = useState(state.kho[0].id);

    // Single import state
    const [lkId, setLkId] = useState('nap');
    const [sl, setSl] = useState('');
    const [gia, setGia] = useState('');
    const [note, setNote] = useState('');

    // Batch import state
    const defaultRow = { lk: 'nap', sl: '', gia: '' };
    const [batchRows, setBatchRows] = useState([defaultRow]);

    const autoGia = state.linhKien[lkId]?.donGia || 0;

    const handleSingleSubmit = () => {
        const numSl = parseInt(sl);
        let numGia = parseInt(gia);
        if (isNaN(numGia)) numGia = autoGia;

        if (!numSl || numSl <= 0) {
            alert("Số lượng không hợp lệ!");
            return;
        }

        importBoxPart(khoId, lkId, numSl, numGia, note);
        setSuccessMsg(`Đã nhập thành công ${formatNumber(numSl)} ${state.linhKien[lkId].ten}`);
        setSl(''); setGia(''); setNote('');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleBatchSubmit = () => {
        const validRows = batchRows.filter(r => parseInt(r.sl) > 0);
        if (validRows.length === 0) {
            alert("Chưa có dữ liệu nhập hợp lệ.");
            return;
        }

        const payload = validRows.map(r => ({
            kho: khoId,
            lk: r.lk,
            sl: parseInt(r.sl),
            gia: parseInt(r.gia) || state.linhKien[r.lk].donGia
        }));

        importBoxPartsBatch(payload);

        setSuccessMsg(`Đã nhập hàng loạt thành công ${validRows.length} mã.`);
        setBatchRows([defaultRow]);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                        <Box className="w-7 h-7 text-amber-500" />
                        Nhập Kho Linh Kiện Hộp
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Ghi nhận số lượng nắp, đáy, khay cài... mua mớ về kho.</p>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setMode('single')}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${mode === 'single' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Nhập Lẻ
                    </button>
                    <button
                        onClick={() => setMode('batch')}
                        className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${mode === 'batch' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Nhập Lô
                    </button>
                </div>
            </div>

            <AlertBadge show={!!successMsg} msg={successMsg} type="ok" />

            <Card>
                <div className="p-2 sm:p-4">
                    <InputGroup label="Chọn Kho Nhận Hàng" className="mb-6 max-w-sm">
                        <Select value={khoId} onChange={e => setKhoId(e.target.value)}>
                            {state.kho.map(k => <option key={k.id} value={k.id}>{k.ten}</option>)}
                        </Select>
                    </InputGroup>

                    {mode === 'single' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <InputGroup label="Linh kiện">
                                    <Select value={lkId} onChange={e => setLkId(e.target.value)}>
                                        {Object.entries(state.linhKien).map(([id, lk]) => (
                                            <option key={id} value={id}>{lk.ten}</option>
                                        ))}
                                    </Select>
                                </InputGroup>
                                <InputGroup label="Số lượng cọc (Cái)">
                                    <Input
                                        type="number"
                                        placeholder="VD: 1000"
                                        value={sl}
                                        onChange={e => setSl(e.target.value)}
                                    />
                                </InputGroup>
                                <InputGroup label={`Đơn giá nhập (Mặc định: ${formatCurrency(autoGia)})`}>
                                    <Input
                                        type="number"
                                        placeholder={autoGia.toString()}
                                        value={gia}
                                        onChange={e => setGia(e.target.value)}
                                    />
                                </InputGroup>
                                <InputGroup label="Ghi chú (Tùy chọn)">
                                    <Input
                                        type="text"
                                        placeholder="NCC ABC..."
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                    />
                                </InputGroup>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Hệ thống tự động tính giá trung bình dựa trên lượng tồn hiện có.
                                </div>
                                <Button variant="gold" onClick={handleSingleSubmit} className="min-w-[120px]">
                                    Phiếu Nhập Lẻ
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 dark:bg-slate-800/50 grid grid-cols-12 gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="col-span-5"><Label className="mb-0">Linh Kiện</Label></div>
                                    <div className="col-span-3"><Label className="mb-0">Số Lượng</Label></div>
                                    <div className="col-span-3"><Label className="mb-0">Giá (Bỏ trống = Mặc định)</Label></div>
                                    <div className="col-span-1 text-center"><Label className="mb-0">Xóa</Label></div>
                                </div>

                                <div className="p-3 space-y-3">
                                    {batchRows.map((row, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-5">
                                                <Select
                                                    value={row.lk}
                                                    onChange={e => {
                                                        const newRows = [...batchRows];
                                                        newRows[index].lk = e.target.value;
                                                        setBatchRows(newRows);
                                                    }}
                                                >
                                                    {Object.entries(state.linhKien).map(([id, lk]) => (
                                                        <option key={id} value={id}>{lk.ten}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    placeholder="SL"
                                                    value={row.sl}
                                                    onChange={e => {
                                                        const newRows = [...batchRows];
                                                        newRows[index].sl = e.target.value;
                                                        setBatchRows(newRows);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    placeholder={formatCurrency(state.linhKien[row.lk]?.donGia || 0)}
                                                    value={row.gia}
                                                    onChange={e => {
                                                        const newRows = [...batchRows];
                                                        newRows[index].gia = e.target.value;
                                                        setBatchRows(newRows);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                {batchRows.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newRows = [...batchRows];
                                                            newRows.splice(index, 1);
                                                            setBatchRows(newRows);
                                                        }}
                                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setBatchRows([...batchRows, { lk: 'nap', sl: '', gia: '' }])}
                                    className="flex items-center gap-2 border-dashed border-2"
                                >
                                    <PlusCircle className="w-4 h-4" /> Thêm Dòng LK
                                </Button>

                                <Button variant="gold" onClick={handleBatchSubmit} className="min-w-[150px]">
                                    Hoàn Tất Nhập Lô
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
