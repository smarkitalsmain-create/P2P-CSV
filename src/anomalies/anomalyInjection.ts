import seedrandom from 'seedrandom';
import type { Vendor, PurchaseOrder, GRN, Invoice, Payment } from '../schemas';
import {
  getTestStepIdsForAnomaly,
  getTestStepInfo,
} from './testStepMapping';

// ============================================================================
// Anomaly Configuration
// ============================================================================

export interface AnomalyConfig {
  seed: string | number;
  missing_pan_pct?: number; // Percentage of vendors missing PAN/GST
  duplicate_vendor_pan_pct?: number; // Percentage of vendors with duplicate PAN
  duplicate_vendor_bank_pct?: number; // Percentage of vendors with duplicate bank accounts
  vendor_without_approval_pct?: number; // Percentage of vendors created without approval
  bank_change_unverified_pct?: number; // Percentage of bank changes that are unverified
  inactive_vendor_used_pct?: number; // Percentage of POs/invoices using inactive vendors
  duplicate_invoice_number_pct?: number; // Percentage of invoices with duplicate numbers
  invoice_without_grn_pct?: number; // Percentage of invoices without GRN (when policy requires it)
  payment_before_invoice_pct?: number; // Percentage of payments with date before invoice date
}

// ============================================================================
// Truth Record for Anomalies
// ============================================================================

export interface AnomalyTruthRecord {
  test_step_id: string; // e.g., "TS-003"
  test_step_name: string;
  process_area: string; // e.g., "vendor_master", "procurement", "payment"
  entity_type: 'vendor' | 'po' | 'grn' | 'invoice' | 'payment' | 'quote' | 'contract' | 'pr';
  entity_id: string; // Primary identifier
  secondary_ids?: string; // Optional JSON string with related IDs
  planted_fields: string; // Comma-separated list of fields that were modified
  planted_values_summary: string; // Short summary of what was planted
  expected_flag: boolean; // true if this is an expected anomaly (injected), false if unexpected
  notes?: string; // Optional additional notes
}

// ============================================================================
// Anomaly to Test Step ID Mapping
// ============================================================================
// Mappings are now centralized in testStepMapping.ts
// This ensures TS names never go out of sync

// ============================================================================
// Helper Functions
// ============================================================================

let anomalyIdCounter = 1;

function generateAnomalyId(): string {
  return `ANOM${String(anomalyIdCounter++).padStart(8, '0')}`;
}

function resetAnomalyIdCounter(): void {
  anomalyIdCounter = 1;
}

// ============================================================================
// Anomaly Injection Functions
// ============================================================================

/**
 * 1. Vendor missing PAN/GST
 * Removes PAN/GST from a percentage of vendors
 */
function injectMissingPanGst(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('missing_pan_gst');
  if (tsIds.length === 0) return;
  // Select deterministically from available TS IDs
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  const count = Math.floor(vendors.length * percentage / 100);
  const selectedVendors = vendors
    .filter(v => v.pan || v.gstin) // Only vendors that have PAN/GST
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const vendor of selectedVendors) {
    const hasPan = !!vendor.pan;
    const hasGstin = !!vendor.gstin;
    const plantedFields: string[] = [];
    const plantedValues: string[] = [];

    if (hasPan) {
      vendor.pan = undefined;
      plantedFields.push('pan');
      plantedValues.push('removed');
    }
    if (hasGstin) {
      vendor.gstin = undefined;
      plantedFields.push('gstin');
      plantedValues.push('removed');
    }

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'vendor',
      entity_id: vendor.vendor_id,
      secondary_ids: undefined,
      planted_fields: plantedFields.join(','),
      planted_values_summary: `Removed ${plantedFields.join(' and ')}`,
      expected_flag: true,
      notes: `Removed PAN: ${hasPan}, Removed GSTIN: ${hasGstin}`,
    });
  }
}

/**
 * 2. Duplicate Vendor PAN
 * Creates duplicate PANs across vendors
 */
function injectDuplicateVendorPan(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('duplicate_vendor_pan');
  if (tsIds.length === 0) return;
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  const vendorsWithPan = vendors.filter(v => v.pan && v.pan.length > 0);
  if (vendorsWithPan.length < 2) return;

  const count = Math.floor(vendorsWithPan.length * percentage / 100);
  const shuffled = vendorsWithPan.sort(() => rng() - 0.5);
  
  // Take first vendor's PAN and duplicate it to others
  const sourceVendor = shuffled[0];
  const targetVendors = shuffled.slice(1, count);

  for (const vendor of targetVendors) {
    if (sourceVendor.pan) {
      const originalPan = vendor.pan;
      vendor.pan = sourceVendor.pan;

      truthRecords.push({
        test_step_id: testStepInfo.testStepId,
        test_step_name: testStepInfo.testStepName,
        process_area: testStepInfo.processArea,
        entity_type: 'vendor',
        entity_id: vendor.vendor_id,
        secondary_ids: JSON.stringify({ source_vendor_id: sourceVendor.vendor_id }),
        planted_fields: 'pan',
        planted_values_summary: `PAN set to ${sourceVendor.pan} (duplicated from ${sourceVendor.vendor_id})`,
        expected_flag: true,
        notes: `PAN duplicated from ${sourceVendor.vendor_id}: ${sourceVendor.pan}. Original: ${originalPan}`,
      });
    }
  }
}

