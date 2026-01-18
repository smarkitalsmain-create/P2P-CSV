import seedrandom from 'seedrandom';
import type {
  PRHeader,
  PRLine,
  PurchaseOrder,
  GRN,
  Invoice,
  Payment,
} from '../schemas';
import type { AnomalyTruthRecord } from './anomalyInjection';
import { getTestStepInfo } from './testStepMapping';

// ============================================================================
// Process Anomaly Configuration
// ============================================================================

export interface ProcessAnomalyConfig {
  seed: string | number;
  
  // PR Anomalies
  pr_without_approval_pct?: number; // TS-041, TS-044
  pr_bypass_pct?: number; // TS-046
  pr_duplicate_pct?: number; // TS-052
  pr_threshold_violation_pct?: number; // TS-060
  pr_approval_threshold?: number; // Threshold for PR approval
  
  // PO Anomalies
  po_approval_violation_pct?: number; // TS-061, TS-062
  po_inactive_vendor_pct?: number; // TS-063
  po_without_pr_pct?: number; // TS-064
  po_threshold_bypass_pct?: number; // TS-071
  po_approval_threshold?: number; // Threshold for PO approval
  po_tender_threshold?: number; // Threshold for tender requirement
  
  // GRN Anomalies
  grn_without_po_pct?: number; // TS-081, TS-082
  grn_delayed_receipt_pct?: number; // TS-085
  grn_partial_receipt_pct?: number; // TS-088
  grn_delay_days_threshold?: number; // Days threshold for delayed receipt
  
  // Invoice Anomalies
  invoice_without_grn_pct?: number; // TS-116, TS-117
  invoice_vendor_compliance_pct?: number; // TS-120
  invoice_approval_violation_pct?: number; // TS-121
  invoice_approval_threshold?: number; // Threshold for invoice approval
  invoice_tolerance_amount?: number; // Tolerance for invoice amount variance
  
  // Payment Anomalies
  payment_before_invoice_pct?: number; // TS-136, TS-137
  payment_early_discount_pct?: number; // TS-139
  payment_approval_violation_pct?: number; // TS-142
  payment_high_volume_pct?: number; // TS-150
  payment_approval_threshold?: number; // Threshold for payment approval
}

// ============================================================================
// Helper Functions
// ============================================================================
// getTestStepInfo is now imported from testStepMapping.ts to ensure consistency

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================================================
// PR Anomaly Injectors
// ============================================================================

/**
 * TS-041: Standard PR Process / TS-044: PR Without Approval
 * Removes approval from PRs that should have approval
 */
export function injectPRWithoutApproval(
  prHeaders: PRHeader[],
  percentage: number,
  threshold: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-044');
  if (!testStepInfo) return;

  const eligiblePRs = prHeaders.filter(pr => 
    (pr.total_amount || 0) >= threshold && 
    (pr.approved_by || pr.approval_date)
  );

  const count = Math.floor(eligiblePRs.length * percentage / 100);
  const selectedPRs = eligiblePRs
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const pr of selectedPRs) {
    pr.approved_by = undefined;
    pr.approval_date = undefined;
    pr.approval_status = 'pending';

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'pr',
      entity_id: pr.pr_no,
      secondary_ids: undefined,
      planted_fields: 'approved_by,approval_date,approval_status',
      planted_values_summary: 'Removed approval fields, set status to pending',
      expected_flag: true,
      notes: `PR ${pr.pr_no} above threshold ${threshold} without approval`,
    });
  }
}

/**
 * TS-046: PR Bypass Scenarios
 * Creates POs without required PR
 */
