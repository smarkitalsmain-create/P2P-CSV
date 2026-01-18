import seedrandom from 'seedrandom';
import type { Vendor, PurchaseOrder, GRN, Invoice, Payment } from '../schemas';
import { getTestStepIdsForAnomaly, getTestStepInfo } from './testStepMapping';

// ============================================================================
// Types
// ============================================================================

export interface AnomalyConfig {
  seed: string | number;

  // Vendor Master
  missing_pan_pct?: number;                // % vendors missing PAN/GSTIN
  duplicate_vendor_pan_pct?: number;       // % vendors with duplicate PAN
  duplicate_vendor_bank_pct?: number;      // % vendors with duplicate bank account
  vendor_without_approval_pct?: number;    // % vendors without verification
  bank_change_unverified_pct?: number;     // % vendors with unverified bank change

  // Transaction anomalies
  inactive_vendor_used_pct?: number;       // % active vendors to deactivate and then flag usage
  duplicate_invoice_number_pct?: number;   // % invoices to duplicate invoice_no
  invoice_without_grn_pct?: number;        // % invoices where GRN removed
  payment_before_invoice_pct?: number;     // % payments before invoice date
}

export interface AnomalyTruthRecord {
  test_step_id: string;
  test_step_name: string;
  process_area: string;
  entity_type: 'vendor' | 'po' | 'grn' | 'invoice' | 'payment' | 'quote' | 'contract' | 'pr';
  entity_id: string;
  secondary_ids?: string; // JSON string
  planted_fields: string; // comma-separated
  planted_values_summary: string;
  expected_flag: boolean;
  notes?: string;
}

export interface InjectedData {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  invoices: Invoice[];
  payments: Payment[];
  truthRecords: AnomalyTruthRecord[];
}

// ============================================================================
// Helpers
// ============================================================================

let anomalyIdCounter = 1;
function resetAnomalyIdCounter() {
  anomalyIdCounter = 1;
}
function nextAnomalyId(): string {
  return `ANOM${String(anomalyIdCounter++).padStart(8, '0')}`;
}

/**
 * Deterministic Fisher–Yates shuffle
 */
function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Pick up to n random items deterministically.
 */
function pickN<T>(items: T[], n: number, rng: () => number): T[] {
  if (n <= 0) return [];
  const copy = [...items];
  shuffleInPlace(copy, rng);
  return copy.slice(0, Math.min(n, copy.length));
}

/**
 * Safe percent → count
 */
function pctToCount(total: number, pct: number): number {
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return Math.max(0, Math.floor((total * pct) / 100));
}

/**
 * Guard: require vendor_id for truth records and linking
 */
function hasVendorId(v: Vendor): v is Vendor & { vendor_id: string } {
  return typeof (v as any).vendor_id === 'string' && (v as any).vendor_id.length > 0;
}

// ============================================================================
// Injectors
// ============================================================================

function injectMissingPanGst(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const count = pctToCount(vendors.length, percentage);
  if (count === 0) return;

  const tsIds = getTestStepIdsForAnomaly('missing_pan_gst');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const eligible = vendors.filter(v => hasVendorId(v) && ((v as any).pan || (v as any).gstin));
  const chosen = pickN(eligible, count, rng);

  for (const v of chosen) {
    const planted: string[] = [];

    const hadPan = !!(v as any).pan;
    const hadGstin = !!(v as any).gstin;

    if (hadPan) {
      (v as any).pan = undefined;
      planted.push('pan');
    }
    if (hadGstin) {
      (v as any).gstin = undefined;
      planted.push('gstin');
    }

    if (planted.length === 0) continue;

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'vendor',
      entity_id: (v as any).vendor_id,
      planted_fields: planted.join(','),
      planted_values_summary: `Removed ${planted.join(' and ')}`,
      expected_flag: true,
      notes: `Removed PAN=${hadPan}, GSTIN=${hadGstin}, anomaly_id=${nextAnomalyId()}`,
    });
  }
}

