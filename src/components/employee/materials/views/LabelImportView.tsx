import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input, Select, InputGroup } from '../shared/FormControls';
import { AlertBadge } from '../shared/AlertBadge';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { Tag, ScrollText } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/materials-utils';

export const LabelImportView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state, importLabelSheet } = inventory;
    const [successMsg, setSuccessMsg] = useState('');

    const [khoId, setKhoId] = useState(state.kho[0].id);
    const [toId, setToId] = useState(Object.keys(state.nTo)[0] || '');
    const [sl, setSl] = useState('');
    const [gia, setGia] = useState('');
    const [note, setNote] = useState('');

    const selectedTo = state.nTo[toId];

    const handleImport = () => {
        const numSl = parseInt(sl);
        const numGia = parseInt(gia) || 0;

        if (!numSl || numSl <= 0) {
            alert("Số lượng tờ/cuộn không hợp lệ!");
            return;
        }

        importLabelSheet(khoId, toId, numSl, numGia, note);
        setSuccessMsg(`Nhập thành công ${numSl} tờ/cuộn nhãn hỗn hợp.`);
        setSl(''); setGia(''); setNote('');
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <ScrollText className="w-7 h-7 text-orange-500" />
                    Nhập Lô In Nhãn
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Nhập nhãn theo "Tờ/Cuộn". Hệ thống sẽ tự động cắt ra số cái nhãn lẻ nhập vào kho tương ứng.</p>
            </div>

            <AlertBadge show={!!successMsg} msg={successMsg} type="ok" />

            <Card>
                <div className="p-2 sm:p-4">
                    <InputGroup label="1. Chọn Kho Nhận" className="mb-6 max-w-sm">
                        <Select value={khoId} onChange={e => setKhoId(e.target.value)}>
                            {state.kho.map(k => <option key={k.id} value={k.id}>{k.ten}</option>)}
                        </Select>
                    </InputGroup>

                    <InputGroup label="2. Chọn Mẫu Tờ In (Template)" className="mb-6">
                        <Select value={toId} onChange={e => setToId(e.target.value)}>
                            {Object.entries(state.nTo).map(([id, to]) => (
                                <option key={id} value={id}>{to.ten} ({to.nhaIn})</option>
                            ))}
                        </Select>
                    </InputGroup>

                    {/* Quy đổi visualizer */}
                    {selectedTo && (
                        <div className="mb-6 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4">
                            <div className="text-sm font-bold text-orange-800 dark:text-orange-400 border-b border-orange-200/50 dark:border-orange-900/50 pb-2 mb-3">
                                Cấu trúc kỹ thuật 1 {selectedTo.kt === 'Cuộn' ? 'Cuộn' : 'Tờ'}:
                            </div>
                            <div className="space-y-2">
                                {selectedTo.tp.map((tp, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-sm border border-orange-100 dark:border-orange-900/30">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            <Tag className="inline w-3.5 h-3.5 mr-1.5 text-orange-400" />
                                            {state.nLoai[tp.loai]?.ten || tp.loai}
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">cắt được {tp.sl} cái</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <InputGroup label="Số lượng in (Tờ / Cuộn)">
                            <Input
                                type="number"
                                placeholder="VD: 50"
                                value={sl}
                                onChange={e => setSl(e.target.value)}
                            />
                        </InputGroup>
                        <InputGroup label="Chi phí 1 Tờ / Cuộn">
                            <Input
                                type="number"
                                placeholder="VD: 15000"
                                value={gia}
                                onChange={e => setGia(e.target.value)}
                            />
                        </InputGroup>
                    </div>

                    <InputGroup label="3. Ghi Chú (Tùy chọn)" className="mb-8">
                        <Input
                            type="text"
                            placeholder="Hóa đơn #123 của nhà in ABC..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </InputGroup>

                    <div className="flex justify-end p-4 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="honey" onClick={handleImport} className="min-w-[150px] bg-orange-600 hover:bg-orange-700">
                            Xác nhận Nhập & Cắt Lẻ Kho
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