export function injectPRBypass(
  purchaseOrders: PurchaseOrder[],
  prHeaders: PRHeader[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-046');
  if (!testStepInfo) return;

  // Note: This is tracked via PO anomaly, PR linking is optional in schema
  // This would be detected by checking if PO has corresponding PR
  // Since PO doesn't have pr_no field, we track this as a PO anomaly
  const count = Math.floor(purchaseOrders.length * percentage / 100);
  
  truthRecords.push({
    test_step_id: testStepInfo.testStepId,
    test_step_name: testStepInfo.testStepName,
    process_area: testStepInfo.processArea,
    entity_type: 'po',
    entity_id: `BYPASS-${count} records`,
    secondary_ids: undefined,
    planted_fields: 'pr_linkage',
    planted_values_summary: `${count} POs created without required PR`,
    expected_flag: true,
    notes: `Detected ${count} POs without PR linkage`,
  });
}

/**
 * TS-052: PR Duplicate Checks
 * Creates duplicate PRs
 */
export function injectPRDuplicate(
  prHeaders: PRHeader[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0 || prHeaders.length < 2) return;

  const testStepInfo = getTestStepInfo('TS-052');
  if (!testStepInfo) return;

  const count = Math.floor(prHeaders.length * percentage / 100);
  const shuffled = prHeaders.sort(() => rng() - 0.5);
  const sourcePR = shuffled[0];
  const targetPRs = shuffled.slice(1, count);

  for (const pr of targetPRs) {
    // Duplicate key fields (keeping unique PR number)
    const originalAmount = pr.total_amount;
    pr.total_amount = sourcePR.total_amount;
    pr.requested_by = sourcePR.requested_by;
    pr.department = sourcePR.department;

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'pr',
      entity_id: pr.pr_no,
      secondary_ids: JSON.stringify({ duplicate_of: sourcePR.pr_no }),
      planted_fields: 'total_amount,requested_by,department',
      planted_values_summary: `PR data duplicated from ${sourcePR.pr_no}`,
      expected_flag: true,
      notes: `PR ${pr.pr_no} duplicated from ${sourcePR.pr_no}`,
    });
  }
}

/**
 * TS-060: PR Audit Scenario
 * Comprehensive PR violations (threshold violations)
 */
export function injectPRThresholdViolations(
  prHeaders: PRHeader[],
  percentage: number,
  threshold: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-060');
  if (!testStepInfo) return;

  const eligiblePRs = prHeaders.filter(pr => (pr.total_amount || 0) < threshold);
  const count = Math.floor(eligiblePRs.length * percentage / 100);
  const selectedPRs = eligiblePRs
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const pr of selectedPRs) {
    const originalAmount = pr.total_amount || 0;
    pr.total_amount = threshold + (rng() * 10000); // Exceed threshold

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'pr',
      entity_id: pr.pr_no,
      secondary_ids: undefined,
      planted_fields: 'total_amount',
      planted_values_summary: `Amount increased from ${originalAmount} to ${pr.total_amount} (exceeds threshold ${threshold})`,
      expected_flag: true,
      notes: `PR ${pr.pr_no} amount exceeds threshold ${threshold}`,
    });
  }
}

// ============================================================================
// PO Anomaly Injectors
// ============================================================================

/**
 * TS-061: Standard PO Process / TS-062: PO Approval Violations
 * POs exceeding approval thresholds without proper approval
 */
export function injectPOApprovalViolations(
  purchaseOrders: PurchaseOrder[],
  percentage: number,
  threshold: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-062');
  if (!testStepInfo) return;

  const eligiblePOs = purchaseOrders.filter(po => 
    po.total_amount >= threshold && 
    (!po.approved_by || !po.approval_date)
  );

  const count = Math.floor(eligiblePOs.length * percentage / 100);
  const selectedPOs = eligiblePOs
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const po of selectedPOs) {
    po.approved_by = undefined;
    po.approval_date = undefined;
    po.approval_status = 'pending';

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'po',
      entity_id: po.po_no,
      secondary_ids: undefined,
      planted_fields: 'approved_by,approval_date,approval_status',
      planted_values_summary: `PO above threshold ${threshold} without approval`,
      expected_flag: true,
      notes: `PO ${po.po_no} amount ${po.total_amount} exceeds threshold ${threshold} without approval`,
    });
  }
}

/**
 * TS-063: PO with Inactive Vendors
 * POs using inactive vendors (already implemented, but ensure TS mapping)
 */
export function injectPOInactiveVendor(
  purchaseOrders: PurchaseOrder[],
  vendors: Array<{ vendor_id: string; status: string }>,
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-063');
  if (!testStepInfo) return;

  const vendorStatusMap = new Map(vendors.map(v => [v.vendor_id, v.status]));
  const posWithInactiveVendors = purchaseOrders.filter(po => 
    vendorStatusMap.get(po.vendor_id) === 'inactive'
  );

  const count = Math.floor(posWithInactiveVendors.length * percentage / 100);
  const selectedPOs = posWithInactiveVendors
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const po of selectedPOs) {
    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'po',
      entity_id: po.po_no,
      secondary_ids: JSON.stringify({ vendor_id: po.vendor_id }),
      planted_fields: 'vendor_status',
      planted_values_summary: `PO uses inactive vendor ${po.vendor_id}`,
      expected_flag: true,
      notes: `PO ${po.po_no} uses inactive vendor ${po.vendor_id}`,
    });
  }
}

/**
 * TS-064: PO Without PR
 * POs created without required PR (tracked as anomaly)
 */