function injectDuplicateVendorPan(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const eligible = vendors.filter(v => hasVendorId(v) && typeof (v as any).pan === 'string' && (v as any).pan.length > 0);
  const count = pctToCount(eligible.length, percentage);
  if (count < 2) return;

  const tsIds = getTestStepIdsForAnomaly('duplicate_vendor_pan');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const shuffled = [...eligible];
  shuffleInPlace(shuffled, rng);

  const source = shuffled[0];
  const targets = shuffled.slice(1, Math.min(count, shuffled.length));

  const panToCopy = (source as any).pan as string;

  for (const v of targets) {
    const original = (v as any).pan;
    (v as any).pan = panToCopy;

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'vendor',
      entity_id: (v as any).vendor_id,
      secondary_ids: JSON.stringify({ source_vendor_id: (source as any).vendor_id }),
      planted_fields: 'pan',
      planted_values_summary: `PAN duplicated from ${(source as any).vendor_id}`,
      expected_flag: true,
      notes: `Original PAN=${original}, new PAN=${panToCopy}, anomaly_id=${nextAnomalyId()}`,
    });
  }
}

function injectDuplicateVendorBank(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const eligible = vendors.filter(v => hasVendorId(v) && typeof (v as any).bank_account === 'string' && (v as any).bank_account.length > 0);
  const count = pctToCount(eligible.length, percentage);
  if (count < 2) return;

  const tsIds = getTestStepIdsForAnomaly('duplicate_vendor_bank');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const shuffled = [...eligible];
  shuffleInPlace(shuffled, rng);

  const source = shuffled[0];
  const targets = shuffled.slice(1, Math.min(count, shuffled.length));

  for (const v of targets) {
    const originalBank = (v as any).bank_account;
    const originalIfsc = (v as any).ifsc;

    (v as any).bank_account = (source as any).bank_account;
    if ((source as any).ifsc) (v as any).ifsc = (source as any).ifsc;

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'vendor',
      entity_id: (v as any).vendor_id,
      secondary_ids: JSON.stringify({ source_vendor_id: (source as any).vendor_id }),
      planted_fields: 'bank_account,ifsc',
      planted_values_summary: `Bank duplicated from ${(source as any).vendor_id}`,
      expected_flag: true,
      notes: `Original bank=${originalBank}, original ifsc=${originalIfsc}, anomaly_id=${nextAnomalyId()}`,
    });
  }
}

function injectVendorWithoutApproval(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const eligible = vendors.filter(v => hasVendorId(v) && ((v as any).verified_by || (v as any).verification_date));
  const count = pctToCount(eligible.length, percentage);
  if (count === 0) return;

  const tsIds = getTestStepIdsForAnomaly('vendor_without_approval');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const chosen = pickN(eligible, count, rng);
  for (const v of chosen) {
    (v as any).verified_by = undefined;
    (v as any).verification_date = undefined;

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'vendor',
      entity_id: (v as any).vendor_id,
      planted_fields: 'verified_by,verification_date',
      planted_values_summary: 'Removed verification fields',
      expected_flag: true,
      notes: `anomaly_id=${nextAnomalyId()}`,
    });
  }
}

function injectBankChangeUnverified(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const eligible = vendors.filter(v => hasVendorId(v));
  const count = pctToCount(eligible.length, percentage);
  if (count === 0) return;

  const tsIds = getTestStepIdsForAnomaly('bank_change_unverified');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const chosen = pickN(eligible, count, rng);
  for (const v of chosen) {
    (v as any).bank_change_verification = false;

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'vendor',
      entity_id: (v as any).vendor_id,
      planted_fields: 'bank_change_verification',
      planted_values_summary: 'Bank change marked unverified (false)',
      expected_flag: true,
      notes: `anomaly_id=${nextAnomalyId()}`,
    });
  }
}