/**
 * 3. Duplicate Vendor Bank Account
 * Creates duplicate bank accounts across vendors
 */
function injectDuplicateVendorBank(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('duplicate_vendor_bank');
  if (tsIds.length === 0) return;
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  const count = Math.floor(vendors.length * percentage / 100);
  const shuffled = vendors.sort(() => rng() - 0.5);
  
  // Take first vendor's bank account and duplicate it to others
  const sourceVendor = shuffled[0];
  const targetVendors = shuffled.slice(1, count);

  for (const vendor of targetVendors) {
    const originalBankAccount = vendor.bank_account;
    const originalIfsc = vendor.ifsc;
    vendor.bank_account = sourceVendor.bank_account;
    if (sourceVendor.ifsc) {
      vendor.ifsc = sourceVendor.ifsc;
    }

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'vendor',
      entity_id: vendor.vendor_id,
      secondary_ids: JSON.stringify({ source_vendor_id: sourceVendor.vendor_id }),
      planted_fields: 'bank_account,ifsc',
      planted_values_summary: `Bank account ${sourceVendor.bank_account} duplicated from ${sourceVendor.vendor_id}`,
      expected_flag: true,
      notes: `Bank account duplicated from ${sourceVendor.vendor_id}: ${sourceVendor.bank_account}`,
    });
  }
}

/**
 * 4. Vendor created without approval
 * Marks vendors as unverified (no verified_by, no verification_date)
 */
function injectVendorWithoutApproval(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('vendor_without_approval');
  if (tsIds.length === 0) return;
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  const count = Math.floor(vendors.length * percentage / 100);
  const selectedVendors = vendors
    .filter(v => v.verified_by || v.verification_date) // Only vendors that have approval
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const vendor of selectedVendors) {
    vendor.verified_by = undefined;
    vendor.verification_date = undefined;

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'vendor',
      entity_id: vendor.vendor_id,
      secondary_ids: undefined,
      planted_fields: 'verified_by,verification_date',
      planted_values_summary: 'Removed verification fields',
      expected_flag: true,
      notes: 'Removed verification fields',
    });
  }
}

/**
 * 5. Bank changed but not verified
 * Sets bank_change_verification to false for vendors with bank changes
 */
function injectBankChangeUnverified(
  vendors: Vendor[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('bank_change_unverified');
  if (tsIds.length === 0) return;
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  // First, ensure some vendors have bank_change_verification = true
  const vendorsWithVerifiedChanges = vendors.filter(v => v.bank_change_verification === true);
  const count = Math.floor(vendors.length * percentage / 100);
  const selectedVendors = vendors
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const vendor of selectedVendors) {
    vendor.bank_change_verification = false;

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'vendor',
      entity_id: vendor.vendor_id,
      secondary_ids: undefined,
      planted_fields: 'bank_change_verification',
      planted_values_summary: 'Bank change marked as unverified (false)',
      expected_flag: true,
      notes: 'Bank change marked as unverified',
    });
  }
}

/**
 * 6. Inactive vendor used in PO/Invoice/Payment
 * Changes vendor status to inactive, then marks POs/Invoices/Payments using them as anomalies
 */
