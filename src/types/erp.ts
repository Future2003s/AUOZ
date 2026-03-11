// ============================================================
// src/types/erp.ts
// All TypeScript interfaces for the ERP system.
// No `any` types — strict mode compliant.
// ============================================================

// ─── Common ──────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta: PaginationMeta | Record<string, unknown> | null;
    errors: string | null;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}

// ─── Inventory / Items ────────────────────────────────────────────────────────

export type ItemType = "STORABLE" | "SERVICE" | "CONSUMABLE";
export type StockStatus = "on_dinh" | "sap_het" | "het_hang";

/** Extended item (maps to BeLLLC Inventory model) */
export interface ErpItem {
    _id: string;
    name: string;
    sku?: string;
    unit: string;
    netWeight: number;
    minStock: number;
    price: number;
    location: string;
    category: string;
    quantity: number;
    defectiveQty: number;
    returnedQty: number;
    damagedQty: number;
    pendingCheckQty: number;
    soldQty: number;
    productId?: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    // Virtual
    totalStock: number;
}

// ─── Unit of Measure ──────────────────────────────────────────────────────────

export interface Uom {
    _id: string;
    code: string;
    name: string;
    type: "quantity" | "weight" | "volume" | "length" | "area" | "time" | "other";
}

// ─── Warehouse ────────────────────────────────────────────────────────────────

export interface ErpWarehouse {
    _id: string;
    code: string;
    name: string;
    address?: string;
    city?: string;
    isDefault: boolean;
    isActive: boolean;
}

export interface ErpLocation {
    _id: string;
    warehouseId: string;
    code: string;
    name: string;
    zone?: string;
    aisle?: string;
    rack?: string;
    shelf?: string;
    bin?: string;
    isActive: boolean;
}

// ─── Stock ────────────────────────────────────────────────────────────────────

export type MovementType =
    | "RECEIPT"
    | "ISSUE"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT"
    | "RETURN_IN"
    | "RETURN_OUT"
    | "OPENING"
    | "SCRAP";

export interface StockLedgerEntry {
    _id: string;
    referenceNo?: string;
    referenceType?: string;
    itemId: string;
    locationId: string | { _id: string; code: string; name: string };
    lotId?: string | { _id: string; lotNo: string; expiryDate?: string };
    movementType: MovementType;
    qty: number;
    qtyBalance: number;
    unitCostCents: number;
    totalCostCents: number;
    note?: string;
    createdBy: string | { _id: string; name: string; email: string };
    createdAt: string;
}

export interface StockSnapshot {
    itemId: string;
    locationId: string;
    warehouseId: string;
    qtyOnHand: number;
    qtyReserved: number;
    qtyAvailable: number;
    avgCostCents: number;
    totalValueCents: number;
    lastMovementAt: string;
}

export interface StockSummary {
    itemId: string;
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
    avgCostCents: number;
    totalValueCents: number;
    byLocation: Array<{
        locationId: string;
        warehouseId: string;
        onHand: number;
        reserved: number;
        available: number;
    }>;
}

export interface LowStockAlert {
    itemId: string;
    name: string;
    sku?: string;
    minStock: number;
    qtyAvailable: number;
}

// ─── BOM ──────────────────────────────────────────────────────────────────────

export type BomStatus = "DRAFT" | "ACTIVE" | "OBSOLETE";

