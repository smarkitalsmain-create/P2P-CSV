import { allScenarioPacks } from '../scenarios';

// ============================================================================
// Test Step Metadata
// ============================================================================

export interface TestStepMeta {
  name: string;
  processArea: string;
  requiredTables: string[]; // Tables needed for this test step
}

/**
 * Map of TS-ID to test step metadata
 * Generated from all scenario packs to ensure consistency
 */
export const testStepMeta: Map<string, TestStepMeta> = new Map();

/**
 * Helper function to determine required tables for a test step based on pack and scenario
 */
function getRequiredTablesForTestStep(
  packName: string,
  scenarioId: string
): string[] {
  // Base tables based on pack
  const packTableMap: Record<string, string[]> = {
    vendor_master_pack: ['vendors'],
    procurement_pack: ['vendors', 'po', 'pr'],
    pr_controls_pack: ['pr', 'po', 'vendors'],
    po_controls_pack: ['po', 'pr', 'vendors'],
    grn_controls_pack: ['grn', 'po'],
    invoice_pack: ['invoice', 'po', 'grn', 'vendors'],
    payment_pack: ['payment', 'invoice', 'vendors'],
    fraud_sod_pack: ['vendors', 'po', 'invoice', 'payment'], // Fraud/SOD checks multiple entities
  };

  // Default tables based on pack
  let baseTables = packTableMap[packName] || ['vendors', 'po'];

  // Special cases for specific test steps that need additional tables
  const specialCases: Record<string, string[]> = {
    // Vendor master pack - some tests check usage in transactions
    'TS-012': ['vendors', 'po', 'invoice', 'payment'], // Inactive vendor used
    'TS-008': ['vendors', 'po'], // Mixed vendor compliance issues
    'TS-010': ['vendors', 'po', 'invoice'], // High-risk vendor master
    
    // PR controls pack - PR -> PO linkage
    'TS-044': ['pr', 'po', 'vendors'], // PR without approval
    'TS-046': ['pr', 'po', 'vendors'], // PR bypass
    'TS-060': ['pr', 'po', 'vendors'], // PR audit
    
    // PO controls pack - PO with vendor/pr checks
    'TS-063': ['po', 'vendors'], // PO with inactive vendors
    'TS-064': ['po', 'pr', 'vendors'], // PO without PR
    'TS-071': ['po', 'pr', 'vendors'], // PO threshold bypass
    
    // GRN controls pack
    'TS-082': ['grn', 'po'], // GRN without PO
    'TS-085': ['grn', 'po'], // GRN delayed receipt
    'TS-088': ['grn', 'po'], // GRN partial receipt
    
    // Invoice pack - invoice with various checks
    'TS-117': ['invoice', 'po', 'grn', 'vendors'], // Invoice without GRN
    'TS-118': ['invoice', 'po'], // Duplicate invoice numbers
    'TS-120': ['invoice', 'vendors'], // Invoice vendor compliance
    'TS-121': ['invoice', 'po', 'vendors'], // Invoice approval violations
    'TS-132': ['invoice', 'vendors', 'po'], // Invoice with vendor risk
    
    // Payment pack - payment with invoice checks
    'TS-137': ['payment', 'invoice', 'vendors'], // Payment before invoice
    'TS-139': ['payment', 'invoice', 'vendors'], // Early payment discount
    'TS-142': ['payment', 'invoice', 'vendors'], // Payment approval violations
    'TS-150': ['payment', 'invoice', 'vendors'], // Payment high volume
    
    // Fraud/SOD pack - cross-entity checks
    'TS-171': ['po', 'pr'], // SOD violation - same user creates and approves
    'TS-172': ['vendors', 'payment'], // SOD violation - vendor and payment
    'TS-173': ['payment'], // Fraud - duplicate payments
    'TS-174': ['vendors'], // Fraud - fake vendors
    'TS-175': ['payment', 'vendors'], // Fraud - payment to inactive vendors
    'TS-176': ['invoice', 'grn'], // Fraud - invoice without GRN
    'TS-177': ['payment', 'invoice'], // Fraud - payment before invoice
    'TS-178': ['pr', 'po', 'grn', 'invoice', 'payment'], // SOD violation - procurement cycle
    'TS-179': ['vendors'], // Fraud - duplicate vendor bank accounts
    'TS-180': ['vendors', 'po', 'grn', 'invoice', 'payment'], // Comprehensive fraud audit
  };

  // Check for special cases first
  if (specialCases[scenarioId]) {
    return specialCases[scenarioId];
  }

  return baseTables;
}