export function injectPOWithoutPR(
  purchaseOrders: PurchaseOrder[],
  prLines: PRLine[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-064');
  if (!testStepInfo) return;

  // Create map of POs that have PR links
  const poWithPR = new Set(prLines.filter(line => line.po_no).map(line => line.po_no!));
  
  const posWithoutPR = purchaseOrders.filter(po => !poWithPR.has(po.po_no));
  const count = Math.floor(posWithoutPR.length * percentage / 100);
  const selectedPOs = posWithoutPR
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const po of selectedPOs) {
    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'po',
      entity_id: po.po_no,
      secondary_ids: undefined,
      planted_fields: 'pr_linkage',
      planted_values_summary: 'PO created without PR linkage',
      expected_flag: true,
      notes: `PO ${po.po_no} created without required PR`,
    });
  }
}

/**
 * TS-071: PO Threshold Bypass
 * POs split to bypass thresholds
 */
export function injectPOThresholdBypass(
  purchaseOrders: PurchaseOrder[],
  percentage: number,
  threshold: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-071');
  if (!testStepInfo) return;

  // Find POs that are just below threshold (potential split indicators)
  const suspiciousPOs = purchaseOrders.filter(po => 
    po.total_amount >= threshold * 0.9 && po.total_amount < threshold
  );

  const count = Math.floor(suspiciousPOs.length * percentage / 100);
  const selectedPOs = suspiciousPOs
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const po of selectedPOs) {
    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'po',
      entity_id: po.po_no,
      secondary_ids: undefined,
      planted_fields: 'total_amount',
      planted_values_summary: `PO amount ${po.total_amount} just below threshold ${threshold} (potential split)`,
      expected_flag: true,
      notes: `PO ${po.po_no} amount ${po.total_amount} suspiciously close to threshold ${threshold}`,
    });
  }
}

// ============================================================================
// GRN Anomaly Injectors
// ============================================================================

/**
 * TS-081: Standard GRN Process / TS-082: GRN Without PO
 * GRNs created without valid PO reference
 */
export function injectGRNWithoutPO(
  grns: GRN[],
  purchaseOrders: PurchaseOrder[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-082');
  if (!testStepInfo) return;

  const validPOs = new Set(purchaseOrders.map(po => po.po_no));
  const grnsWithInvalidPO = grns.filter(grn => !validPOs.has(grn.po_no));

  const count = Math.floor(grnsWithInvalidPO.length * percentage / 100);
  const selectedGRNs = grnsWithInvalidPO
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const grn of selectedGRNs) {
    // Don't break referential integrity - just flag the anomaly
    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'grn',
      entity_id: grn.grn_no,
      secondary_ids: JSON.stringify({ po_no: grn.po_no }),
      planted_fields: 'po_reference',
      planted_values_summary: `GRN references invalid or missing PO ${grn.po_no}`,
      expected_flag: true,
      notes: `GRN ${grn.grn_no} references invalid PO ${grn.po_no}`,
    });
  }
}

/**
 * TS-085: GRN Delayed Receipt
 * GRNs with significant delay from PO date
 */
export function injectGRNDelayedReceipt(
  grns: GRN[],
  purchaseOrders: PurchaseOrder[],
  percentage: number,
  delayThreshold: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-085');
  if (!testStepInfo) return;

  const poMap = new Map(purchaseOrders.map(po => [po.po_no, po]));
  const delayedGRNs = grns.filter(grn => {
    const po = poMap.get(grn.po_no);
    if (!po) return false;
    const daysDelay = Math.floor((grn.grn_date.getTime() - po.po_date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDelay > delayThreshold;
  });

  const count = Math.floor(delayedGRNs.length * percentage / 100);
  const selectedGRNs = delayedGRNs
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const grn of selectedGRNs) {
    const po = poMap.get(grn.po_no)!;
    const daysDelay = Math.floor((grn.grn_date.getTime() - po.po_date.getTime()) / (1000 * 60 * 60 * 24));

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'grn',
      entity_id: grn.grn_no,
      secondary_ids: JSON.stringify({ po_no: grn.po_no }),
      planted_fields: 'grn_date',
      planted_values_summary: `GRN delayed by ${daysDelay} days from PO date`,
      expected_flag: true,
      notes: `GRN ${grn.grn_no} delayed ${daysDelay} days from PO ${grn.po_no} date`,
    });
  }
}

/**
 * TS-088: Partial GRN Scenarios
 * Multiple partial GRNs for same PO (already handled in generation, flag as anomaly)
 */
