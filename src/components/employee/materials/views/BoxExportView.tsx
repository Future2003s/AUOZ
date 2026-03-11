import React, { useState } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input, Select, InputGroup, Label } from '../shared/FormControls';
import { AlertBadge } from '../shared/AlertBadge';
import { useMaterialInventory } from '@/hooks/useMaterialInventory';
import { PackageOpen, Info } from 'lucide-react';
import { formatNumber } from '@/lib/materials-utils';

export const BoxExportView: React.FC<{ inventory: ReturnType<typeof useMaterialInventory> }> = ({ inventory }) => {
    const { state, exportBoxes, calcMaxHop } = inventory;
    const [successMsg, setSuccessMsg] = useState('');

    const [khoId, setKhoId] = useState(state.gKho === 'all' ? state.kho[0].id : state.gKho);
    const [spId, setSpId] = useState(state.sanPham[0]?.id || '');
    const [bong, setBong] = useState('');
    const [note, setNote] = useState('');

    const selectedSp = state.sanPham.find(s => s.id === spId);
    const maxHop = selectedSp ? calcMaxHop(selectedSp, khoId) : 0;

    // Calculate how many boxes needed for the input flowers
    const bongNum = parseInt(bong) || 0;
    const boxesNeeded = selectedSp && selectedSp.bong > 0 ? Math.ceil(bongNum / selectedSp.bong) : 0;
    const isEnough = boxesNeeded > 0 && boxesNeeded <= maxHop;

    const handleExport = () => {
        if (!bongNum || bongNum <= 0) {
            alert("Số lượng bông không hợp lệ.");
            return;
        }

        if (khoId === 'all') {
            alert("Vui lòng chọn cụ thể 1 kho để xuất hàng, không chọn 'Tất cả Kho'.");
            return;
        }

        if (boxesNeeded > maxHop) {
            alert(`Không đủ linh kiện trong kho! Bạn cần ${boxesNeeded} bộ nắp/đáy/khay, nhưng kho chỉ đủ ghép ${maxHop} bộ.`);
            return;
        }

        exportBoxes(khoId, spId, bongNum, note);

        setSuccessMsg(`Đã xuất kho thành công linh kiện để ghép ${boxesNeeded} hộp (${bongNum} bông).`);
        setBong(''); setNote('');
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                    <PackageOpen className="w-7 h-7 text-amber-500" />
                    Xuất Kho Linh Kiện Hộp
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Xuất thành phẩm hộp ghép hoàn chỉnh dựa theo số lượng hoa.</p>
            </div>

            <AlertBadge show={!!successMsg} msg={successMsg} type="ok" />

            <Card>
                <div className="p-2 sm:p-4">
                    <InputGroup label="1. Chọn Kho Xuất Hàng" className="mb-6 max-w-sm">
                        <Select value={khoId} onChange={e => setKhoId(e.target.value)}>
                            <option value="all" disabled>-- Chọn kho cụ thể --</option>
                            {state.kho.map(k => <option key={k.id} value={k.id}>{k.ten}</option>)}
                        </Select>
                    </InputGroup>

                    <InputGroup label="2. Chọn Sản Phẩm & Nhập Số Lô Bông" className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select value={spId} onChange={e => setSpId(e.target.value)}>
                                {state.sanPham.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.ten} ({sp.bong} bông/hộp)</option>
                                ))}
                            </Select>
                            <Input
                                type="number"
                                placeholder="Nhập số bông cắt ra (VD: 100)"
                                value={bong}
                                onChange={e => setBong(e.target.value)}
                            />
                        </div>
                    </InputGroup>

                    {/* Realtime calculation box */}
                    {selectedSp && bongNum > 0 && (
                        <div className={`p-4 rounded-xl border mb-6 transition-all ${isEnough ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Yêu cầu xuất:</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">{formatNumber(boxesNeeded)} <span className="text-sm">bộ nắp/đáy/khay</span></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 dark:text-slate-400">Khả năng đáp ứng của kho {inventory.khoName(khoId)}:</span>
                                <span className={`text-sm font-bold ${isEnough ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    Tối đa: {formatNumber(maxHop)} bộ
                                </span>
                            </div>
                        </div>
                    )}

                    <InputGroup label="3. Ghi Chú (Tùy chọn)" className="mb-8">
                        <Input
                            type="text"
                            placeholder="Phiếu cắt hoa số #123..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                    </InputGroup>

                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="text-sm font-medium text-slate-500 flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <Info className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Hệ thống tự động tự trừ linh kiện cấu thành tương ứng.</span>
                        </div>
                        <Button
                            variant="gold"
                            onClick={handleExport}
                            className="min-w-[150px]"
                            disabled={bongNum <= 0 || !isEnough || khoId === 'all'}
                        >
                            Xuất Linh Kiện
                        </Button>
                    </div>
                </div>
            </Card>

        </div>
    );
};