export interface BomHeader {
    _id: string;
    bomNo: string;
    productId: string | { _id: string; name: string; sku?: string };
    version: number;
    status: BomStatus;
    description?: string;
    effectivityStart?: string;
    effectivityEnd?: string;
    outputQty: number;
    outputUomId: string | Uom;
    totalMaterialCostCents: number;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BomLine {
    _id: string;
    bomId: string;
    parentLineId?: string;
    componentId: string | { _id: string; name: string; sku?: string; unit: string };
    qty: number;
    uomId: string | Uom;
    scrapBps: number;  // basis points: 500 = 5%
    level: number;
    sortOrder: number;
    unitCostCents: number;
    totalCostCents: number;
    note?: string;
}

/** Recursive BOM tree node for BOMTreeViewer component */
export interface BomNode {
    id: string;
    lineId: string;
    itemId: string;
    itemName: string;
    sku: string | undefined;
    qty: number;
    effectiveQty: number;
    uomCode: string;
    level: number;
    scrapPct: number;
    unitCostCents: number;
    totalCostCents: number;
    stockOnHand: number;
    stockAvailable: number;
    stockStatus: "OK" | "LOW" | "OUT";
    children: BomNode[];
}

/** Flat explosion result row */
export interface MaterialRequirement {
    itemId: string;
    itemName: string;
    sku: string | undefined;
    uomCode: string;
    totalQtyRequired: number;
    stockAvailable: number;
    shortage: number;
    unitCostCents: number;
    totalCostCents: number;
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface ErpVendor {
    _id: string;
    code: string;
    name: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    currency: string;
    paymentTermsDays: number;
    creditLimitCents: number;
    outstandingCents: number;
    rating?: number;
    isActive: boolean;
}

// ─── Purchase Requisition ─────────────────────────────────────────────────────

export type PRStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED" | "CONVERTED";

export interface PRLine {
    _id: string;
    itemId: string | ErpItem;
    description?: string;
    qty: number;
    uomId: string | Uom;
    estimatedPriceCents: number;
    neededBy?: string;
    note?: string;
}

export interface PurchaseRequisition {
    _id: string;
    prNo: string;
    status: PRStatus;
    requestedBy: string | { _id: string; name: string; email: string };
    approvedBy?: string | { _id: string; name: string };
    approvedAt?: string;
    rejectionReason?: string;
    neededBy?: string;
    note?: string;
    lines: PRLine[];
    totalEstimatedCents: number;
    createdAt: string;
    updatedAt: string;
}

// ─── Purchase Order ───────────────────────────────────────────────────────────

export type POStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "SENT" | "PARTIAL" | "RECEIVED" | "CANCELLED";

export interface POLine {
    _id: string;
    poId: string;
    itemId: string | { _id: string; name: string; sku?: string };
    description?: string;
    qty: number;
    unitPriceCents: number;
    uomId: string | Uom;
    promisedDate?: string;
    qtyReceived: number;
    lineTotalCents: number;
}

export interface PurchaseOrder {
    _id: string;
    poNo: string;
    prId?: string;
    vendorId: string | ErpVendor;
    status: POStatus;
    currency: string;
    paymentTermsDays: number;
    expectedDeliveryDate?: string;
    note?: string;
    totalAmountCents: number;
    approvedBy?: string | { _id: string; name: string };
    approvedAt?: string;
    lines?: POLine[];
    createdAt: string;
    updatedAt: string;
}

// ─── Goods Receipt ────────────────────────────────────────────────────────────

export type GRStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface GRLine {
    _id: string;
    grId: string;
    poLineId: string;
    itemId: string | { _id: string; name: string; sku?: string };
    qtyReceived: number;
    qtyAccepted: number;
    qtyRejected: number;
    uomId: string | Uom;
    locationId: string | ErpLocation;
    lotId?: string;
    unitCostCents: number;
    note?: string;
}

export interface GoodsReceipt {
    _id: string;
    grNo: string;
    poId: string | { _id: string; poNo: string };
    vendorId: string | ErpVendor;
    status: GRStatus;
    receivedDate: string;
    receivedBy: string | { _id: string; name: string };
    note?: string;
    confirmedAt?: string;
    lines?: GRLine[];
    createdAt: string;
    updatedAt: string;
}

// ─── 3-Way Match ─────────────────────────────────────────────────────────────

export interface MatchDiscrepancy {
    field: string;
    poValue: number;
    grValue: number;
    invoiceValue: number;
    variance: number;
    withinTolerance: boolean;
}

export interface MatchResult {
    poId: string;
    grId?: string;
    status: "MATCHED" | "DISCREPANCY" | "PENDING_GR";
    discrepancies: MatchDiscrepancy[];
    isAutoApproved: boolean;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface FIFOValuation {
    itemId: string;
    layers: Array<{
        lotId?: string;
        lotNo?: string;
        receivedAt: string;
        originalQty: number;
        remainingQty: number;
        unitCostCents: number;
        totalValueCents: number;
    }>;
    totalQty: number;
    totalValueCents: number;
    avgCostCents: number;
}

// ─── Form Input Schemas ───────────────────────────────────────────────────────

export interface CreateBomFormValues {
    productId: string;
    description?: string;
    effectivityStart?: string;
    effectivityEnd?: string;
    outputQty: number;
    outputUomId: string;
    lines: Array<{
        componentId: string;
        qty: number;
        uomId: string;
        scrapBps: number;
        note?: string;
    }>;
}

export interface CreatePRFormValues {
    note?: string;
    neededBy?: string;
    lines: Array<{
        itemId: string;
        qty: number;
        uomId: string;
        estimatedPriceCents: number;
        neededBy?: string;
        note?: string;
    }>;
}

export interface RecordMovementFormValues {
    itemId: string;
    locationId: string;
    warehouseId: string;
    movementType: MovementType;
    qty: number;
    unitCostCents: number;
    uomId: string;
    lotId?: string;
    note?: string;
}