/**
 * Initialize testStepMeta from all scenario packs
 */
function initializeTestStepMeta(): void {
  for (const pack of allScenarioPacks) {
    for (const scenario of pack.scenarios) {
      testStepMeta.set(scenario.scenarioId, {
        name: scenario.name,
        processArea: pack.packName,
        requiredTables: getRequiredTablesForTestStep(pack.packName, scenario.scenarioId),
      });
    }
  }
}

// Initialize on module load
initializeTestStepMeta();

// ============================================================================
// Anomaly to Test Steps Mapping
// ============================================================================

/**
 * Map of anomaly key to array of TS IDs that test this anomaly
 * This ensures anomalies map to the correct test steps
 */
export const anomalyToTestSteps: Record<string, string[]> = {
  // Vendor Master Anomalies
  missing_pan_gst: ['TS-002', 'TS-003'], // Missing PAN/GST compliance
  duplicate_vendor_pan: ['TS-004'], // Duplicate PAN detection
  duplicate_vendor_bank: ['TS-005', 'TS-179'], // Duplicate bank account
  vendor_without_approval: ['TS-006'], // Vendor created without approval
  bank_change_unverified: ['TS-007'], // Bank changed but not verified
  inactive_vendor_used: ['TS-012', 'TS-063', 'TS-132', 'TS-142', 'TS-175'], // Inactive vendor used (context-specific TS IDs)
  
  // PR Anomalies
  pr_without_approval: ['TS-041', 'TS-044'], // PR without approval
  pr_bypass: ['TS-046'], // PR bypass scenarios
  pr_duplicate: ['TS-052'], // PR duplicate checks
  pr_threshold_violation: ['TS-060'], // PR threshold violations
  
  // PO Anomalies
  po_approval_violation: ['TS-061', 'TS-062'], // PO approval violations
  po_inactive_vendor: ['TS-063'], // PO with inactive vendors
  po_without_pr: ['TS-064'], // PO without PR
  po_threshold_bypass: ['TS-071'], // PO threshold bypass
  
  // GRN Anomalies
  grn_without_po: ['TS-081', 'TS-082'], // GRN without PO
  grn_delayed_receipt: ['TS-085'], // GRN delayed receipt
  grn_partial_receipt: ['TS-088'], // GRN partial receipt
  
  // Invoice Anomalies
  invoice_without_grn: ['TS-116', 'TS-117', 'TS-176'], // Invoice without GRN
  duplicate_invoice_number: ['TS-118'], // Duplicate invoice numbers
  invoice_vendor_compliance: ['TS-120'], // Invoice vendor compliance
  invoice_approval_violation: ['TS-121'], // Invoice approval violations
  
  // Payment Anomalies
  payment_before_invoice: ['TS-136', 'TS-137', 'TS-177'], // Payment before invoice date
  payment_early_discount: ['TS-139'], // Early payment discounts
  payment_approval_violation: ['TS-142'], // Payment approval violations
  payment_high_volume: ['TS-150'], // Payment high volume
};

/**
 * Get test step IDs for an anomaly type
 * Returns array of TS IDs that test this anomaly
 */
export function getTestStepIdsForAnomaly(anomalyKey: string): string[] {
  return anomalyToTestSteps[anomalyKey] || [];
}

/**
 * Get test step metadata for a TS ID
 * Returns metadata or null if not found
 */
export function getTestStepMeta(tsId: string): TestStepMeta | null {
  return testStepMeta.get(tsId) || null;
}

/**
 * Get test step info (id, name, processArea) for a TS ID
 * Compatible with existing getTestStepInfo function signature
 */
export function getTestStepInfo(tsId: string): {
  testStepId: string;
  testStepName: string;
  processArea: string;
} | null {
  const meta = testStepMeta.get(tsId);
  if (!meta) return null;
  
  return {
    testStepId: tsId,
    testStepName: meta.name,
    processArea: meta.processArea,
  };
}