function injectInactiveVendorUsed(
  vendors: Vendor[],
  purchaseOrders: PurchaseOrder[],
  invoices: Invoice[],
  payments: Payment[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const eligible = vendors.filter(v => hasVendorId(v) && (v as any).status === 'active');
  const count = pctToCount(eligible.length, percentage);
  if (count === 0) return;

  const toDeactivate = pickN(eligible, count, rng);
  const inactiveIds = new Set<string>();

  for (const v of toDeactivate) {
    (v as any).status = 'inactive';
    inactiveIds.add((v as any).vendor_id);
  }

  // PO anomaly (TS-063)
  const poInfo = getTestStepInfo('TS-063');
  if (poInfo) {
    for (const po of purchaseOrders) {
      if (inactiveIds.has((po as any).vendor_id)) {
        truth.push({
          test_step_id: poInfo.testStepId,
          test_step_name: poInfo.testStepName,
          process_area: poInfo.processArea,
          entity_type: 'po',
          entity_id: (po as any).po_no,
          secondary_ids: JSON.stringify({ vendor_id: (po as any).vendor_id }),
          planted_fields: 'vendor_status',
          planted_values_summary: `Vendor ${(po as any).vendor_id} marked inactive`,
          expected_flag: true,
          notes: `Inactive vendor used in PO, anomaly_id=${nextAnomalyId()}`,
        });
      }
    }
  }

  // Invoice anomaly (TS-132)
  const invInfo = getTestStepInfo('TS-132');
  if (invInfo) {
    for (const inv of invoices) {
      if (inactiveIds.has((inv as any).vendor_id)) {
        truth.push({
          test_step_id: invInfo.testStepId,
          test_step_name: invInfo.testStepName,
          process_area: invInfo.processArea,
          entity_type: 'invoice',
          entity_id: (inv as any).invoice_no,
          secondary_ids: JSON.stringify({ vendor_id: (inv as any).vendor_id }),
          planted_fields: 'vendor_status',
          planted_values_summary: `Vendor ${(inv as any).vendor_id} marked inactive`,
          expected_flag: true,
          notes: `Inactive vendor used in invoice, anomaly_id=${nextAnomalyId()}`,
        });
      }
    }
  }

  // Payment anomaly (TS-142)
  const payInfo = getTestStepInfo('TS-142');
  if (payInfo) {
    for (const pay of payments) {
      if (inactiveIds.has((pay as any).vendor_id)) {
        truth.push({
          test_step_id: payInfo.testStepId,
          test_step_name: payInfo.testStepName,
          process_area: payInfo.processArea,
          entity_type: 'payment',
          entity_id: (pay as any).payment_id,
          secondary_ids: JSON.stringify({ vendor_id: (pay as any).vendor_id }),
          planted_fields: 'vendor_status',
          planted_values_summary: `Vendor ${(pay as any).vendor_id} marked inactive`,
          expected_flag: true,
          notes: `Inactive vendor used in payment, anomaly_id=${nextAnomalyId()}`,
        });
      }
    }
  }
}

function injectDuplicateInvoiceNumber(
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const count = pctToCount(invoices.length, percentage);
  if (count < 2) return;

  const tsIds = getTestStepIdsForAnomaly('duplicate_invoice_number');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const shuffled = [...invoices];
  shuffleInPlace(shuffled, rng);

  const source = shuffled[0];
  const sourceNo = (source as any).invoice_no;

  const targets = shuffled.slice(1, Math.min(count, shuffled.length));
  for (const inv of targets) {
    const original = (inv as any).invoice_no;
    (inv as any).invoice_no = sourceNo;

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'invoice',
      entity_id: (inv as any).invoice_no,
      secondary_ids: JSON.stringify({ source_invoice_no: sourceNo, original_invoice_no: original }),
      planted_fields: 'invoice_no',
      planted_values_summary: `Invoice no duplicated from ${sourceNo}`,
      expected_flag: true,
      notes: `anomaly_id=${nextAnomalyId()}`,
    });
  }
}

function injectInvoiceWithoutGrn(
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const eligible = invoices.filter(inv => !!(inv as any).grn_no);
  const count = pctToCount(eligible.length, percentage);
  if (count === 0) return;

  const tsIds = getTestStepIdsForAnomaly('invoice_without_grn');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const chosen = pickN(eligible, count, rng);
  for (const inv of chosen) {
    const originalGrn = (inv as any).grn_no;
    (inv as any).grn_no = undefined;

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'invoice',
      entity_id: (inv as any).invoice_no,
      secondary_ids: JSON.stringify({ original_grn_no: originalGrn }),
      planted_fields: 'grn_no',
      planted_values_summary: `GRN removed (was ${originalGrn})`,
      expected_flag: true,
      notes: `anomaly_id=${nextAnomalyId()}`,
    });
  }
}

