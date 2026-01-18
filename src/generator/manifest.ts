import type { GeneratedData } from './baseGenerator';
import type { GeneratorConfig } from './baseGenerator';
import type { AnomalyConfig } from '../anomalies/anomalyInjection';
import type { PolicyConfig } from '../scenarios/types';
import type { AnomalyTruthRecord } from '../anomalies/anomalyInjection';

// ============================================================================
// Manifest Types
// ============================================================================

export interface Manifest {
  seed: string | number;
  dateRange: {
    startYear: number;
    endYear: number;
  };
  packName?: string;
  counts: {
    vendors: number;
    purchaseOrders: number;
    grns: number;
    invoices: number;
    payments: number;
    prHeaders?: number;
    prLines?: number;
    quotations?: number;
    contracts?: number;
    roleMaster?: number;
    prWorkflowLogs?: number;
    poWorkflowLogs?: number;
    paymentWorkflowLogs?: number;
    vendorBankChangeLogs?: number;
    poChangeLogs?: number;
    truthRecords?: number;
  };
  anomalyConfig?: AnomalyConfig;
  policyConfig?: PolicyConfig;
  expectedExceptionCountsByTestStep: Record<string, number>;
}

// ============================================================================
// Manifest Generator
// ============================================================================

/**
 * Generates manifest from generated data and configuration
 */
export function generateManifest(
  data: GeneratedData & { truthRecords?: AnomalyTruthRecord[] },
  config: GeneratorConfig,
  packName?: string,
  anomalyConfig?: AnomalyConfig,
  policyConfig?: PolicyConfig
): Manifest {
  const startYear = config.startYear || new Date().getFullYear() - 1;
  const endYear = config.endYear || new Date().getFullYear();

  // Count exceptions by test step from truth records
  const expectedExceptionCountsByTestStep: Record<string, number> = {};
  if (data.truthRecords) {
    for (const record of data.truthRecords) {
      const testStepId = record.test_step_id;
      expectedExceptionCountsByTestStep[testStepId] = (expectedExceptionCountsByTestStep[testStepId] || 0) + 1;
    }
  }

  const manifest: Manifest = {
    seed: config.seed,
    dateRange: {
      startYear,
      endYear,
    },
    packName: packName,
    counts: {
      vendors: data.vendors.length,
      purchaseOrders: data.purchaseOrders.length,
      grns: data.grns.length,
      invoices: data.invoices.length,
      payments: data.payments.length,
      prHeaders: data.prHeaders?.length,
      prLines: data.prLines?.length,
      quotations: data.quotations?.length,
      contracts: data.contracts?.length,
      roleMaster: data.roleMaster?.length,
      prWorkflowLogs: data.prWorkflowLogs?.length,
      poWorkflowLogs: data.poWorkflowLogs?.length,
      paymentWorkflowLogs: data.paymentWorkflowLogs?.length,
      vendorBankChangeLogs: data.vendorBankChangeLogs?.length,
      poChangeLogs: data.poChangeLogs?.length,
      truthRecords: data.truthRecords?.length,
    },
    anomalyConfig: anomalyConfig ? expandAnomalyConfig(anomalyConfig) : undefined,
    policyConfig: policyConfig ? expandPolicyConfig(policyConfig) : undefined,
    expectedExceptionCountsByTestStep,
  };

  return manifest;
}

/**
 * Expands anomaly config to include all fields (even if undefined)
 */
function expandAnomalyConfig(config: AnomalyConfig): AnomalyConfig {
  return {
    seed: config.seed,
    missing_pan_pct: config.missing_pan_pct,
    duplicate_vendor_pan_pct: config.duplicate_vendor_pan_pct,
    duplicate_vendor_bank_pct: config.duplicate_vendor_bank_pct,
    vendor_without_approval_pct: config.vendor_without_approval_pct,
    bank_change_unverified_pct: config.bank_change_unverified_pct,
    inactive_vendor_used_pct: config.inactive_vendor_used_pct,
    duplicate_invoice_number_pct: config.duplicate_invoice_number_pct,
    invoice_without_grn_pct: config.invoice_without_grn_pct,
    payment_before_invoice_pct: config.payment_before_invoice_pct,
  };
}

/**
 * Expands policy config to include all fields (even if undefined)
 */
function expandPolicyConfig(config: PolicyConfig): PolicyConfig {
  return {
    goods_require_grn: config.goods_require_grn,
    service_allow_without_grn: config.service_allow_without_grn,
    allow_service_po_without_pr: config.allow_service_po_without_pr,
    require_pr_for_goods: config.require_pr_for_goods,
    approval_threshold_amount: config.approval_threshold_amount,
    multi_level_approval_threshold: config.multi_level_approval_threshold,
    executive_approval_threshold: config.executive_approval_threshold,
    tender_threshold: config.tender_threshold,
    single_quote_threshold: config.single_quote_threshold,
    three_quote_threshold: config.three_quote_threshold,
    require_pan_for_vendor: config.require_pan_for_vendor,
    require_gstin_for_vendor: config.require_gstin_for_vendor,
    require_bank_verification: config.require_bank_verification,
    payment_terms_days: config.payment_terms_days,
    early_payment_discount_pct: config.early_payment_discount_pct,
    invoice_matching_required: config.invoice_matching_required,
    tolerance_amount: config.tolerance_amount,
    max_po_amount: config.max_po_amount,
    require_quality_check: config.require_quality_check,
    require_delivery_note: config.require_delivery_note,
  };
}

/**
 * Writes manifest to JSON file
 */
export async function writeManifest(manifest: Manifest, outputPath: string): Promise<void> {
  const fs = await import('fs/promises');
  const jsonContent = JSON.stringify(manifest, null, 2);
  await fs.writeFile(outputPath, jsonContent, 'utf-8');
}

/**
 * Synchronous version for Node.js fs
 */
export function writeManifestSync(manifest: Manifest, outputPath: string): void {
  const fs = require('fs');
  const jsonContent = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(outputPath, jsonContent, 'utf-8');
}