export function injectGRNPartialReceipt(
  grns: GRN[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-088');
  if (!testStepInfo) return;

  // Group GRNs by PO
  const grnByPO = new Map<string, GRN[]>();
  for (const grn of grns) {
    if (!grnByPO.has(grn.po_no)) {
      grnByPO.set(grn.po_no, []);
    }
    grnByPO.get(grn.po_no)!.push(grn);
  }

  // Find POs with multiple GRNs (partial receipts)
  const partialReceiptPOs = Array.from(grnByPO.entries()).filter(([_, grnList]) => grnList.length > 1);
  const count = Math.floor(partialReceiptPOs.length * percentage / 100);
  const selected = partialReceiptPOs
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const [poNo, grnList] of selected) {
    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'grn',
      entity_id: grnList[0].grn_no,
      secondary_ids: JSON.stringify({ po_no: poNo, grn_count: grnList.length }),
      planted_fields: 'partial_receipt',
      planted_values_summary: `PO ${poNo} has ${grnList.length} partial GRNs`,
      expected_flag: true,
      notes: `PO ${poNo} has ${grnList.length} partial GRNs: ${grnList.map(g => g.grn_no).join(', ')}`,
    });
  }
}

// ============================================================================
// Invoice Anomaly Injectors
// ============================================================================

/**
 * TS-116: Standard Invoice Process / TS-117: Invoice Without GRN
 * Invoices without required GRN (already implemented, ensure TS mapping)
 */
export function injectInvoiceWithoutGRN(
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-117');
  if (!testStepInfo) return;

  const invoicesWithGRN = invoices.filter(inv => inv.grn_no);
  const count = Math.floor(invoicesWithGRN.length * percentage / 100);
  const selectedInvoices = invoicesWithGRN
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
      notes: `Invoice ${invoice.invoice_no} GRN ${originalGrnNo} removed`,
    });
  }
}

/**
 * TS-120: Invoice Vendor Compliance
 * Invoices with vendor compliance issues
 */
export function injectInvoiceVendorCompliance(
  invoices: Invoice[],
  vendors: Array<{ vendor_id: string; pan?: string; gstin?: string; status: string }>,
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-120');
  if (!testStepInfo) return;

  const vendorMap = new Map(vendors.map(v => [v.vendor_id, v]));
  const invoicesWithComplianceIssues = invoices.filter(inv => {
    const vendor = vendorMap.get(inv.vendor_id);
    return vendor && (!vendor.pan || !vendor.gstin || vendor.status !== 'active');
  });

  const count = Math.floor(invoicesWithComplianceIssues.length * percentage / 100);
  const selectedInvoices = invoicesWithComplianceIssues
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const invoice of selectedInvoices) {
    const vendor = vendorMap.get(invoice.vendor_id)!;
    const issues: string[] = [];
    if (!vendor.pan) issues.push('missing PAN');
    if (!vendor.gstin) issues.push('missing GSTIN');
    if (vendor.status !== 'active') issues.push('inactive vendor');

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'invoice',
      entity_id: invoice.invoice_no,
      secondary_ids: JSON.stringify({ vendor_id: invoice.vendor_id }),
      planted_fields: 'vendor_compliance',
      planted_values_summary: `Vendor ${invoice.vendor_id} has compliance issues: ${issues.join(', ')}`,
      expected_flag: true,
      notes: `Invoice ${invoice.invoice_no} uses vendor ${invoice.vendor_id} with issues: ${issues.join(', ')}`,
    });
  }
}

/**
 * TS-121: Invoice Approval Violations
 * Invoices exceeding approval thresholds without proper approval
 */
export function injectInvoiceApprovalViolations(
  invoices: Invoice[],
  percentage: number,
  threshold: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-121');
  if (!testStepInfo) return;

  const eligibleInvoices = invoices.filter(inv => 
    inv.total_amount >= threshold && 
    (!inv.approved_by || !inv.approval_date)
  );

  const count = Math.floor(eligibleInvoices.length * percentage / 100);
  const selectedInvoices = eligibleInvoices
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const invoice of selectedInvoices) {
    invoice.approved_by = undefined;
    invoice.approval_date = undefined;
    invoice.approval_status = 'pending';

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'invoice',
      entity_id: invoice.invoice_no,
      secondary_ids: undefined,
      planted_fields: 'approved_by,approval_date,approval_status',
      planted_values_summary: `Invoice above threshold ${threshold} without approval`,
      expected_flag: true,
      notes: `Invoice ${invoice.invoice_no} amount ${invoice.total_amount} exceeds threshold ${threshold} without approval`,
    });
  }
}

// ============================================================================
// Payment Anomaly Injectors
// ============================================================================

/**
 * TS-136: Standard Payment Process / TS-137: Payment Before Invoice Date
 * Payments made before invoice date (already implemented, ensure TS mapping)
 */