function injectInactiveVendorUsed(
  vendors: Vendor[],
  purchaseOrders: PurchaseOrder[],
  invoices: Invoice[],
  payments: Payment[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  // Inactive vendor used maps to different TS IDs based on entity type
  // TS-063 for PO, TS-132 for invoice, TS-142 for payment

  const activeVendors = vendors.filter(v => v.status === 'active');
  const count = Math.floor(activeVendors.length * percentage / 100);
  const vendorsToDeactivate = activeVendors
    .sort(() => rng() - 0.5)
    .slice(0, count);

  // Create vendor ID set for quick lookup
  const deactivatedVendorIds = new Set<string>();

  for (const vendor of vendorsToDeactivate) {
    vendor.status = 'inactive';
    deactivatedVendorIds.add(vendor.vendor_id);
  }

  // Find POs using deactivated vendors (use TS-063)
  const poTestStepInfo = getTestStepInfo('TS-063');
  if (poTestStepInfo) {
    const posUsingInactiveVendors = purchaseOrders.filter(po => deactivatedVendorIds.has(po.vendor_id));
    for (const po of posUsingInactiveVendors) {
      truthRecords.push({
        test_step_id: poTestStepInfo.testStepId,
        test_step_name: poTestStepInfo.testStepName,
        process_area: poTestStepInfo.processArea,
        entity_type: 'po',
        entity_id: po.po_no,
        secondary_ids: JSON.stringify({ vendor_id: po.vendor_id }),
        planted_fields: 'vendor_status',
        planted_values_summary: `Vendor ${po.vendor_id} marked inactive`,
        expected_flag: true,
        notes: `Vendor ${po.vendor_id} is inactive but used in PO`,
      });
    }
  }

  // Find invoices using deactivated vendors (use TS-132)
  const invoiceTestStepInfo = getTestStepInfo('TS-132');
  if (invoiceTestStepInfo) {
    const invoicesUsingInactiveVendors = invoices.filter(inv => deactivatedVendorIds.has(inv.vendor_id));
    for (const invoice of invoicesUsingInactiveVendors) {
      truthRecords.push({
        test_step_id: invoiceTestStepInfo.testStepId,
        test_step_name: invoiceTestStepInfo.testStepName,
        process_area: invoiceTestStepInfo.processArea,
        entity_type: 'invoice',
        entity_id: invoice.invoice_no,
        secondary_ids: JSON.stringify({ vendor_id: invoice.vendor_id }),
        planted_fields: 'vendor_status',
        planted_values_summary: `Vendor ${invoice.vendor_id} marked inactive`,
        expected_flag: true,
        notes: `Vendor ${invoice.vendor_id} is inactive but used in invoice`,
      });
    }
  }

  // Find payments using deactivated vendors (use TS-142)
  const paymentTestStepInfo = getTestStepInfo('TS-142');
  if (paymentTestStepInfo) {
    const paymentsUsingInactiveVendors = payments.filter(pay => deactivatedVendorIds.has(pay.vendor_id));
    for (const payment of paymentsUsingInactiveVendors) {
      truthRecords.push({
        test_step_id: paymentTestStepInfo.testStepId,
        test_step_name: paymentTestStepInfo.testStepName,
        process_area: paymentTestStepInfo.processArea,
        entity_type: 'payment',
        entity_id: payment.payment_id,
        secondary_ids: JSON.stringify({ vendor_id: payment.vendor_id }),
        planted_fields: 'vendor_status',
        planted_values_summary: `Vendor ${payment.vendor_id} marked inactive`,
        expected_flag: true,
        notes: `Vendor ${payment.vendor_id} is inactive but used in payment`,
      });
    }
  }
}

/**
 * 7. Duplicate invoice number
 * Creates duplicate invoice numbers
 */
function injectDuplicateInvoiceNumber(
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('duplicate_invoice_number');
  if (tsIds.length === 0) return;
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  const count = Math.floor(invoices.length * percentage / 100);
  const shuffled = invoices.sort(() => rng() - 0.5);
  
  // Take first invoice's number and duplicate it to others
  const sourceInvoice = shuffled[0];
  const targetInvoices = shuffled.slice(1, count);

  for (const invoice of targetInvoices) {
    const originalInvoiceNo = invoice.invoice_no;
    invoice.invoice_no = sourceInvoice.invoice_no;

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'invoice',
      entity_id: invoice.invoice_no,
      secondary_ids: JSON.stringify({ source_invoice_no: sourceInvoice.invoice_no, original_invoice_no: originalInvoiceNo }),
      planted_fields: 'invoice_no',
      planted_values_summary: `Invoice number set to ${sourceInvoice.invoice_no} (duplicated, original: ${originalInvoiceNo})`,
      expected_flag: true,
      notes: `Invoice number duplicated from ${sourceInvoice.invoice_no} (original: ${originalInvoiceNo})`,
    });
  }
}

/**
 * 8. Invoice created without GRN (when policy says GRN required)
 * Removes GRN reference from invoices that should have it
 */
function injectInvoiceWithoutGrn(
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('invoice_without_grn');
  if (tsIds.length === 0) return;
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  const invoicesWithGrn = invoices.filter(inv => inv.grn_no);
  const count = Math.floor(invoicesWithGrn.length * percentage / 100);
  const selectedInvoices = invoicesWithGrn
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const invoice of selectedInvoices) {
    const originalGrnNo = invoice.grn_no;
    invoice.grn_no = undefined;

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'invoice',
      entity_id: invoice.invoice_no,
      secondary_ids: JSON.stringify({ original_grn_no: originalGrnNo }),
      planted_fields: 'grn_no',
      planted_values_summary: `GRN ${originalGrnNo} removed (policy requires GRN)`,
      expected_flag: true,
      notes: `GRN ${originalGrnNo} removed (policy requires GRN)`,
    });
  }
}