function injectPaymentBeforeInvoice(
  payments: Payment[],
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truth: AnomalyTruthRecord[]
) {
  const count = pctToCount(payments.length, percentage);
  if (count === 0) return;

  const tsIds = getTestStepIdsForAnomaly('payment_before_invoice');
  if (tsIds.length === 0) return;
  const tsId = tsIds[Math.floor(rng() * tsIds.length)];
  const info = getTestStepInfo(tsId);
  if (!info) return;

  const invoiceMap = new Map<string, Invoice>();
  for (const inv of invoices) invoiceMap.set((inv as any).invoice_no, inv);

  const chosen = pickN(payments, count, rng);
  for (const pay of chosen) {
    const inv = invoiceMap.get((pay as any).invoice_no);
    if (!inv) continue;

    const invDate: Date = (inv as any).invoice_date;
    if (!(invDate instanceof Date)) continue;

    const daysBefore = Math.floor(rng() * 30) + 1;
    const originalPaymentDate = (pay as any).payment_date;

    (pay as any).payment_date = new Date(invDate.getTime() - daysBefore * 86400000);

    truth.push({
      test_step_id: info.testStepId,
      test_step_name: info.testStepName,
      process_area: info.processArea,
      entity_type: 'payment',
      entity_id: (pay as any).payment_id,
      secondary_ids: JSON.stringify({ invoice_no: (pay as any).invoice_no }),
      planted_fields: 'payment_date',
      planted_values_summary: `Payment date set ${daysBefore} days before invoice date`,
      expected_flag: true,
      notes: `Original payment_date=${originalPaymentDate instanceof Date ? originalPaymentDate.toISOString() : String(originalPaymentDate)}, anomaly_id=${nextAnomalyId()}`,
    });
  }
}

// ============================================================================
// Main function
// ============================================================================

export function injectAnomalies(
  data: {
    vendors: Vendor[];
    purchaseOrders: PurchaseOrder[];
    grns: GRN[];
    invoices: Invoice[];
    payments: Payment[];
  },
  config: AnomalyConfig
): InjectedData {
  resetAnomalyIdCounter();

  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  // Work on copies to avoid surprising callers
  const vendors = [...data.vendors];
  const purchaseOrders = [...data.purchaseOrders];
  const invoices = [...data.invoices];
  const payments = [...data.payments];

  const truthRecords: AnomalyTruthRecord[] = [];

  if (config.missing_pan_pct) injectMissingPanGst(vendors, config.missing_pan_pct, random, truthRecords);
  if (config.duplicate_vendor_pan_pct) injectDuplicateVendorPan(vendors, config.duplicate_vendor_pan_pct, random, truthRecords);
  if (config.duplicate_vendor_bank_pct) injectDuplicateVendorBank(vendors, config.duplicate_vendor_bank_pct, random, truthRecords);
  if (config.vendor_without_approval_pct) injectVendorWithoutApproval(vendors, config.vendor_without_approval_pct, random, truthRecords);
  if (config.bank_change_unverified_pct) injectBankChangeUnverified(vendors, config.bank_change_unverified_pct, random, truthRecords);

  if (config.inactive_vendor_used_pct) {
    injectInactiveVendorUsed(
      vendors,
      purchaseOrders,
      invoices,
      payments,
      config.inactive_vendor_used_pct,
      random,
      truthRecords
    );
  }

  if (config.duplicate_invoice_number_pct) injectDuplicateInvoiceNumber(invoices, config.duplicate_invoice_number_pct, random, truthRecords);
  if (config.invoice_without_grn_pct) injectInvoiceWithoutGrn(invoices, config.invoice_without_grn_pct, random, truthRecords);
  if (config.payment_before_invoice_pct) injectPaymentBeforeInvoice(payments, data.invoices, config.payment_before_invoice_pct, random, truthRecords);

  return {
    vendors,
    purchaseOrders,
    grns: [...data.grns], // unchanged
    invoices,
    payments,
    truthRecords,
  };
}

// ============================================================================
// CSV export helper
// ============================================================================

export function truthRecordsToCSV(truth: AnomalyTruthRecord[]): string {
  const headers = [
    'test_step_id',
    'test_step_name',
    'process_area',
    'entity_type',
    'entity_id',
    'secondary_ids',
    'planted_fields',
    'planted_values_summary',
    'expected_flag',
    'notes',
  ];

  const escape = (val: unknown) => {
    const s = val === undefined || val === null ? '' : String(val);
    const escaped = s.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const lines = [
    headers.join(','),
    ...truth.map(r => [
      escape(r.test_step_id),
      escape(r.test_step_name),
      escape(r.process_area),
      escape(r.entity_type),
      escape(r.entity_id),
      escape(r.secondary_ids ?? ''),
      escape(r.planted_fields),
      escape(r.planted_values_summary),
      escape(String(r.expected_flag)),
      escape(r.notes ?? ''),
    ].join(',')),
  ];

  return lines.join('\n');
}
