import type { ScenarioPack } from './types';

/**
 * Payment Pack (TS-136 to TS-150)
 * Scenarios focused on payment processing and controls
 */
export const paymentPack: ScenarioPack = {
  packName: 'payment_pack',
  packDescription: 'Payment processing and control scenarios',
  scenarios: [
    // TS-136: Standard payment process
    {
      scenarioId: 'TS-136',
      name: 'Standard Payment Process',
      description: 'Standard payment with all controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
        require_bank_verification: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Minimal payment exceptions' },
    },

    // TS-137: Payment before invoice date
    {
      scenarioId: 'TS-137',
      name: 'Payment Before Invoice Date',
      description: 'Payments made before invoice date',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
      },
      anomalyConfig: {
        payment_before_invoice_pct: 5,
      },
      expectedExceptionVolume: { min: 128, max: 150, description: 'Payment before invoice exceptions' },
    },

    // TS-138: Payment with bank verification
    {
      scenarioId: 'TS-138',
      name: 'Payment Bank Verification',
      description: 'Payments with bank verification issues',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_bank_verification: true,
        payment_terms_days: 30,
      },
      anomalyConfig: {
        bank_change_unverified_pct: 15,
      },
      expectedExceptionVolume: { min: 75, max: 90, description: 'Payment bank verification exceptions' },
    },

    // TS-139: Early payment discounts
    {
      scenarioId: 'TS-139',
      name: 'Early Payment Discounts',
      description: 'Payments with early payment discounts',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
        early_payment_discount_pct: 2,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Early payment discount exceptions' },
    },

    // TS-140: Payment with vendor compliance
    {
      scenarioId: 'TS-140',
      name: 'Payment Vendor Compliance',
      description: 'Payments with vendor compliance issues',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_bank_verification: true,
        payment_terms_days: 30,
      },
      anomalyConfig: {
        missing_pan_pct: 8,
        bank_change_unverified_pct: 12,
        inactive_vendor_used_pct: 5,
      },
      expectedExceptionVolume: { min: 625, max: 750, description: 'Payment vendor compliance exceptions' },
    },

    // TS-141: Payment duplicate detection
    {
      scenarioId: 'TS-141',
      name: 'Payment Duplicate Detection',
      description: 'Detection of duplicate payments',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 50, description: 'Payment duplicate exceptions' },
    },

    // TS-142: Payment approval violations
    {
      scenarioId: 'TS-142',
      name: 'Payment Approval Violations',
      description: 'Payments exceeding approval thresholds',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        payment_terms_days: 30,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'Payment approval violation exceptions' },
    },

    // TS-143: Payment timing controls
    {
      scenarioId: 'TS-143',
      name: 'Payment Timing Controls',
      description: 'Payment timing and terms controls',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
      },
      anomalyConfig: {
        payment_before_invoice_pct: 3,
      },
      expectedExceptionVolume: { min: 77, max: 100, description: 'Payment timing control exceptions' },
    },

    // TS-144: Payment compliance monitoring
    {
      scenarioId: 'TS-144',
      name: 'Payment Compliance Monitoring',
      description: 'Comprehensive payment compliance monitoring',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
        require_bank_verification: true,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        payment_before_invoice_pct: 4,
        bank_change_unverified_pct: 10,
      },
      expectedExceptionVolume: { min: 350, max: 430, description: 'Payment compliance monitoring exceptions' },
    },

    // TS-145: Payment with invoice matching
    {
      scenarioId: 'TS-145',
      name: 'Payment Invoice Matching',
      description: 'Payment-invoice matching requirements',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        invoice_matching_required: true,
        payment_terms_days: 30,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'Payment invoice matching exceptions' },
    },

    // TS-146: Payment baseline scenario
    {
      scenarioId: 'TS-146',
      name: 'Payment Baseline Scenario',
      description: 'Baseline payment control scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 45,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 0, max: 100, description: 'Payment baseline exceptions' },
    },

    // TS-147: Payment with mixed controls
    {
      scenarioId: 'TS-147',
      name: 'Payment Mixed Controls',
      description: 'Payments with mixed control scenarios',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
        require_bank_verification: true,
      },
      anomalyConfig: {
        payment_before_invoice_pct: 3,
        bank_change_unverified_pct: 8,
      },
      expectedExceptionVolume: { min: 275, max: 350, description: 'Payment mixed control exceptions' },
    },

    // TS-148: Payment with vendor risk
    {
      scenarioId: 'TS-148',
      name: 'Payment Vendor Risk',
      description: 'Payments with high-risk vendors',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_bank_verification: true,
        payment_terms_days: 30,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 8,
        bank_change_unverified_pct: 15,
        payment_before_invoice_pct: 4,
      },
      expectedExceptionVolume: { min: 675, max: 800, description: 'Payment vendor risk exceptions' },
    },

    // TS-149: Payment audit scenario
    {
      scenarioId: 'TS-149',
      name: 'Payment Audit Scenario',
      description: 'Comprehensive payment audit scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
        require_bank_verification: true,
        require_pan_for_vendor: true,
        approval_threshold_amount: 50000,
      },
      anomalyConfig: {
        payment_before_invoice_pct: 5,
        bank_change_unverified_pct: 12,
        missing_pan_pct: 8,
        inactive_vendor_used_pct: 5,
      },
      expectedExceptionVolume: { min: 750, max: 900, description: 'Payment audit exceptions' },
    },

    // TS-150: Payment high-volume scenario
    {
      scenarioId: 'TS-150',
      name: 'Payment High-Volume Scenario',
      description: 'High-volume payment processing',
      datasetShape: { vendors: 2000, pos: 15000 },
      policyConfig: {
        payment_terms_days: 30,
      },
      anomalyConfig: {
        payment_before_invoice_pct: 3,
      },
      expectedExceptionVolume: { min: 405, max: 480, description: 'High-volume payment exceptions' },
    },
  ],
};