/**
 * 9. Payment date before invoice date
 * Sets payment date to before invoice date
 */
function injectPaymentBeforeInvoice(
  payments: Payment[],
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const tsIds = getTestStepIdsForAnomaly('payment_before_invoice');
  if (tsIds.length === 0) return;
  const selectedTsId = tsIds[Math.floor(rng() * tsIds.length)];
  const testStepInfo = getTestStepInfo(selectedTsId);
  if (!testStepInfo) return;

  const invoiceMap = new Map<string, Invoice>();
  for (const invoice of invoices) {
    invoiceMap.set(invoice.invoice_no, invoice);
  }

  const count = Math.floor(payments.length * percentage / 100);
  const selectedPayments = payments
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const payment of selectedPayments) {
    const invoice = invoiceMap.get(payment.invoice_no);
    if (!invoice) continue;

    // Set payment date to before invoice date (1-30 days before)
    const daysBefore = Math.floor(rng() * 30) + 1;
    const invoiceDate = invoice.invoice_date;
    const originalPaymentDate = payment.payment_date;
    payment.payment_date = new Date(invoiceDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'payment',
      entity_id: payment.payment_id,
      secondary_ids: JSON.stringify({ invoice_no: payment.invoice_no }),
      planted_fields: 'payment_date',
      planted_values_summary: `Payment date set ${daysBefore} days before invoice date`,
      expected_flag: true,
      notes: `Payment date set to ${daysBefore} days before invoice date`,
    });
  }
}

// ============================================================================
// Main Injection Function
// ============================================================================

export interface InjectedData {
  vendors: Vendor[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  invoices: Invoice[];
  payments: Payment[];
  truthRecords: AnomalyTruthRecord[];
}

/**
 * Injects anomalies into the generated data
 */
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
  // Reset anomaly ID counter for deterministic behavior
  resetAnomalyIdCounter();
  
  // Initialize seeded random number generator
  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  const truthRecords: AnomalyTruthRecord[] = [];

  // Clone data to avoid mutating original (or work in-place if preferred)
  const vendors = [...data.vendors];
  const purchaseOrders = [...data.purchaseOrders];
  const invoices = [...data.invoices];
  const payments = [...data.payments];

  // Apply each anomaly type
  if (config.missing_pan_pct) {
    injectMissingPanGst(vendors, config.missing_pan_pct, random, truthRecords);
  }

  if (config.duplicate_vendor_pan_pct) {
    injectDuplicateVendorPan(vendors, config.duplicate_vendor_pan_pct, random, truthRecords);
  }

  if (config.duplicate_vendor_bank_pct) {
    injectDuplicateVendorBank(vendors, config.duplicate_vendor_bank_pct, random, truthRecords);
  }

  if (config.vendor_without_approval_pct) {
    injectVendorWithoutApproval(vendors, config.vendor_without_approval_pct, random, truthRecords);
  }

  if (config.bank_change_unverified_pct) {
    injectBankChangeUnverified(vendors, config.bank_change_unverified_pct, random, truthRecords);
  }

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

  if (config.duplicate_invoice_number_pct) {
    injectDuplicateInvoiceNumber(invoices, config.duplicate_invoice_number_pct, random, truthRecords);
  }

  if (config.invoice_without_grn_pct) {
    injectInvoiceWithoutGrn(invoices, config.invoice_without_grn_pct, random, truthRecords);
  }

  if (config.payment_before_invoice_pct) {
    injectPaymentBeforeInvoice(payments, invoices, config.payment_before_invoice_pct, random, truthRecords);
  }

  return {
    vendors,
    purchaseOrders,
    grns: [...data.grns], // GRNs are not mutated
    invoices,
    payments,
    truthRecords,
  };
}

/**
 * Converts truth records to CSV format
 */
export function truthRecordsToCSV(truthRecords: AnomalyTruthRecord[]): string {
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
  
  const rows = truthRecords.map(record => [
    record.test_step_id,
    record.test_step_name,
    record.process_area,
    record.entity_type,
    record.entity_id,
    record.secondary_ids || '',
    record.planted_fields,
    record.planted_values_summary,
    record.expected_flag.toString(),
    (record.notes || '').replace(/"/g, '""'), // Escape quotes for CSV
  ]);

  const csvRows = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell)}"`).join(',')),
  ];

  return csvRows.join('\n');
}