export function injectPaymentBeforeInvoice(
  payments: Payment[],
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-137');
  if (!testStepInfo) return;

  const invoiceMap = new Map(invoices.map(inv => [inv.invoice_no, inv]));
  const count = Math.floor(payments.length * percentage / 100);
  const selectedPayments = payments
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const payment of selectedPayments) {
    const invoice = invoiceMap.get(payment.invoice_no);
    if (!invoice) continue;

    const daysBefore = Math.floor(rng() * 30) + 1;
    payment.payment_date = new Date(invoice.invoice_date.getTime() - daysBefore * 24 * 60 * 60 * 1000);

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
      notes: `Payment ${payment.payment_id} date set ${daysBefore} days before invoice ${payment.invoice_no} date`,
    });
  }
}

/**
 * TS-139: Early Payment Discounts
 * Payments with early payment discounts (flag as potential anomaly if suspicious)
 */
export function injectPaymentEarlyDiscount(
  payments: Payment[],
  invoices: Invoice[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-139');
  if (!testStepInfo) return;

  const invoiceMap = new Map(invoices.map(inv => [inv.invoice_no, inv]));
  const count = Math.floor(payments.length * percentage / 100);
  const selectedPayments = payments
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const payment of selectedPayments) {
    const invoice = invoiceMap.get(payment.invoice_no);
    if (!invoice) continue;

    // Reduce payment amount for early payment discount
    const discount = 0.02; // 2% discount
    payment.payment_amount = invoice.total_amount * (1 - discount);

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'payment',
      entity_id: payment.payment_id,
      secondary_ids: JSON.stringify({ invoice_no: payment.invoice_no, discount_pct: discount * 100 }),
      planted_fields: 'payment_amount',
      planted_values_summary: `Payment amount reduced by ${discount * 100}% for early payment`,
      expected_flag: true,
      notes: `Payment ${payment.payment_id} has ${discount * 100}% early payment discount`,
    });
  }
}

/**
 * TS-142: Payment Approval Violations
 * Payments exceeding approval thresholds without proper approval
 */
export function injectPaymentApprovalViolations(
  payments: Payment[],
  percentage: number,
  threshold: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-142');
  if (!testStepInfo) return;

  const eligiblePayments = payments.filter(pay => 
    pay.payment_amount >= threshold && 
    (!pay.approved_by || !pay.approval_date)
  );

  const count = Math.floor(eligiblePayments.length * percentage / 100);
  const selectedPayments = eligiblePayments
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const payment of selectedPayments) {
    payment.approved_by = undefined;
    payment.approval_date = undefined;
    payment.approval_status = 'pending';

    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'payment',
      entity_id: payment.payment_id,
      secondary_ids: undefined,
      planted_fields: 'approved_by,approval_date,approval_status',
      planted_values_summary: `Payment above threshold ${threshold} without approval`,
      expected_flag: true,
      notes: `Payment ${payment.payment_id} amount ${payment.payment_amount} exceeds threshold ${threshold} without approval`,
    });
  }
}

/**
 * TS-150: Payment High-Volume Scenario
 * High-volume payment processing (flag large volumes)
 */
export function injectPaymentHighVolume(
  payments: Payment[],
  percentage: number,
  rng: () => number,
  truthRecords: AnomalyTruthRecord[]
): void {
  if (percentage <= 0) return;

  const testStepInfo = getTestStepInfo('TS-150');
  if (!testStepInfo) return;

  // Sort by amount and flag high-value payments
  const sortedPayments = [...payments].sort((a, b) => b.payment_amount - a.payment_amount);
  const highValueThreshold = sortedPayments[Math.floor(payments.length * 0.1)]?.payment_amount || 0;
  
  const highValuePayments = payments.filter(pay => pay.payment_amount >= highValueThreshold);
  const count = Math.floor(highValuePayments.length * percentage / 100);
  const selectedPayments = highValuePayments
    .sort(() => rng() - 0.5)
    .slice(0, count);

  for (const payment of selectedPayments) {
    truthRecords.push({
      test_step_id: testStepInfo.testStepId,
      test_step_name: testStepInfo.testStepName,
      process_area: testStepInfo.processArea,
      entity_type: 'payment',
      entity_id: payment.payment_id,
      secondary_ids: undefined,
      planted_fields: 'payment_amount',
      planted_values_summary: `High-value payment: ${payment.payment_amount}`,
      expected_flag: true,
      notes: `Payment ${payment.payment_id} is high-value: ${payment.payment_amount}`,
    });
  }
}

