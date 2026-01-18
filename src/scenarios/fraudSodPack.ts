import type { ScenarioPack } from './types';

/**
 * Fraud and SOD (Segregation of Duties) Pack (TS-171 to TS-180)
 * Scenarios focused on fraud detection and segregation of duties
 */
export const fraudSodPack: ScenarioPack = {
  packName: 'fraud_sod_pack',
  packDescription: 'Fraud detection and segregation of duties scenarios',
  scenarios: [
    // TS-171: SOD violation - same user creates and approves
    {
      scenarioId: 'TS-171',
      name: 'SOD Violation - Create and Approve',
      description: 'Same user creates and approves PO',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        require_pr_for_goods: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 200, max: 300, description: 'SOD create-approve exceptions' },
    },

    // TS-172: SOD violation - vendor and payment
    {
      scenarioId: 'TS-172',
      name: 'SOD Violation - Vendor and Payment',
      description: 'Same user creates vendor and processes payment',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_bank_verification: true,
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        vendor_without_approval_pct: 15,
        bank_change_unverified_pct: 20,
      },
      expectedExceptionVolume: { min: 175, max: 225, description: 'SOD vendor-payment exceptions' },
    },

    // TS-173: Fraud - duplicate payments
    {
      scenarioId: 'TS-173',
      name: 'Fraud - Duplicate Payments',
      description: 'Multiple payments for same invoice',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 100, max: 200, description: 'Duplicate payment exceptions' },
    },

    // TS-174: Fraud - fake vendors
    {
      scenarioId: 'TS-174',
      name: 'Fraud - Fake Vendors',
      description: 'Vendors with missing or invalid credentials',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
        require_gstin_for_vendor: true,
        require_bank_verification: true,
      },
      anomalyConfig: {
        missing_pan_pct: 20,
        vendor_without_approval_pct: 25,
        bank_change_unverified_pct: 30,
      },
      expectedExceptionVolume: { min: 375, max: 450, description: 'Fake vendor exceptions' },
    },

    // TS-175: Fraud - payment to inactive vendors
    {
      scenarioId: 'TS-175',
      name: 'Fraud - Payment to Inactive Vendors',
      description: 'Payments made to inactive vendors',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_pan_for_vendor: true,
      },
      anomalyConfig: {
        inactive_vendor_used_pct: 10,
      },
      expectedExceptionVolume: { min: 300, max: 375, description: 'Inactive vendor payment exceptions' },
    },

    // TS-176: Fraud - invoice without GRN
    {
      scenarioId: 'TS-176',
      name: 'Fraud - Invoice Without GRN',
      description: 'Invoices paid without GRN (policy violation)',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        goods_require_grn: true,
      },
      anomalyConfig: {
        invoice_without_grn_pct: 15,
      },
      expectedExceptionVolume: { min: 405, max: 480, description: 'Invoice without GRN fraud exceptions' },
    },

    // TS-177: Fraud - payment before invoice
    {
      scenarioId: 'TS-177',
      name: 'Fraud - Payment Before Invoice',
      description: 'Payments made before invoice date',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        payment_terms_days: 30,
      },
      anomalyConfig: {
        payment_before_invoice_pct: 8,
      },
      expectedExceptionVolume: { min: 216, max: 260, description: 'Payment before invoice fraud exceptions' },
    },

    // TS-178: SOD violation - procurement cycle
    {
      scenarioId: 'TS-178',
      name: 'SOD Violation - Procurement Cycle',
      description: 'Same user handles multiple procurement stages',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        require_pr_for_goods: true,
        goods_require_grn: true,
        invoice_matching_required: true,
      },
      anomalyConfig: {},
      expectedExceptionVolume: { min: 400, max: 500, description: 'SOD procurement cycle exceptions' },
    },

    // TS-179: Fraud - duplicate vendor bank accounts
    {
      scenarioId: 'TS-179',
      name: 'Fraud - Duplicate Vendor Bank Accounts',
      description: 'Multiple vendors sharing bank accounts',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        require_bank_verification: true,
      },
      anomalyConfig: {
        duplicate_vendor_bank_pct: 8,
        bank_change_unverified_pct: 15,
      },
      expectedExceptionVolume: { min: 115, max: 150, description: 'Duplicate bank account fraud exceptions' },
    },

    // TS-180: Comprehensive fraud and SOD audit
    {
      scenarioId: 'TS-180',
      name: 'Comprehensive Fraud and SOD Audit',
      description: 'Comprehensive fraud and SOD detection scenario',
      datasetShape: { vendors: 500, pos: 3000 },
      policyConfig: {
        approval_threshold_amount: 50000,
        require_pr_for_goods: true,
        goods_require_grn: true,
        invoice_matching_required: true,
        require_pan_for_vendor: true,
        require_bank_verification: true,
        payment_terms_days: 30,
      },
      anomalyConfig: {
        missing_pan_pct: 10,
        duplicate_vendor_pan_pct: 3,
        duplicate_vendor_bank_pct: 5,
        vendor_without_approval_pct: 15,
        bank_change_unverified_pct: 20,
        inactive_vendor_used_pct: 8,
        duplicate_invoice_number_pct: 2,
        invoice_without_grn_pct: 12,
        payment_before_invoice_pct: 6,
      },
      expectedExceptionVolume: { min: 1710, max: 2000, description: 'Comprehensive fraud and SOD exceptions' },
    },
  ],
};


