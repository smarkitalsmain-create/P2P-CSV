import seedrandom from 'seedrandom';
import type {
  PRHeader,
  PRLine,
  PurchaseOrder,
  GRN,
  Invoice,
  Payment,
  Vendor,
} from '../schemas';
import type { AnomalyTruthRecord } from './anomalyInjection';
import type { ProcessAnomalyConfig } from './processAnomalyInjection';
import {
  injectPRWithoutApproval,
  injectPRBypass,
  injectPRDuplicate,
  injectPRThresholdViolations,
  injectPOApprovalViolations,
  injectPOInactiveVendor,
  injectPOWithoutPR,
  injectPOThresholdBypass,
  injectGRNWithoutPO,
  injectGRNDelayedReceipt,
  injectGRNPartialReceipt,
  injectInvoiceWithoutGRN,
  injectInvoiceVendorCompliance,
  injectInvoiceApprovalViolations,
  injectPaymentBeforeInvoice,
  injectPaymentEarlyDiscount,
  injectPaymentApprovalViolations,
  injectPaymentHighVolume,
} from './processAnomalyInjection';

// ============================================================================
// Main Process Anomaly Injection Function
// ============================================================================

export interface ProcessInjectedData {
  prHeaders: PRHeader[];
  prLines: PRLine[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  invoices: Invoice[];
  payments: Payment[];
  truthRecords: AnomalyTruthRecord[];
}

/**
 * Injects process anomalies into P2P data
 */
export function injectProcessAnomalies(
  data: {
    prHeaders: PRHeader[];
    prLines: PRLine[];
    purchaseOrders: PurchaseOrder[];
    grns: GRN[];
    invoices: Invoice[];
    payments: Payment[];
    vendors: Vendor[];
  },
  config: ProcessAnomalyConfig
): ProcessInjectedData {
  // Initialize seeded random number generator
  const rng = seedrandom(String(config.seed));
  const random = () => rng();

  const truthRecords: AnomalyTruthRecord[] = [];

  // Clone data to avoid mutating original
  const prHeaders = [...data.prHeaders];
  const prLines = [...data.prLines];
  const purchaseOrders = [...data.purchaseOrders];
  const grns = [...data.grns];
  const invoices = [...data.invoices];
  const payments = [...data.payments];

  // PR Anomalies
  if (config.pr_without_approval_pct) {
    injectPRWithoutApproval(
      prHeaders,
      config.pr_without_approval_pct,
      config.pr_approval_threshold || 50000,
      random,
      truthRecords
    );
  }

  if (config.pr_bypass_pct) {
    injectPRBypass(purchaseOrders, prHeaders, config.pr_bypass_pct, random, truthRecords);
  }

  if (config.pr_duplicate_pct) {
    injectPRDuplicate(prHeaders, config.pr_duplicate_pct, random, truthRecords);
  }

  if (config.pr_threshold_violation_pct) {
    injectPRThresholdViolations(
      prHeaders,
      config.pr_threshold_violation_pct,
      config.pr_approval_threshold || 50000,
      random,
      truthRecords
    );
  }

  // PO Anomalies
  if (config.po_approval_violation_pct) {
    injectPOApprovalViolations(
      purchaseOrders,
      config.po_approval_violation_pct,
      config.po_approval_threshold || 50000,
      random,
      truthRecords
    );
  }

  if (config.po_inactive_vendor_pct) {
    injectPOInactiveVendor(
      purchaseOrders,
      data.vendors,
      config.po_inactive_vendor_pct,
      random,
      truthRecords
    );
  }

  if (config.po_without_pr_pct) {
    injectPOWithoutPR(purchaseOrders, prLines, config.po_without_pr_pct, random, truthRecords);
  }

  if (config.po_threshold_bypass_pct) {
    injectPOThresholdBypass(
      purchaseOrders,
      config.po_threshold_bypass_pct,
      config.po_approval_threshold || 50000,
      random,
      truthRecords
    );
  }

  // GRN Anomalies
  if (config.grn_without_po_pct) {
    injectGRNWithoutPO(grns, purchaseOrders, config.grn_without_po_pct, random, truthRecords);
  }

  if (config.grn_delayed_receipt_pct) {
    injectGRNDelayedReceipt(
      grns,
      purchaseOrders,
      config.grn_delayed_receipt_pct,
      config.grn_delay_days_threshold || 90,
      random,
      truthRecords
    );
  }

  if (config.grn_partial_receipt_pct) {
    injectGRNPartialReceipt(grns, config.grn_partial_receipt_pct, random, truthRecords);
  }

  // Invoice Anomalies
  if (config.invoice_without_grn_pct) {
    injectInvoiceWithoutGRN(invoices, config.invoice_without_grn_pct, random, truthRecords);
  }

  if (config.invoice_vendor_compliance_pct) {
    injectInvoiceVendorCompliance(
      invoices,
      data.vendors,
      config.invoice_vendor_compliance_pct,
      random,
      truthRecords
    );
  }

  if (config.invoice_approval_violation_pct) {
    injectInvoiceApprovalViolations(
      invoices,
      config.invoice_approval_violation_pct,
      config.invoice_approval_threshold || 50000,
      random,
      truthRecords
    );
  }

  // Payment Anomalies
  if (config.payment_before_invoice_pct) {
    injectPaymentBeforeInvoice(
      payments,
      invoices,
      config.payment_before_invoice_pct,
      random,
      truthRecords
    );
  }

  if (config.payment_early_discount_pct) {
    injectPaymentEarlyDiscount(payments, invoices, config.payment_early_discount_pct, random, truthRecords);
  }

  if (config.payment_approval_violation_pct) {
    injectPaymentApprovalViolations(
      payments,
      config.payment_approval_violation_pct,
      config.payment_approval_threshold || 50000,
      random,
      truthRecords
    );
  }

  if (config.payment_high_volume_pct) {
    injectPaymentHighVolume(payments, config.payment_high_volume_pct, random, truthRecords);
  }

  return {
    prHeaders,
    prLines,
    purchaseOrders,
    grns,
    invoices,
    payments,
    truthRecords,
  };
}


